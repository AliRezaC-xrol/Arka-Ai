"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * The hero product shot. One conversation, rendered inside whichever device
 * suits the viewport: a laptop on tablet/laptop/desktop, and a phone on mobile.
 *
 * Both frames deliberately use a *fixed* viewport height and a `zoom` factor
 * instead of percentage sizing, so the mockup never reflows mid-scroll and the
 * laptop never outgrows the column it sits in.
 */

import * as React from "react";
import {
  ArrowUp,
  Battery,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  ImageIcon,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Wifi,
  Zap,
} from "lucide-react";
import { ArkaMark } from "@/components/site-navbar";
import { cn } from "@/lib/utils";

/** Mock conversation, shared by both device frames. */
function Conversation({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    setCopied(true);
    window.setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn("flex h-full flex-col", compact ? "gap-3 p-3" : "gap-4 p-5")}>
      {/* Webcam / sensor strip */}
      <div className="flex shrink-0 items-center justify-center">
        <span className="size-1.5 rounded-full bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.9)]" />
      </div>

      {/* User turn */}
      <div className="flex shrink-0 flex-col items-end">
        <div
          className={cn(
            "max-w-[88%] rounded-2xl rounded-se-md bg-white font-medium text-black shadow-sm",
            compact ? "px-3 py-2 text-[11px] leading-5" : "px-4 py-2.5 text-[12.5px] leading-6",
          )}
        >
          معماری اتصال به مدل‌های هوش مصنوعی با سوئیچ خودکار بین کلیدها و امنیت بالا را پیشنهاد بده.
        </div>
        <span className="mt-1 font-mono text-[9.5px] text-neutral-500">۱۰:۴۲</span>
      </div>

      {/* Assistant turn */}
      <div className="flex min-h-0 flex-1 items-start gap-2.5">
        <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-lg border border-white/20 bg-white/10">
          <ArkaMark className="size-3.5 text-white" />
        </span>

        <div
          className={cn(
            "min-w-0 flex-1 space-y-2.5 overflow-hidden rounded-2xl rounded-ss-sm border border-white/10 bg-white/[0.03] p-3",
            compact ? "text-[11px] leading-5" : "text-[12.5px] leading-6",
          )}
        >
          <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
            <span className="flex items-center gap-1.5 font-semibold text-white">
              <Sparkles className="size-3 text-neutral-400" />
              پاسخ ارکا · Claude Sonnet 4
            </span>
            <span className="shrink-0 font-mono text-[10px] text-emerald-400">۲ کلید فعال</span>
          </div>

          <p className="text-neutral-300">سه لایه‌ی پیشنهادی برای کلاستر متمرکز:</p>

          <div className="space-y-1.5">
            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/40 p-2">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-neutral-300" />
              <p className="min-w-0">
                <strong className="text-white">رمزنگاری AES-256-GCM:</strong> کلیدها با بردار تصادفی
                ذخیره و فقط در رم سرور رمزگشایی می‌شوند.
              </p>
            </div>

            <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/40 p-2">
              <Zap className="mt-0.5 size-3.5 shrink-0 text-neutral-300" />
              <p className="min-w-0">
                <strong className="text-white">جابجایی خودکار:</strong> با خطای سقف سهمیه، کلید
                رزرو بی‌درنگ جایگزین می‌شود و چت قطع نمی‌شود.
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10.5px] text-neutral-400">
            <span className="flex items-center gap-1.5">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              اعتبارسنجی پاس شد
            </span>
            <button
              type="button"
              onClick={handleCopy}
              tabIndex={-1}
              className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copied ? "کپی شد" : "کپی"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Composer */}
      <div
        className={cn(
          "shrink-0 rounded-2xl border border-white/15 bg-black/50 shadow-lg",
          compact ? "p-2" : "p-2.5",
        )}
      >
        <div className="flex items-center justify-between px-1">
          <span className={cn("text-neutral-400", compact ? "text-[11px]" : "text-[12.5px]")}>
            هر چه می‌خواهید بپرسید…
          </span>
          <span className="inline-block h-3.5 w-[2px] animate-pulse rounded-full bg-white/70" />
        </div>
        <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[10.5px] text-neutral-200">
              <span className="size-1.5 rounded-full bg-emerald-400" />
              <span dir="ltr">Sonnet 4</span>
              <ChevronDown className="size-3 text-neutral-400" />
            </span>
            <Paperclip className="size-3.5 text-neutral-400" />
            <ImageIcon className="size-3.5 text-neutral-400" />
          </div>
          <span className="grid size-6 place-items-center rounded-full bg-white text-black shadow-md">
            <ArrowUp className="size-3.5 stroke-[2.5]" />
          </span>
        </div>
      </div>
    </div>
  );
}

