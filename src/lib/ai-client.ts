/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Real multi-provider AI client.
 *
 * Supports four provider families, each with its own wire format:
 *   - openai    : OpenAI-compatible  POST {base}/chat/completions      (SSE, `data:` + [DONE])
 *   - custom    : OpenAI-compatible  POST {base}/chat/completions      (any self-hosted / proxy)
 *   - anthropic : Anthropic Messages POST {base}/messages              (SSE, typed events)
 *   - google    : Gemini             POST {base}/models/{m}:streamGenerateContent?alt=sse
 *
 * Everything here talks to the real upstream API. There is no mock path.
 */

export type ProviderType = "openai" | "anthropic" | "google" | "custom";

export interface ChatTurn {
  role: "user" | "assistant";
  content: string;
}

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  models?: string[];
  statusCode?: number;
  /** true when the key authenticated AND produced a real completion */
  generationVerified?: boolean;
}

export interface ProviderTarget {
  type: string;
  apiKey: string;
  baseUrl?: string | null;
  model: string;
  /** Explicit wire format; falls back to the legacy `type` when omitted. */
  apiFormat?: string | null;
}

/** Preset base URLs for the OpenAI-compatible services people actually use. */
export const PROVIDER_PRESETS: Record<string, { label: string; type: ProviderType; baseUrl: string }> = {
  openai: { label: "OpenAI", type: "openai", baseUrl: "https://api.openai.com/v1" },
  anthropic: { label: "Anthropic (Claude)", type: "anthropic", baseUrl: "https://api.anthropic.com/v1" },
  google: { label: "Google (Gemini)", type: "google", baseUrl: "https://generativelanguage.googleapis.com/v1beta" },
  deepseek: { label: "DeepSeek", type: "custom", baseUrl: "https://api.deepseek.com/v1" },
  groq: { label: "Groq", type: "custom", baseUrl: "https://api.groq.com/openai/v1" },
  openrouter: { label: "OpenRouter", type: "custom", baseUrl: "https://openrouter.ai/api/v1" },
  xai: { label: "xAI (Grok)", type: "custom", baseUrl: "https://api.x.ai/v1" },
  mistral: { label: "Mistral AI", type: "custom", baseUrl: "https://api.mistral.ai/v1" },
  together: { label: "Together AI", type: "custom", baseUrl: "https://api.together.xyz/v1" },
  ollama: { label: "Ollama (local)", type: "custom", baseUrl: "http://localhost:11434/v1" },
};

const DEFAULT_BASE: Record<ProviderType, string> = {
  openai: "https://api.openai.com/v1",
  anthropic: "https://api.anthropic.com/v1",
  google: "https://generativelanguage.googleapis.com/v1beta",
  custom: "",
};

export function normalizeType(type: string | null | undefined): ProviderType {
  const t = (type || "").toLowerCase().trim();
  if (t === "openai" || t === "anthropic" || t === "google" || t === "custom") return t;
  // common aliases people type into the admin form
  if (t.includes("claude") || t.includes("anthropic")) return "anthropic";
  if (t.includes("gemini") || t.includes("google")) return "google";
  if (t.includes("openai") || t.includes("gpt")) return "openai";
  return "custom";
}

/**
 * Wire format actually used to talk to the provider. This is what the admin
 * picks in the "API format" selector, mirroring how other clients expose it.
 */
export type ApiFormat = "chat_completions" | "anthropic_messages" | "responses" | "google_generate";

export const API_FORMATS: Array<{ value: ApiFormat; label: string; hint: string }> = [
  { value: "chat_completions", label: "Chat completions", hint: "/chat/completions" },
  { value: "anthropic_messages", label: "Anthropic messages", hint: "/v1/messages" },
  { value: "responses", label: "Responses", hint: "/responses" },
  { value: "google_generate", label: "Google generateContent", hint: "models/{model}:streamGenerateContent" },
];

