"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * BYOK manager — add / edit / verify a personal API key without leaving the chat.
 * Every save runs a REAL connection check against the upstream provider.
 */

import * as React from "react";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  KeyRound,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
  Zap,
} from "lucide-react";

import { PROVIDER_PRESETS } from "@/lib/ai-client";
import { cn } from "@/lib/utils";

export interface UserProviderRow {
  id: string;
  name: string;
  providerType: string;
  baseUrl?: string | null;
  keyMask?: string | null;
  models?: string | null;
  status: string;
  lastTestedAt?: string | null;
  lastTestMessage?: string | null;
}

interface ByokManagerProps {
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
  providers: UserProviderRow[];
  /** Render as a plain panel instead of a full-screen modal (settings page). */
  inline?: boolean;
}

const PRESET_KEYS = Object.keys(PROVIDER_PRESETS);

function statusBadge(status: string) {
  if (status === "connected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10.5px] font-medium text-emerald-300">
        <CheckCircle2 className="size-3" />
        متصل و تأییدشده
      </span>
    );
  }
  if (status === "disconnected") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2 py-0.5 text-[10.5px] font-medium text-red-300">
        <AlertCircle className="size-3" />
        اتصال ناموفق
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-[10.5px] font-medium text-amber-300">
      <AlertCircle className="size-3" />
      آزمایش‌نشده
    </span>
  );
}

