/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Real multi-key failover engine.
 *
 * Every attempt hits the live upstream provider. If a key comes back with an
 * auth / quota / rate-limit / server error we mark it in the database and
 * immediately move to the next active key — the client never sees the seam.
 */

import { prisma } from "./prisma";
import { decryptApiKey } from "./crypto";
import { openChatStream, completeChat, type ChatTurn, type StreamDelta } from "./ai-client";

export interface FailoverExecutionResult {
  success: boolean;
  keyId: string;
  keyMask: string;
  response: string;
  tokensUsed: number;
  promptTokens: number;
  completionTokens: number;
  attempts: number;
}

export interface StreamFailoverResult {
  ok: boolean;
  keyId?: string;
  keyMask?: string;
  attempts: number;
  stream?: AsyncGenerator<StreamDelta, void, unknown>;
  message?: string;
  statusCode?: number;
}

/** Errors that mean "this key is spent, try the next one". */
function classifyKeyError(status: number, message: string): "exhausted" | "error" {
  const m = message.toLowerCase();
  const quota =
    status === 429 ||
    m.includes("quota") ||
    m.includes("rate limit") ||
    m.includes("insufficient") ||
    m.includes("credit") ||
    m.includes("billing") ||
    m.includes("exceeded");
  return quota ? "exhausted" : "error";
}

/** Rough token estimate — 1 word ≈ 1.3 tokens. */
function estimateTokens(text: string): number {
  const words = text.trim() ? text.trim().split(/\s+/).length : 0;
  return Math.max(1, Math.round(words * 1.3));
}

async function loadProviderWithKeys(providerId: string) {
  const provider = await prisma.provider.findUnique({
    where: { id: providerId },
    include: {
      apiKeys: {
        where: { status: "active" },
        orderBy: [{ usageCount: "asc" }, { lastUsedAt: "asc" }, { createdAt: "asc" }],
      },
    },
  });

  if (!provider) throw new Error("پروایدر انتخاب‌شده پیدا نشد.");
  if (!provider.isActive) throw new Error("این پروایدر توسط مدیر سیستم غیرفعال شده است.");
  if (provider.apiKeys.length === 0) throw new Error("برای این پروایدر هیچ کلید فعالی ثبت نشده است.");

  return provider;
}

/**
 * Opens a real streaming completion, rotating through the provider's keys
 * until one of them returns a live stream.
 */
export async function streamWithFailover(options: {
  providerId: string;
  model: string;
  messages: ChatTurn[];
  userId?: string;
  signal?: AbortSignal;
}): Promise<StreamFailoverResult> {
  const { providerId, model, messages, userId, signal } = options;

  const provider = await loadProviderWithKeys(providerId);

  let attempts = 0;
  let lastMessage = "هیچ کلیدی پاسخ نداد.";
  let lastStatus = 0;

  for (const keyRecord of provider.apiKeys) {
    attempts++;
    const keyMask = keyRecord.keyMask || "••••";

    let plainKey: string;
    try {
      plainKey = decryptApiKey(keyRecord.encryptedApiKey);
    } catch {
      lastMessage = "رمزگشایی کلید با خطا مواجه شد. کلید را دوباره ثبت کنید.";
      await prisma.providerApiKey.update({
        where: { id: keyRecord.id },
        data: { status: "error", lastErrorMessage: "Decryption failed (BYOK_ENCRYPTION_KEY mismatch?)" },
      });
      continue;
    }

    const opened = await openChatStream(
      { type: provider.type, apiFormat: provider.apiFormat, apiKey: plainKey, baseUrl: provider.baseUrl, model },
      messages,
      { signal },
    );

    if (!opened.ok || !opened.stream) {
      // An aborted request is the user pressing stop — not a key failure.
      if (signal?.aborted) throw new Error("ABORTED");

      lastMessage = opened.message || "خطای نامشخص از سمت پروایدر.";
      lastStatus = opened.status;

      await prisma.providerApiKey.update({
        where: { id: keyRecord.id },
        data: {
          status: classifyKeyError(opened.status, lastMessage),
          lastErrorMessage: lastMessage.slice(0, 900),
        },
      });

      console.warn(`[Failover] key ${keyMask} failed (${opened.status}): ${lastMessage}`);
      continue;
    }

    // Success — wrap the stream so usage is recorded once it finishes.
    const upstream = opened.stream;
    let accumulated = "";

    async function* tracked(): AsyncGenerator<StreamDelta, void, unknown> {
      try {
        for await (const delta of upstream) {
          // Only the answer text counts towards the token estimate — reasoning
          // is reported separately and would skew the numbers.
          if (delta.kind === "content") accumulated += delta.text;
          yield delta;
        }
      } finally {
        const promptTokens = estimateTokens(messages.map((m) => m.content).join(" "));
        const completionTokens = estimateTokens(accumulated);
        try {
          await prisma.providerApiKey.update({
            where: { id: keyRecord.id },
            data: { usageCount: { increment: 1 }, lastUsedAt: new Date(), lastErrorMessage: null },
          });
          if (userId) {
            await prisma.usageLog.create({
              data: {
                userId,
                providerId,
                model,
                promptTokens,
                completionTokens,
                tokensUsed: promptTokens + completionTokens,
              },
            });
          }
        } catch (err) {
          console.error("[Failover] failed to record usage:", err);
        }
      }
    }

    return { ok: true, keyId: keyRecord.id, keyMask, attempts, stream: tracked() };
  }

  return {
    ok: false,
    attempts,
    statusCode: lastStatus,
    message: `تمام کلیدهای پروایدر «${provider.name}» با خطا مواجه شدند. آخرین خطا: ${lastMessage}`,
  };
}