export function resolveApiFormat(type: string, apiFormat?: string | null): ApiFormat {
  const f = (apiFormat || "").trim().toLowerCase();
  if (
    f === "chat_completions" ||
    f === "anthropic_messages" ||
    f === "responses" ||
    f === "google_generate"
  ) {
    return f;
  }

  // Backward compatible: derive from the legacy `type` column.
  const t = normalizeType(type);
  if (t === "anthropic") return "anthropic_messages";
  if (t === "google") return "google_generate";
  return "chat_completions";
}

/** Strip trailing slashes so we can join paths predictably. */
function trimSlash(url: string): string {
  return url.replace(/\/+$/, "");
}

function resolveBase(type: ProviderType, baseUrl?: string | null): string {
  const raw = (baseUrl || "").trim();
  return trimSlash(raw || DEFAULT_BASE[type]);
}

/** Join a path onto a base URL, tolerating users who already typed the full path. */
function joinUrl(base: string, path: string): string {
  if (base.endsWith(path)) return base;
  return `${base}${path}`;
}

/** Pull a human-readable error out of a provider's error body. */
function extractErrorMessage(raw: string, status: number): string {
  const text = (raw || "").slice(0, 800);
  try {
    const json = JSON.parse(text);
    const msg =
      json?.error?.message ||
      json?.error?.error?.message ||
      json?.message ||
      (Array.isArray(json?.error?.details) ? json.error.details[0]?.message : null) ||
      json?.error;
    if (typeof msg === "string" && msg.trim()) return msg.trim();
  } catch {
    /* not JSON — fall through to the raw text */
  }
  const clean = text.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return clean || `HTTP ${status}`;
}

/** Translate the most common upstream failures into Persian, keeping the raw detail. */
export function humanizeProviderError(status: number, detail: string): string {
  const d = detail.toLowerCase();
  if (status === 401 || status === 403 || d.includes("api key") || d.includes("unauthorized") || d.includes("invalid_api_key")) {
    return `کلید API معتبر نیست یا دسترسی ندارد (${status}). جزئیات: ${detail}`;
  }
  if (status === 404) {
    return `آدرس سرویس یا نام مدل پیدا نشد (404). آدرس Base URL و نام مدل را بررسی کنید. جزئیات: ${detail}`;
  }
  if (status === 429 || d.includes("rate limit") || d.includes("quota") || d.includes("insufficient")) {
    return `محدودیت نرخ یا اتمام سهمیه (429). جزئیات: ${detail}`;
  }
  if (status === 400) {
    return `درخواست توسط پروایدر رد شد (400). معمولاً نام مدل نادرست است. جزئیات: ${detail}`;
  }
  if (status >= 500) {
    return `خطای داخلی سرویس‌دهنده (${status}). جزئیات: ${detail}`;
  }
  return `خطا از سمت پروایدر (${status}): ${detail}`;
}

/* ------------------------------------------------------------------ *
 * Model listing
 * ------------------------------------------------------------------ */

/**
 * Fetches the real model catalogue from the provider.
 * Returns ok:false with a human message when the key/endpoint is wrong.
 */
