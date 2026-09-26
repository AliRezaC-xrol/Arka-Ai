/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { decryptApiKey } from "@/lib/crypto";
import { streamWithFailover } from "@/lib/provider-failover";
import {
  generateImage,
  isImageModel,
  normalizeType,
  openChatStream,
  type ChatTurn,
  type StreamDelta,
} from "@/lib/ai-client";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

/** How many previous turns to send upstream as context. */
const HISTORY_LIMIT = 24;

function generateAutoTitle(text: string): string {
  const clean = text.replace(/[\r\n]+/g, " ").trim();
  const words = clean.split(/\s+/).slice(0, 6);
  return words.join(" ").slice(0, 50) || "گفتگوی جدید";
}

function sse(payload: Record<string, unknown>): string {
  return `data: ${JSON.stringify(payload)}\n\n`;
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.isBanned) {
    return NextResponse.json(
      {
        error: "حساب شما مسدود شده است",
        banned: true,
        banReason: user.banReason || user.bannedReason || "مسدودسازی توسط مدیر سیستم",
      },
      { status: 403 },
    );
  }

  if (user.timeoutUntil && new Date(user.timeoutUntil) > new Date()) {
    const diffMs = new Date(user.timeoutUntil).getTime() - Date.now();
    const diffMinutes = Math.max(1, Math.ceil(diffMs / (60 * 1000)));
    return NextResponse.json(
      {
        error: `شما موقتاً محدود شده‌اید، ${diffMinutes} دقیقه دیگر می‌توانید استفاده کنید`,
        timedOut: true,
        timeoutUntil: user.timeoutUntil,
        timeoutReason: user.timeoutReason,
      },
      { status: 429 },
    );
  }

  let body: {
    conversationId?: string;
    message: string;
    model?: string;
    providerId?: string;
    userProviderId?: string;
    attachment?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const prompt = (body.message || "").trim();
  if (!prompt && !body.attachment) {
    return NextResponse.json({ error: "Message is required" }, { status: 400 });
  }

  // The model id arrives as the raw provider model id (e.g. "gpt-4o").
  const model = (body.model || "").trim();

  if (!model) {
    return NextResponse.json(
      { error: "هیچ مدلی انتخاب نشده است. لطفاً از فهرست مدل‌ها یک مدل انتخاب کنید." },
      { status: 400 },
    );
  }

  /* ---------- Resolve the target provider ---------- */

  type Target =
    | {
        kind: "user";
        providerId: string;
        name: string;
        type: string;
        apiFormat: string | null;
        baseUrl: string | null;
        apiKey: string;
      }
    | { kind: "site"; providerId: string; name: string };

  let target: Target | null = null;

  if (body.userProviderId) {
    const userProv = await prisma.userProvider.findFirst({
      where: { id: body.userProviderId, userId: user.id },
    });
    if (!userProv) {
      return NextResponse.json({ error: "پروایدر شخصی انتخاب‌شده پیدا نشد." }, { status: 404 });
    }
    if (userProv.status !== "connected") {
      return NextResponse.json(
        {
          error: `پروایدر شخصی «${userProv.name}» هنوز تأیید نشده است. لطفاً در بخش کلیدهای من، اتصال آن را آزمایش و تأیید کنید.`,
        },
        { status: 400 },
      );
    }
    let apiKey: string;
    try {
      apiKey = decryptApiKey(userProv.encryptedApiKey);
    } catch {
      return NextResponse.json(
        { error: "رمزگشایی کلید API ناموفق بود. لطفاً کلید را دوباره ثبت کنید." },
        { status: 500 },
      );
    }
    target = {
      kind: "user",
      providerId: userProv.id,
      name: userProv.name,
      type: normalizeType(userProv.providerType),
      apiFormat: userProv.apiFormat,
      baseUrl: userProv.baseUrl,
      apiKey,
    };
  } else if (body.providerId) {
    const siteProvider = await prisma.provider.findUnique({ where: { id: body.providerId } });
    if (!siteProvider) {
      return NextResponse.json({ error: "پروایدر انتخاب‌شده پیدا نشد." }, { status: 404 });
    }
    if (!siteProvider.isActive) {
      return NextResponse.json({ error: "این پروایدر توسط مدیر سیستم غیرفعال شده است." }, { status: 400 });
    }
    target = { kind: "site", providerId: siteProvider.id, name: siteProvider.name };
  }

  if (!target) {
    return NextResponse.json(
      {
        error:
          "برای این مدل هیچ پروایدر فعالی متصل نیست. لطفاً یک مدل از فهرست انتخاب کنید، یا در بخش «کلیدهای من» کلید API خودتان را اضافه کنید.",
      },
      { status: 400 },
    );
  }

  /* ---------- Resolve or create the conversation ---------- */

  let conversationId = body.conversationId;
  let isNewConversation = false;
  let conversationTitle = "";

  if (conversationId) {
    const existing = await prisma.conversation.findFirst({
      where: { id: conversationId, userId: user.id },
    });
    if (!existing) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    conversationTitle = existing.title;
  } else {
    isNewConversation = true;
    conversationTitle = generateAutoTitle(prompt || "تصویر ارسالی");
    const newConv = await prisma.conversation.create({
      data: { userId: user.id, title: conversationTitle, isPinned: false },
    });
    conversationId = newConv.id;
  }

  const userMessage = await prisma.message.create({
    data: {
      conversationId,
      role: "user",
      content: prompt,
      contentType: body.attachment ? "image" : "text",
    },
  });

  /* ---------- Image generation path ---------- */

  if (isImageModel(model)) {
    // Image generation always needs a concrete key, so resolve one either from
    // the user's BYOK provider or from the site provider's active key pool.
    let imageTarget: {
      type: string;
      apiFormat: string | null;
      apiKey: string;
      baseUrl: string | null;
      name: string;
    };

    if (target.kind === "user") {
      imageTarget = {
        type: target.type,
        apiFormat: target.apiFormat,
        apiKey: target.apiKey,
        baseUrl: target.baseUrl,
        name: target.name,
      };
    } else {
      const provider = await prisma.provider.findUnique({
        where: { id: target.providerId },
        include: { apiKeys: { where: { status: "active" }, orderBy: { usageCount: "asc" }, take: 1 } },
      });
      if (!provider || provider.apiKeys.length === 0) {
        return NextResponse.json({ error: "برای این پروایدر هیچ کلید فعالی ثبت نشده است." }, { status: 400 });
      }
      let key = "";
      try {
        key = decryptApiKey(provider.apiKeys[0].encryptedApiKey);
      } catch {
        return NextResponse.json({ error: "رمزگشایی کلید API ناموفق بود." }, { status: 500 });
      }
      imageTarget = {
        type: normalizeType(provider.type),
        apiFormat: provider.apiFormat,
        apiKey: key,
        baseUrl: provider.baseUrl,
        name: provider.name,
      };
    }

    const imageResult = await generateImage(
      { type: imageTarget.type, apiKey: imageTarget.apiKey, baseUrl: imageTarget.baseUrl, model },
      prompt,
    );

    if (!imageResult.ok || !imageResult.imageUrl) {
      const failMsg = imageResult.message || "تولید تصویر ناموفق بود.";
      const assistantMsg = await prisma.message.create({
        data: { conversationId, role: "assistant", content: `⚠️ ${failMsg}`, contentType: "text" },
      });
      await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
      return NextResponse.json(
        {
          error: failMsg,
          conversationId,
          conversationTitle,
          isNewConversation,
          userMessageId: userMessage.id,
          assistantMessageId: assistantMsg.id,
        },
        { status: 502 },
      );
    }

    const assistantContent = JSON.stringify({
      imageUrl: imageResult.imageUrl,
      caption: `تصویر تولیدشده با مدل ${model}`,
    });

    const assistantMsg = await prisma.message.create({
      data: { conversationId, role: "assistant", content: assistantContent, contentType: "image" },
    });

    await prisma.conversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });

    return NextResponse.json({
      type: "image",
      conversationId,
      conversationTitle,
      isNewConversation,
      userMessageId: userMessage.id,
      assistantMessageId: assistantMsg.id,
      imageUrl: imageResult.imageUrl,
      caption: `تصویر تولیدشده با مدل ${model}`,
    });
  }

  /* ---------- Text chat: build history and open the real stream ---------- */

  const historyRows = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "asc" },
    take: -HISTORY_LIMIT,
    select: { role: true, content: true, contentType: true },
  });

  const chatMessages: ChatTurn[] = historyRows
    .map((row) => {
      const role: "user" | "assistant" = row.role === "assistant" ? "assistant" : "user";
      let content = row.content;
      if (row.contentType === "image") {
        // Never send raw image payloads back upstream.
        try {
          const parsed = JSON.parse(content);
          content = parsed?.caption ? `[تصویر] ${parsed.caption}` : "[تصویر]";
        } catch {
          content = "[تصویر]";
        }
      }
      return { role, content };
    })
    .filter((m) => m.content && m.content.trim().length > 0);

  // Guard against a stale first turn slipping through.
  if (chatMessages.length === 0) {
    chatMessages.push({ role: "user", content: prompt });
  }

  const clientSignal = request.signal;

  let openResult: { stream: AsyncGenerator<StreamDelta, void, unknown>; attempts: number };

  try {
    openResult = await (async () => {
      if (target.kind === "user") {
        const res = await openChatStream(
          {
            type: target.type,
            apiFormat: target.apiFormat,
            apiKey: target.apiKey,
            baseUrl: target.baseUrl,
            model,
          },
          chatMessages,
          { signal: clientSignal },
        );
        if (!res.ok || !res.stream) {
          throw new Error(res.message || "اتصال به پروایدر شخصی برقرار نشد.");
        }
        return { stream: res.stream, attempts: 1 };
      }

      const res = await streamWithFailover({
        providerId: target.providerId,
        model,
        messages: chatMessages,
        userId: user.id,
        signal: clientSignal,
      });
      if (!res.ok || !res.stream) {
        throw new Error(res.message || "اتصال به پروایدر برقرار نشد.");
      }
      return { stream: res.stream, attempts: res.attempts };
    })();
  } catch (err: unknown) {
    const e = err as Error;
    if (e?.name === "AbortError" || e?.message === "ABORTED") {
      return NextResponse.json({ error: "درخواست لغو شد." }, { status: 499 });
    }

    const msg = e?.message || "خطای غیرمنتظره در اتصال به پروایدر.";
    await prisma.message.create({
      data: { conversationId, role: "assistant", content: `⚠️ ${msg}`, contentType: "text" },
    });
    await prisma.conversation.update({
      where: { id: conversationId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ error: msg, providerName: target.name, model }, { status: 502 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      controller.enqueue(
        encoder.encode(
          sse({
            type: "start",
            conversationId,
            conversationTitle,
            isNewConversation,
            userMessageId: userMessage.id,
            provider: target.name,
            model,
            attempts: openResult.attempts,
          }),
        ),
      );

      let accumulated = "";
      let reasoning = "";
      let streamError: string | null = null;

      try {
        for await (const delta of openResult.stream) {
          if (delta.kind === "reasoning") {
            // The model's chain of thought — streamed separately so the UI can
            // show it in its own "thinking" block, then reveal the answer.
            reasoning += delta.text;
            controller.enqueue(
              encoder.encode(sse({ type: "chunk", text: delta.text, reasoning: true })),
            );
          } else {
            accumulated += delta.text;
            controller.enqueue(encoder.encode(sse({ type: "chunk", text: delta.text })));
          }
        }
      } catch (err: unknown) {
        const e = err as Error;
        if (e?.name !== "AbortError") {
          streamError = e?.message || "ارتباط با پروایدر در میانه‌ی پاسخ قطع شد.";
          console.error("[chat] upstream stream error:", e);
        }
      }

      // Persist whatever we managed to receive.
      const hasCode = accumulated.includes("```");
      const finalContent = streamError
        ? accumulated
          ? `${accumulated}\n\n⚠️ ${streamError}`
          : `⚠️ ${streamError}`
        : accumulated;

      let assistantMessageId = "";
      try {
        const assistantMessage = await prisma.message.create({
          data: {
            conversationId: conversationId as string,
            role: "assistant",
            content: finalContent || "پاسخی از پروایدر دریافت نشد.",
            reasoning: reasoning || null,
            contentType: hasCode ? "code" : "text",
          },
        });
        assistantMessageId = assistantMessage.id;

        await prisma.conversation.update({
          where: { id: conversationId as string },
          data: { updatedAt: new Date() },
        });
      } catch (err) {
        console.error("[chat] failed to persist assistant message:", err);
      }

      if (streamError) {
        controller.enqueue(encoder.encode(sse({ type: "error", message: streamError })));
      }

      controller.enqueue(encoder.encode(sse({ type: "done", messageId: assistantMessageId })));
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