/**
 * Non-streaming variant. Kept for callers that need the whole answer at once
 * (phase test scripts). Uses the real API — no mock responses.
 */
export async function executeWithFailover(options: {
  providerId: string;
  model: string;
  prompt: string;
  userId?: string;
  simulateFirstKeyFailure?: boolean;
  simulatedErrorOnKeyMask?: string;
}): Promise<FailoverExecutionResult> {
  const { providerId, model, prompt, userId, simulateFirstKeyFailure } = options;

  const provider = await loadProviderWithKeys(providerId);

  let attempts = 0;
  let lastError: Error | null = null;

  for (const keyRecord of provider.apiKeys) {
    attempts++;
    const keyMask = keyRecord.keyMask || "••••";

    try {
      if (simulateFirstKeyFailure && attempts === 1) {
        throw new Error("Simulated failure on first key");
      }

      const plainKey = decryptApiKey(keyRecord.encryptedApiKey);

      const result = await completeChat(
        { type: provider.type, apiFormat: provider.apiFormat, apiKey: plainKey, baseUrl: provider.baseUrl, model },
        [{ role: "user", content: prompt }],
        { maxTokens: 2048 },
      );

      if (!result.ok) {
        const err = new Error(result.message || "Provider error");
        (err as Error & { status?: number }).status = result.status;
        throw err;
      }

      const promptTokens = estimateTokens(prompt);
      const completionTokens = estimateTokens(result.text);
      const tokensUsed = promptTokens + completionTokens;

      await prisma.providerApiKey.update({
        where: { id: keyRecord.id },
        data: { usageCount: { increment: 1 }, lastUsedAt: new Date(), lastErrorMessage: null },
      });

      if (userId) {
        await prisma.usageLog.create({
          data: { userId, providerId, model, promptTokens, completionTokens, tokensUsed },
        });
      }

      return {
        success: true,
        keyId: keyRecord.id,
        keyMask,
        response: result.text,
        tokensUsed,
        promptTokens,
        completionTokens,
        attempts,
      };
    } catch (err: unknown) {
      lastError = err as Error;
      const errMsg = (err as Error).message || "Unknown error";
      const status = (err as Error & { status?: number }).status ?? 0;

      await prisma.providerApiKey.update({
        where: { id: keyRecord.id },
        data: { status: classifyKeyError(status, errMsg), lastErrorMessage: errMsg.slice(0, 900) },
      });

      console.warn(`[Failover] key ${keyMask} failed. Trying next active key...`);
    }
  }

  throw new Error(
    `ALL_KEYS_EXHAUSTED: تمام کلیدهای پروایدر با خطا مواجه شدند. آخرین خطا: ${lastError?.message || "نامشخص"}`,
  );
}