export async function listModels(options: {
  type: string;
  apiKey: string;
  baseUrl?: string | null;
  signal?: AbortSignal;
}): Promise<{ ok: boolean; models: string[]; message: string; statusCode?: number }> {
  const type = normalizeType(options.type);
  const base = resolveBase(type, options.baseUrl);
  const { apiKey, signal } = options;

  if (!base) {
    return { ok: false, models: [], message: "برای پروایدر دلخواه، وارد کردن آدرس Base URL الزامی است." };
  }

  try {
    let url = "";
    const headers: Record<string, string> = { Accept: "application/json" };

    if (type === "openai" || type === "custom") {
      url = joinUrl(base, "/models");
      headers.Authorization = `Bearer ${apiKey}`;
    } else if (type === "anthropic") {
      url = joinUrl(base, "/models");
      headers["x-api-key"] = apiKey;
      headers["anthropic-version"] = "2023-06-01";
    } else {
      url = `${joinUrl(base, "/models")}?key=${encodeURIComponent(apiKey)}`;
    }

    const res = await fetch(url, { method: "GET", headers, signal, cache: "no-store" });
    const raw = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        models: [],
        statusCode: res.status,
        message: humanizeProviderError(res.status, extractErrorMessage(raw, res.status)),
      };
    }

    let ids: string[] = [];
    try {
      const json = JSON.parse(raw);
      if (Array.isArray(json?.data)) {
        ids = json.data.map((m: { id?: string; name?: string }) => m.id || m.name || "").filter(Boolean);
      } else if (Array.isArray(json?.models)) {
        // Gemini: { models: [{ name: "models/gemini-2.5-flash", ... }] }
        ids = json.models
          .map((m: { name?: string; id?: string }) => (m.name || m.id || "").replace(/^models\//, ""))
          .filter(Boolean);
      }
    } catch {
      return { ok: false, models: [], statusCode: res.status, message: "پاسخ سرویس قابل خواندن نبود (JSON نامعتبر)." };
    }

    ids = Array.from(new Set(ids)).sort();

    return {
      ok: true,
      models: ids,
      statusCode: res.status,
      message: ids.length
        ? `${ids.length} مدل از پروایدر دریافت شد.`
        : "اتصال برقرار شد اما لیست مدل‌ها خالی برگشت.",
    };
  } catch (err: unknown) {
    const e = err as Error;
    if (e?.name === "AbortError") {
      return { ok: false, models: [], message: "مهلت زمانی اتصال به پایان رسید (Timeout)." };
    }
    return { ok: false, models: [], message: `خطای شبکه: ${e?.message || "ناشناخته"}` };
  }
}

/* ------------------------------------------------------------------ *
 * Request building
 * ------------------------------------------------------------------ */

function buildRequest(
  format: ApiFormat,
  base: string,
  apiKey: string,
  model: string,
  messages: ChatTurn[],
  stream: boolean,
  maxTokens: number,
): { url: string; headers: Record<string, string>; body: string } {
  if (format === "anthropic_messages") {
    return {
      url: joinUrl(base, "/messages"),
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model, max_tokens: maxTokens, messages, stream }),
    };
  }

  if (format === "google_generate") {
    const action = stream ? "streamGenerateContent?alt=sse" : "generateContent";
    return {
      url: `${joinUrl(base, `/models/${encodeURIComponent(model)}`)}:${action}${stream ? "&" : "?"}key=${encodeURIComponent(apiKey)}`,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: messages.map((m) => ({
          role: m.role === "assistant" ? "model" : "user",
          parts: [{ text: m.content }],
        })),
        generationConfig: { maxOutputTokens: maxTokens },
      }),
    };
  }

  // OpenAI Responses API — a different shape from chat/completions.
  if (format === "responses") {
    return {
      url: joinUrl(base, "/responses"),
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        input: messages.map((m) => ({ role: m.role, content: m.content })),
        stream,
        max_output_tokens: maxTokens,
      }),
    };
  }

  // chat_completions — the OpenAI-compatible default (also used by `custom`).
  return {
    url: joinUrl(base, "/chat/completions"),
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ model, messages, stream, max_tokens: maxTokens }),
  };
}

/** Extract the incremental text out of one SSE payload. */
function extractDelta(format: ApiFormat, payload: string): string {
  if (!payload || payload === "[DONE]") return "";

  let json: Record<string, unknown>;
  try {
    json = JSON.parse(payload);
  } catch {
    return "";
  }

  if (format === "anthropic_messages") {
    const t = json.type as string | undefined;
    if (t === "content_block_delta") {
      const delta = json.delta as { text?: string } | undefined;
      return delta?.text || "";
    }
    return "";
  }

  if (format === "google_generate") {
    const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const parts = candidates?.[0]?.content?.parts;
    if (!Array.isArray(parts)) return "";
    return parts.map((p) => p?.text || "").join("");
  }

  if (format === "responses") {
    const t = json.type as string | undefined;
    if (t === "response.output_text.delta" || t === "response.refusal.delta") {
      return (json.delta as string) || "";
    }
    return "";
  }

  // chat_completions
  const choices = json.choices as Array<{ delta?: { content?: string; reasoning_content?: string }; text?: string }> | undefined;
  const choice = choices?.[0];
  if (!choice) return "";
  return choice.delta?.content ?? choice.delta?.reasoning_content ?? choice.text ?? "";
}