export function ByokManager({ open, onClose, onChanged, providers, inline = false }: ByokManagerProps) {
  const [mode, setMode] = React.useState<"list" | "form">("list");
  const [editingId, setEditingId] = React.useState<string | null>(null);

  const [name, setName] = React.useState("");
  const [presetKey, setPresetKey] = React.useState<string>("openai");
  const [providerType, setProviderType] = React.useState("openai");
  const [baseUrl, setBaseUrl] = React.useState(PROVIDER_PRESETS.openai.baseUrl);
  const [apiKey, setApiKey] = React.useState("");
  const [showKey, setShowKey] = React.useState(false);

  const [busy, setBusy] = React.useState(false);
  const [testingId, setTestingId] = React.useState<string | null>(null);
  const [feedback, setFeedback] = React.useState<{ ok: boolean; text: string } | null>(null);

  const resetForm = React.useCallback(() => {
    setEditingId(null);
    setName("");
    setPresetKey("openai");
    setProviderType("openai");
    setBaseUrl(PROVIDER_PRESETS.openai.baseUrl);
    setApiKey("");
    setShowKey(false);
    setFeedback(null);
  }, []);

  React.useEffect(() => {
    if (open) {
      setMode("list");
      resetForm();
    }
  }, [open, resetForm]);

  const applyPreset = (key: string) => {
    setPresetKey(key);
    const preset = PROVIDER_PRESETS[key];
    if (!preset) return;
    setProviderType(preset.type);
    setBaseUrl(preset.baseUrl);
    if (!name.trim()) setName(preset.label);
  };

  const startCreate = () => {
    resetForm();
    setMode("form");
  };

  const startEdit = (p: UserProviderRow) => {
    setEditingId(p.id);
    setName(p.name);
    setProviderType(p.providerType);
    setBaseUrl(p.baseUrl || "");
    setApiKey("");
    setFeedback(null);
    setMode("form");
  };

  const submit = async () => {
    if (!name.trim()) {
      setFeedback({ ok: false, text: "نام پروایدر را وارد کنید." });
      return;
    }
    if (!editingId && !apiKey.trim()) {
      setFeedback({ ok: false, text: "کلید API را وارد کنید." });
      return;
    }
    if (providerType === "custom" && !baseUrl.trim()) {
      setFeedback({ ok: false, text: "برای پروایدر دلخواه، آدرس Base URL الزامی است." });
      return;
    }

    setBusy(true);
    setFeedback({ ok: true, text: "در حال بررسی واقعی اتصال با سرویس‌دهنده…" });

    try {
      if (editingId) {
        const patchBody: Record<string, unknown> = { name: name.trim(), baseUrl: baseUrl.trim() || null };
        if (apiKey.trim()) patchBody.apiKey = apiKey.trim();

        const res = await fetch(`/api/user-providers/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patchBody),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "ویرایش پروایدر ناموفق بود.");

        // Re-verify against the live API after the edit.
        const testRes = await fetch(`/api/user-providers/${editingId}/test`, { method: "POST" });
        const testData = await testRes.json().catch(() => ({}));
        setFeedback({
          ok: Boolean(testData.success),
          text: testData.message || "بررسی اتصال انجام شد.",
        });
      } else {
        const res = await fetch("/api/user-providers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            providerType,
            baseUrl: baseUrl.trim() || null,
            apiKey: apiKey.trim(),
            testNow: true,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "ذخیره پروایدر ناموفق بود.");
        setFeedback({
          ok: data.testResult?.status === "connected",
          text: data.testResult?.message || "پروایدر ذخیره شد.",
        });
      }

      onChanged();
      // Let the user read the result before returning to the list.
      setTimeout(() => {
        setMode("list");
        resetForm();
      }, 1800);
    } catch (err) {
      setFeedback({ ok: false, text: (err as Error)?.message || "خطای نامشخص." });
    } finally {
      setBusy(false);
    }
  };

  const runTest = async (id: string) => {
    setTestingId(id);
    try {
      const res = await fetch(`/api/user-providers/${id}/test`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      setFeedback({ ok: Boolean(data.success), text: data.message || "بررسی اتصال انجام شد." });
      onChanged();
    } catch {
      setFeedback({ ok: false, text: "بررسی اتصال با خطا مواجه شد." });
    } finally {
      setTestingId(null);
    }
  };

  const remove = async (id: string) => {
    setBusy(true);
    try {
      const res = await fetch(`/api/user-providers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("حذف ناموفق بود.");
      onChanged();
      setFeedback({ ok: true, text: "پروایدر حذف شد." });
    } catch {
      setFeedback({ ok: false, text: "حذف پروایدر ناموفق بود." });
    } finally {
      setBusy(false);
    }
  };

  if (!open && !inline) return null;

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        inline ? "w-full" : "fixed inset-0 z-[100] p-4",
      )}
      dir="rtl"
    >
      {!inline && (
        <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={onClose} />
      )}

      <div
        className={cn(
          "relative z-10 flex w-full max-w-2xl flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#101013] shadow-2xl",
          !inline && "max-h-[88dvh]",
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.07] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-xl border border-white/10 bg-white/[0.05]">
              <KeyRound className="size-4 text-amber-400" />
            </span>
            <div>
              <h2 className="text-[14.5px] font-bold text-white">کلیدهای API من</h2>
              <p className="text-[11.5px] text-neutral-400">
                کلید خودتان را وصل کنید؛ اتصال به‌صورت واقعی با سرویس‌دهنده بررسی و تأیید می‌شود.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid size-8 place-items-center rounded-lg text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={cn(
              "mx-5 mt-4 flex items-start gap-2 rounded-xl border px-3 py-2.5 text-[12.5px] leading-6",
              feedback.ok
                ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-200"
                : "border-red-500/30 bg-red-500/[0.08] text-red-200",
            )}
          >
            {busy ? (
              <Loader2 className="mt-1 size-3.5 shrink-0 animate-spin" />
            ) : feedback.ok ? (
              <Check className="mt-1 size-3.5 shrink-0" />
            ) : (
              <AlertCircle className="mt-1 size-3.5 shrink-0" />
            )}
            <span className="whitespace-pre-wrap">{feedback.text}</span>
          </div>
        )}

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">
          {mode === "list" ? (
            <div className="space-y-3">
              {providers.length === 0 && (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <KeyRound className="mx-auto size-7 text-neutral-600" />
                  <p className="mt-3 text-[13px] text-neutral-400">
                    هنوز هیچ کلید شخصی ثبت نکرده‌اید.
                  </p>
                  <p className="mt-1 text-[11.5px] text-neutral-500">
                    با افزودن کلید، مدل‌های آن پروایدر به فهرست مدل‌های شما اضافه می‌شود.
                  </p>
                </div>
              )}

              {providers.map((p) => (
                <div key={p.id} className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[13.5px] font-semibold text-white">{p.name}</span>
                      <span className="rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-neutral-400">
                        {p.providerType}
                      </span>
                      {statusBadge(p.status)}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => runTest(p.id)}
                        disabled={testingId === p.id}
                        className="inline-flex h-7 items-center gap-1.5 rounded-lg border border-white/10 px-2.5 text-[11.5px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                      >
                        {testingId === p.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Zap className="size-3" />
                        )}
                        بررسی اتصال
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(p)}
                        className="grid size-7 place-items-center rounded-lg border border-white/10 text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                        title="ویرایش"
                      >
                        <Pencil className="size-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => remove(p.id)}
                        disabled={busy}
                        className="grid size-7 place-items-center rounded-lg border border-red-500/20 text-red-400 transition-colors hover:bg-red-500/10 disabled:opacity-50"
                        title="حذف"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-[11px] text-neutral-500" dir="ltr">
                    <span>{p.keyMask || "••••"}</span>
                    {p.baseUrl && <span className="truncate">{p.baseUrl}</span>}
                    <span>{p.models ? `${p.models.split(",").filter(Boolean).length} model(s)` : "no models"}</span>
                  </div>

                  {p.lastTestMessage && (
                    <p className="mt-2 whitespace-pre-wrap text-[11.5px] leading-5 text-neutral-400">
                      {p.lastTestMessage}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">
                  سرویس‌دهنده
                </label>
                <select
                  value={presetKey}
                  onChange={(e) => applyPreset(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#151518] px-3 text-[13px] text-white outline-none focus:border-white/30"
                >
                  {PRESET_KEYS.map((k) => (
                    <option key={k} value={k}>
                      {PROVIDER_PRESETS[k].label}
                    </option>
                  ))}
                  <option value="custom_manual">دلخواه (سازگار با OpenAI)</option>
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">
                  نام نمایشی
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="مثلاً: OpenAI من"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#151518] px-3 text-[13px] text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">
                  آدرس Base URL
                </label>
                <input
                  dir="ltr"
                  value={baseUrl}
                  onChange={(e) => setBaseUrl(e.target.value)}
                  placeholder="https://api.openai.com/v1"
                  className="h-10 w-full rounded-xl border border-white/10 bg-[#151518] px-3 font-mono text-[12.5px] text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                />
                <p className="mt-1.5 text-[11px] text-neutral-500">
                  مسیر نسخه را هم بنویسید (مثلاً <span dir="ltr">/v1</span>).
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-[12.5px] font-medium text-neutral-300">
                  کلید API {editingId && <span className="text-neutral-500">(خالی بگذارید تا تغییر نکند)</span>}
                </label>
                <div className="relative">
                  <input
                    dir="ltr"
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    placeholder="sk-..."
                    className="h-10 w-full rounded-xl border border-white/10 bg-[#151518] px-3 pe-16 font-mono text-[12.5px] text-white placeholder:text-neutral-600 outline-none focus:border-white/30"
                  />
                  <button
                    type="button"
                    onClick={() => setShowKey((s) => !s)}
                    className="absolute end-2 top-1/2 -translate-y-1/2 rounded-md px-2 py-1 text-[11px] text-neutral-400 hover:bg-white/[0.06] hover:text-white"
                  >
                    {showKey ? "پنهان" : "نمایش"}
                  </button>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={submit}
                  disabled={busy}
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-white px-5 text-[13px] font-bold text-black transition-colors hover:bg-neutral-200 disabled:opacity-50"
                >
                  {busy ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                  {editingId ? "ذخیره و بررسی اتصال" : "افزودن و بررسی اتصال"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode("list");
                    resetForm();
                  }}
                  className="inline-flex h-10 items-center rounded-xl border border-white/10 px-4 text-[13px] text-neutral-300 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  انصراف
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {mode === "list" && (
          <div className="border-t border-white/[0.07] px-5 py-3.5">
            <button
              type="button"
              onClick={startCreate}
              className="inline-flex h-9 items-center gap-2 rounded-xl bg-white px-4 text-[12.5px] font-bold text-black transition-colors hover:bg-neutral-200"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              افزودن کلید جدید
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