export function HeroWindow() {
  return (
    <div className="relative w-full select-none" dir="rtl">
      {/* -------------------------------------------------------------------
          Tablet / laptop / desktop: laptop
         ------------------------------------------------------------------- */}
      <div className="hidden w-full md:block">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-white/[0.08] via-white/[0.02] to-transparent opacity-60 blur-2xl"
        />

        {/* Frame width is pinned per tier so the screen height can be pinned
            too. Letting it stay fluid makes the text re-wrap at every
            breakpoint, which is what allowed content to overflow. */}
        <div className="mx-auto w-[500px] max-w-full lg:w-[610px]">
          {/* Lid.
              `overflow-hidden` does double duty: it clips the rounded corners
              AND guarantees nothing inside can push the frame taller than the
              height reserved below. */}
          <div className="relative overflow-hidden rounded-t-[20px] border-[10px] border-[#18181d] bg-[#09090c] ring-1 ring-white/10 lg:border-[12px]">
            {/* Window chrome */}
            <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <div className="flex shrink-0 items-center gap-1.5">
                  <span className="size-2.5 rounded-full border border-black/20 bg-[#ff5f56]/90" />
                  <span className="size-2.5 rounded-full border border-black/20 bg-[#ffbd2e]/90" />
                  <span className="size-2.5 rounded-full border border-black/20 bg-[#27c93f]/90" />
                </div>
                <div className="mx-0.5 h-3.5 w-px shrink-0 bg-white/10" />
                <div className="flex items-center gap-2 truncate">
                  <ArkaMark className="size-4 shrink-0 text-white" />
                  <span
                    dir="ltr"
                    className="font-display text-[13px] font-bold tracking-tight text-white"
                  >
                    ARKA
                  </span>
                  <span className="text-[11px] font-normal text-neutral-400">/ گفتگو</span>
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 font-mono text-[11px] text-neutral-300">
                <Cpu className="size-3 text-neutral-400" />
                <span>Claude Sonnet 4</span>
              </div>
            </div>

            {/* Screen height.

                Set from measurement (see scripts/measure-frame.cjs), not
                guesswork: the conversation's natural height bottoms out at
                557px once the screen is wider than ~470px, and rises steeply as
                it narrows. 480px of content is the widest tier, so h = 557 +
                13 for the webcam strip. The old 350px box silently clipped the
                composer. */}
            <div className="h-[570px]">
              <Conversation />
            </div>
          </div>

          {/* Base + hinge */}
          <div className="relative -ms-[2%] flex h-3.5 w-[104%] items-start justify-center rounded-b-[14px] border-t border-white/20 bg-gradient-to-b from-[#2b2b32] via-[#1a1a20] to-[#0e0e12] lg:h-4">
            <div className="h-1.5 w-20 rounded-b-md border-t border-white/10 bg-[#09090c] lg:w-28" />
          </div>
          <div className="mx-auto mt-0.5 h-3 w-[90%] rounded-full bg-black/80 blur-md" />
        </div>
      </div>

      {/* -------------------------------------------------------------------
          Mobile: phone
         ------------------------------------------------------------------- */}
      <div className="mx-auto w-full max-w-[330px] md:hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[46px] bg-gradient-to-tr from-white/[0.08] to-transparent opacity-60 blur-xl"
        />

        <div className="relative overflow-hidden rounded-[42px] border-[9px] border-[#1d1d23] bg-[#09090c] p-2.5 ring-1 ring-white/15">
          {/* Dynamic island */}
          <div className="relative z-20 mx-auto mb-2 flex h-5 w-24 items-center justify-between rounded-full border border-white/15 bg-black px-2.5">
            <span className="size-2 rounded-full border border-white/20 bg-[#111116]" />
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" />
          </div>

          {/* Status bar */}
          <div className="flex items-center justify-between px-3 pb-2 font-mono text-[10px] text-neutral-400">
            <span>۱۰:۴۲</span>
            <div className="flex items-center gap-1.5">
              <Wifi className="size-3" />
              <Battery className="size-3.5" />
            </div>
          </div>

          {/* In-app header */}
          <div className="flex items-center justify-between rounded-t-2xl border-b border-white/10 bg-white/[0.02] px-2.5 py-2">
            <div className="flex items-center gap-1.5">
              <ArkaMark className="size-3.5 shrink-0 text-white" />
              <span dir="ltr" className="font-display text-[12px] font-bold tracking-tight text-white">
                ARKA
              </span>
            </div>
            <span className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[9.5px] text-neutral-300">
              Sonnet 4
            </span>
          </div>

          <div className="h-[300px]">
            <Conversation compact />
          </div>

          {/* Home indicator */}
          <div className="mx-auto mb-0.5 mt-2 h-1 w-24 rounded-full bg-white/30" />
        </div>
      </div>
    </div>
  );
}