/** Non-streaming extraction (used by the verification ping). */
function extractFullText(format: ApiFormat, json: Record<string, unknown>): string {
  if (format === "anthropic_messages") {
    const content = json.content as Array<{ text?: string }> | undefined;
    return Array.isArray(content) ? content.map((c) => c?.text || "").join("") : "";
  }

  if (format === "google_generate") {
    const candidates = json.candidates as Array<{ content?: { parts?: Array<{ text?: string }> } }> | undefined;
    const parts = candidates?.[0]?.content?.parts;
    return Array.isArray(parts) ? parts.map((p) => p?.text || "").join("") : "";
  }

  if (format === "responses") {
    const output = json.output as
      | Array<{ content?: Array<{ type?: string; text?: string }> }>
      | undefined;
    if (Array.isArray(output)) {
      return output
        .flatMap((item) => item?.content || [])
        .filter((c) => c?.type === "output_text" || typeof c?.text === "string")
        .map((c) => c?.text || "")
        .join("");
    }
    // Some gateways return the convenience field directly.
    return typeof json.output_text === "string" ? json.output_text : "";
  }

  const choices = json.choices as Array<{ message?: { content?: string } }> | undefined;
  return choices?.[0]?.message?.content || "";
}

/* ------------------------------------------------------------------ *
 * Streaming
 * ------------------------------------------------------------------ */

export interface OpenedStream {
  ok: boolean;
  status: number;
  message?: string;
  /** yields incremental text deltas */
  stream?: AsyncGenerator<string, void, unknown>;
}

/**
 * Opens a real streaming completion. On a non-2xx upstream response the body is
 * drained and returned as a message instead of a stream, so the caller can fail
 * over to the next key.
 */
export async function openChatStream(
  target: ProviderTarget,
  messages: ChatTurn[],
  options: { signal?: AbortSignal; maxTokens?: number } = {},
): Promise<OpenedStream> {
  const type = normalizeType(target.type);
  const format = resolveApiFormat(target.type, target.apiFormat);
  const base = resolveBase(type, target.baseUrl);

  if (!base) {
    return { ok: false, status: 0, message: "آدرس Base URL برای این پروایدر تنظیم نشده است." };
  }
  if (!target.apiKey) {
    return { ok: false, status: 0, message: "کلید API در دسترس نیست." };
  }

  const { url, headers, body } = buildRequest(
    format,
    base,
    target.apiKey,
    target.model,
    messages,
    true,
    options.maxTokens ?? 2048,
  );

  let res: Response;
  try {
    res = await fetch(url, { method: "POST", headers, body, signal: options.signal, cache: "no-store" });
  } catch (err: unknown) {
    const e = err as Error;
    if (e?.name === "AbortError") throw err;
    return { ok: false, status: 0, message: `اتصال به پروایدر برقرار نشد: ${e?.message || "خطای شبکه"}` };
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    return {
      ok: false,
      status: res.status,
      message: humanizeProviderError(res.status, extractErrorMessage(raw, res.status)),
    };
  }

  if (!res.body) {
    return { ok: false, status: res.status, message: "پروایدر بدنه‌ی پاسخ را برنگرداند." };
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();

  async function* generate(): AsyncGenerator<string, void, unknown> {
    let buffer = "";
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by a blank line; keep the trailing partial.
        const frames = buffer.split("\n");
        buffer = frames.pop() ?? "";

        for (const line of frames) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") return;

          // A provider-level error can arrive mid-stream.
          if (payload.startsWith("{") && payload.includes('"error"')) {
            try {
              const parsed = JSON.parse(payload);
              if (parsed?.type === "error" || parsed?.error) {
                const msg = parsed?.error?.message || parsed?.error?.type || "خطای پروایدر در میانه‌ی پاسخ";
                throw new Error(String(msg));
              }
            } catch (e) {
              if (e instanceof Error && e.message && !e.message.startsWith("Unexpected")) throw e;
            }
          }

          const delta = extractDelta(format, payload);
          if (delta) yield delta;
        }
      }
    } finally {
      reader.cancel().catch(() => {});
    }
  }

  return { ok: true, status: res.status, stream: generate() };
}

