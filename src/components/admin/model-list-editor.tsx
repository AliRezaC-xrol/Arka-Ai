"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * Model list editor for the admin provider form.
 *
 * Keeps two things in sync:
 *   - `models`       comma-separated ids — the single source of truth the chat
 *                    picker reads, so it stays backward compatible
 *   - `modelsConfig` richer per-model metadata (context window, max output
 *                    tokens) stored as JSON
 */

import * as React from "react";
import { Plus, Trash2, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ModelEntry {
  id: string;
  contextWindow?: number;
  maxOutputTokens?: number;
}

interface ModelListEditorProps {
  /** comma-separated model ids */
  value: string;
  onChange: (value: string) => void;
  config: ModelEntry[];
  onConfigChange: (config: ModelEntry[]) => void;
}

export function ModelListEditor({ value, onChange, config, onConfigChange }: ModelListEditorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [draftId, setDraftId] = React.useState("");
  const [draftContext, setDraftContext] = React.useState("");
  const [draftMaxTokens, setDraftMaxTokens] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const ids = React.useMemo(
    () =>
      value
        .split(",")
        .map((m) => m.trim())
        .filter(Boolean),
    [value],
  );

  const metaFor = (id: string) => config.find((c) => c.id === id);

  const openModal = () => {
    setDraftId("");
    setDraftContext("");
    setDraftMaxTokens("");
    setError(null);
    setIsOpen(true);
  };

  const save = () => {
    const id = draftId.trim();
    if (!id) {
      setError("شناسه مدل الزامی است.");
      return;
    }
    if (ids.includes(id)) {
      setError("این مدل قبلاً اضافه شده است.");
      return;
    }

    onChange([...ids, id].join(","));

    const ctx = Number.parseInt(draftContext, 10);
    const maxOut = Number.parseInt(draftMaxTokens, 10);
    onConfigChange([
      ...config.filter((c) => c.id !== id),
      {
        id,
        ...(Number.isFinite(ctx) ? { contextWindow: ctx } : {}),
        ...(Number.isFinite(maxOut) ? { maxOutputTokens: maxOut } : {}),
      },
    ]);

    setIsOpen(false);
  };

  const remove = (id: string) => {
    onChange(ids.filter((m) => m !== id).join(","));
    onConfigChange(config.filter((c) => c.id !== id));
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className="block font-medium text-foreground-2">مدل‌های در دسترس</label>
        <button
          type="button"
          onClick={openModal}
          className="inline-flex h-7 items-center gap-1 rounded-control border border-line bg-soft px-2.5 text-[11px] text-foreground-2 transition-colors hover:border-white/30 hover:text-white"
        >
          <Plus className="size-3" />
          <span>افزودن مدل</span>
        </button>
      </div>

      <div className="rounded-control border border-line bg-black/30 p-2">
        {ids.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11.5px] text-foreground-3">
            هنوز مدلی ثبت نشده است. با «افزودن مدل» شروع کنید.
          </p>
        ) : (
          <ul className="space-y-1">
            {ids.map((id) => {
              const meta = metaFor(id);
              return (
                <li
                  key={id}
                  className="flex items-center justify-between gap-2 rounded-control px-2 py-1.5 transition-colors hover:bg-white/[0.04]"
                >
                  <div className="flex min-w-0 items-center gap-2">
                    <span dir="ltr" className="truncate font-mono text-[11.5px] text-foreground">
                      {id}
                    </span>
                    {meta?.contextWindow ? (
                      <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] text-foreground-3">
                        ctx {meta.contextWindow.toLocaleString("en-US")}
                      </span>
                    ) : null}
                    {meta?.maxOutputTokens ? (
                      <span className="shrink-0 rounded bg-white/[0.06] px-1.5 py-0.5 font-mono text-[9.5px] text-foreground-3">
                        max {meta.maxOutputTokens.toLocaleString("en-US")}
                      </span>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => remove(id)}
                    className="grid size-6 shrink-0 place-items-center rounded text-neutral-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
                    title="حذف مدل"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <p className="mt-1 text-[10.5px] text-foreground-3">
        هر مدلی که اینجا اضافه کنید در فهرست مدل‌های چت همه‌ی کاربران ظاهر می‌شود.
      </p>

      {/* Add-model modal */}
      {isOpen && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

          <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-card border border-line bg-[#101013] shadow-2xl">
            <div className="flex items-center justify-between border-b border-line px-4 py-3">
              <h4 className="text-[13.5px] font-bold text-white">افزودن مدل</h4>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="grid size-7 place-items-center rounded text-neutral-400 transition-colors hover:bg-white/[0.06] hover:text-white"
              >
                <X className="size-3.5" />
              </button>
            </div>

            <div className="space-y-3.5 px-4 py-4">
              <div>
                <label className="mb-1 block text-[12px] font-medium text-foreground-2">
                  شناسه مدل (Model ID)
                </label>
                <input
                  dir="ltr"
                  value={draftId}
                  onChange={(e) => setDraftId(e.target.value)}
                  placeholder="gpt-4o-mini"
                  className="h-9 w-full rounded-control border border-line bg-[#151518] px-2.5 font-mono text-[12px] text-foreground outline-none focus:border-white/40"
                />
                <p className="mt-1 text-[10.5px] text-foreground-3">
                  دقیقاً همان شناسه‌ای که سرویس‌دهنده انتظار دارد، نه نام نمایشی.
                </p>
              </div>

              <div className="grid gap-3.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[12px] font-medium text-foreground-2">
                    Context window
                  </label>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={draftContext}
                    onChange={(e) => setDraftContext(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="128000"
                    className="h-9 w-full rounded-control border border-line bg-[#151518] px-2.5 font-mono text-[12px] text-foreground outline-none focus:border-white/40"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-[12px] font-medium text-foreground-2">
                    Max output tokens
                  </label>
                  <input
                    dir="ltr"
                    inputMode="numeric"
                    value={draftMaxTokens}
                    onChange={(e) => setDraftMaxTokens(e.target.value.replace(/[^\d]/g, ""))}
                    placeholder="4096"
                    className="h-9 w-full rounded-control border border-line bg-[#151518] px-2.5 font-mono text-[12px] text-foreground outline-none focus:border-white/40"
                  />
                </div>
              </div>

              {error && (
                <p className="rounded-control border border-red-500/30 bg-red-500/10 px-2.5 py-2 text-[11.5px] text-red-300">
                  {error}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-line px-4 py-3">
              <button
                type="button"
                onClick={() => {
                  setDraftId("");
                  setDraftContext("");
                  setDraftMaxTokens("");
                  setError(null);
                }}
                className="text-[11.5px] text-foreground-3 transition-colors hover:text-white"
              >
                پاک‌کردن فرم
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="h-8 rounded-control border border-line px-3 text-[12px] text-foreground-2 transition-colors hover:bg-white/[0.06] hover:text-white"
                >
                  انصراف
                </button>
                <button
                  type="button"
                  onClick={save}
                  className={cn(
                    "h-8 rounded-control bg-white px-4 text-[12px] font-bold text-black transition-colors hover:bg-neutral-200",
                  )}
                >
                  ذخیره
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