/* ------------------------------------------------------------------ *
 * Non-streaming completion (verification ping)
 * ------------------------------------------------------------------ */

export async function completeChat(
  target: ProviderTarget,
  messages: ChatTurn[],
  options: { signal?: AbortSignal; maxTokens?: number } = {},
): Promise<{ ok: boolean; status: number; text: string; message?: string }> {
  const type = normalizeType(target.type);
  const format = resolveApiFormat(target.type, target.apiFormat);
  const base = resolveBase(type, target.baseUrl);

  if (!base) return { ok: false, status: 0, text: "", message: "آدرس Base URL تنظیم نشده است." };

  const { url, headers, body } = buildRequest(
    format,
    base,
    target.apiKey,
    target.model,
    messages,
    false,
    options.maxTokens ?? 16,
  );

  try {
    const res = await fetch(url, { method: "POST", headers, body, signal: options.signal, cache: "no-store" });
    const raw = await res.text();

    if (!res.ok) {
      return { ok: false, status: res.status, text: "", message: humanizeProviderError(res.status, extractErrorMessage(raw, res.status)) };
    }

    let json: Record<string, unknown> = {};
    try {
      json = JSON.parse(raw);
    } catch {
      return { ok: false, status: res.status, text: "", message: "پاسخ سرویس قابل خواندن نبود." };
    }

    return { ok: true, status: res.status, text: extractFullText(format, json) };
  } catch (err: unknown) {
    const e = err as Error;
    if (e?.name === "AbortError") return { ok: false, status: 0, text: "", message: "مهلت زمانی به پایان رسید (Timeout)." };
    return { ok: false, status: 0, text: "", message: `خطای شبکه: ${e?.message || "ناشناخته"}` };
  }
}

/* ------------------------------------------------------------------ *
 * Full verification — auth + catalogue + real generation
 * ------------------------------------------------------------------ */

/**
 * The definitive "is this connection actually working?" check.
 *
 * Step 1: authenticate and pull the real model catalogue.
 * Step 2: run a real minimal completion so we prove the key can *generate*,
 *         not merely list models (many keys can list but not infer).
 */
export async function verifyProvider(options: {
  type: string;
  apiKey: string;
  baseUrl?: string | null;
  apiFormat?: string | null;
  model?: string | null;
  timeoutMs?: number;
}): Promise<ConnectionTestResult> {
  const { type, apiKey, baseUrl, apiFormat } = options;

  if (!apiKey || !apiKey.trim()) {
    return { ok: false, message: "کلید API وارد نشده است." };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 20000);

  try {
    const catalogue = await listModels({ type, apiKey, baseUrl, signal: controller.signal });

    // Pick the model to ping: explicit → first real catalogue entry → a sane default.
    const fallback = defaultModelFor(normalizeType(type));
    const model = (options.model && options.model.trim()) || catalogue.models[0] || fallback;

    const ping = await completeChat(
      { type, apiKey, baseUrl, apiFormat, model },
      [{ role: "user", content: "ping" }],
      { signal: controller.signal, maxTokens: 16 },
    );

    clearTimeout(timeout);

    if (!ping.ok) {
      const pingMessage = ping.message || "اجرای آزمایشی مدل ناموفق بود.";
      return {
        ok: false,
        statusCode: ping.status,
        models: catalogue.models,
        generationVerified: false,
        message: catalogue.ok
          ? `کلید معتبر است و ${catalogue.models.length} مدل شناسایی شد، اما اجرای آزمایشی مدل «${model}» ناموفق بود. ${pingMessage}`
          : pingMessage,
      };
    }

    return {
      ok: true,
      statusCode: 200,
      models: catalogue.models.length ? catalogue.models : [model],
      generationVerified: true,
      message: `اتصال تأیید شد ✓ کلید معتبر است، ${catalogue.models.length || 1} مدل شناسایی شد و اجرای آزمایشی مدل «${model}» با موفقیت پاسخ داد.`,
    };
  } catch (err: unknown) {
    clearTimeout(timeout);
    const e = err as Error;
    if (e?.name === "AbortError") {
      return { ok: false, message: "مهلت زمانی بررسی اتصال به پایان رسید (Timeout)." };
    }
    return { ok: false, message: `خطای غیرمنتظره در بررسی اتصال: ${e?.message || "ناشناخته"}` };
  }
}

/* ------------------------------------------------------------------ *
 * Image generation
 * ------------------------------------------------------------------ */

export interface ImageGenResult {
  ok: boolean;
  /** data: URI or a remote https URL */
  imageUrl?: string;
  status: number;
  message?: string;
}

/** True when the model id is an image-generation model. */
export function isImageModel(model: string): boolean {
  return /(dall-e|flux|imagen|stable-diffusion|sdxl|gpt-image|seedream|recraft)/i.test(model) || /image/i.test(model);
}

/**
 * Generates an image with the real provider endpoint.
 * OpenAI-compatible → POST {base}/images/generations
 * Gemini            → POST {base}/models/{model}:generateContent (IMAGE modality)
 */
export async function generateImage(
  target: ProviderTarget,
  prompt: string,
  options: { signal?: AbortSignal; size?: string } = {},
): Promise<ImageGenResult> {
  const type = normalizeType(target.type);
  const base = resolveBase(type, target.baseUrl);

  if (!base) return { ok: false, status: 0, message: "آدرس Base URL تنظیم نشده است." };

  try {
    if (type === "openai" || type === "custom") {
      const res = await fetch(joinUrl(base, "/images/generations"), {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${target.apiKey}` },
        body: JSON.stringify({ model: target.model, prompt, n: 1, size: options.size || "1024x1024" }),
        signal: options.signal,
        cache: "no-store",
      });
      const raw = await res.text();
      if (!res.ok) {
        return { ok: false, status: res.status, message: humanizeProviderError(res.status, extractErrorMessage(raw, res.status)) };
      }
      const json = JSON.parse(raw);
      const item = json?.data?.[0];
      if (item?.b64_json) return { ok: true, status: res.status, imageUrl: `data:image/png;base64,${item.b64_json}` };
      if (item?.url) return { ok: true, status: res.status, imageUrl: item.url };
      return { ok: false, status: res.status, message: "پروایدر هیچ تصویری برنگرداند." };
    }

    if (type === "google") {
      const url = `${joinUrl(base, `/models/${encodeURIComponent(target.model)}`)}:generateContent?key=${encodeURIComponent(target.apiKey)}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
        }),
        signal: options.signal,
        cache: "no-store",
      });
      const raw = await res.text();
      if (!res.ok) {
        return { ok: false, status: res.status, message: humanizeProviderError(res.status, extractErrorMessage(raw, res.status)) };
      }
      const json = JSON.parse(raw);
      const parts: Array<Record<string, unknown>> = json?.candidates?.[0]?.content?.parts || [];
      for (const p of parts) {
        const inline = (p?.inlineData || p?.inline_data) as { data?: string; mimeType?: string; mime_type?: string } | undefined;
        if (inline?.data) {
          return {
            ok: true,
            status: res.status,
            imageUrl: `data:${inline.mimeType || inline.mime_type || "image/png"};base64,${inline.data}`,
          };
        }
      }
      const text = parts.map((p) => (p as { text?: string })?.text).filter(Boolean).join(" ");
      return { ok: false, status: res.status, message: text || "این مدل تصویری تولید نکرد." };
    }

    return {
      ok: false,
      status: 0,
      message:
        "این پروایدر از تولید تصویر پشتیبانی نمی‌کند. برای تولید تصویر از یک پروایدر سازگار با OpenAI (مثل OpenAI، OpenRouter یا سرویس دلخواه) یا یک مدل تصویری Gemini استفاده کنید.",
    };
  } catch (err: unknown) {
    const e = err as Error;
    if (e?.name === "AbortError") return { ok: false, status: 0, message: "درخواست لغو شد." };
    return { ok: false, status: 0, message: `خطای شبکه در تولید تصویر: ${e?.message || "ناشناخته"}` };
  }
}

export function defaultModelFor(type: ProviderType): string {
  switch (type) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-3-5-haiku-latest";
    case "google":
      return "gemini-2.5-flash";
    default:
      return "default";
  }
}
