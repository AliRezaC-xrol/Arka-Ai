"use client";

import * as React from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Copy,
  Cpu,
  ImageIcon,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { ArkaMark } from "@/components/site-navbar";

export function HeroWindow() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full text-start text-foreground select-none" dir="rtl">
      {/* Soft Ambient Monochrome Silver Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-3 rounded-[32px] bg-gradient-to-tr from-white/[0.08] via-white/[0.03] to-transparent opacity-60 blur-2xl"
      />

      {/* Main Glass Workspace Window */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/15 bg-[#0b0b0e]/95 shadow-[0_30px_90px_-15px_rgba(0,0,0,0.95)] backdrop-blur-2xl">
        {/* Top Window Header Bar */}
        <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-3 sm:px-5">
          {/* Window Controls + Title */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="size-2.5 rounded-full bg-white/20" />
              <span className="size-2.5 rounded-full bg-white/15" />
              <span className="size-2.5 rounded-full bg-white/15" />
            </div>
            <div className="h-3.5 w-[1px] bg-white/10 mx-0.5" />
            <div className="flex items-center gap-2">
              <ArkaMark className="size-4 text-white" />
              <span dir="ltr" className="font-display text-[13px] font-bold text-white tracking-tight">
                ARKA
              </span>
              <span className="text-[11px] text-neutral-400 font-normal">/ گفتگو</span>
            </div>
          </div>

          {/* Model & Live Status Badges */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] text-emerald-400 font-medium">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>متصل به کلاستر</span>
            </div>

            <div className="hidden sm:flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-neutral-300 font-mono">
              <Cpu className="size-3 text-neutral-400" />
              <span>Claude Sonnet 4</span>
            </div>
          </div>
        </div>

        {/* Conversation Thread Canvas */}
        <div className="p-4 sm:p-6 space-y-5">
          {/* 1. User Message Card */}
          <div className="flex flex-col items-start ms-auto max-w-[90%] sm:max-w-[85%]">
            <div className="rounded-[20px] rounded-se-sm border border-white/15 bg-white text-black px-4 py-3 text-[13.5px] leading-6 font-medium shadow-sm">
              معماری اتصال به مدل‌های هوش مصنوعی با قابلیت سوئیچ خودکار بین کلیدها (Auto-Failover) و رمزنگاری را پیشنهاد بده.
            </div>
            <span className="mt-1 ps-1 text-[10px] text-neutral-500 font-mono">۱۰:۴۲</span>
          </div>

          {/* 2. Assistant Response Card */}
          <div className="flex items-start gap-3 me-auto w-full">
            <div className="grid size-7 shrink-0 place-items-center rounded-xl border border-white/20 bg-white/10 shadow-sm mt-0.5">
              <ArkaMark className="size-4 text-white" />
            </div>

            <div className="flex-1 space-y-3 rounded-[22px] rounded-ss-sm border border-white/10 bg-white/[0.03] p-4 text-[13px] leading-7 text-neutral-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-2 text-xs">
                <div className="flex items-center gap-2 font-semibold text-white">
                  <Sparkles className="size-3.5 text-neutral-400" />
                  <span>پاسخ ارکا با مدل Claude Sonnet 4</span>
                </div>
                <span className="text-[10px] text-neutral-400 font-mono">کلاستر چندکلیدی BYOK</span>
              </div>

              <p className="text-neutral-300">
                طراحی پیشنهادی کلاستر متمرکز ارکا با تفکیک وظایف و امنیت سخت‌گیرانه:
              </p>

              <div className="grid gap-2 text-[12.5px]">
                <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-black/40 p-2.5">
                  <ShieldCheck className="size-4 shrink-0 text-neutral-300 mt-0.5" />
                  <div>
                    <strong className="text-white">رمزنگاری کلیدها (AES-256-GCM):</strong> کلیدهای API با بردار تصادفی و تگ احراز هویت در دیتابیس رمز شده و صرفاً در حافظه رم سرور رمزگشایی می‌شوند.
                  </div>
                </div>

                <div className="flex items-start gap-2.5 rounded-xl border border-white/5 bg-black/40 p-2.5">
                  <Zap className="size-4 shrink-0 text-neutral-300 mt-0.5" />
                  <div className="w-full">
                    <div className="flex items-center justify-between">
                      <strong className="text-white">جابجایی خودکار بدون قطعی چت:</strong>
                      <span className="text-[10.5px] font-mono text-emerald-400">۲ از ۲ کلید فعال</span>
                    </div>
                    <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                      <span className="rounded bg-white/5 px-2 py-0.5 text-neutral-300">کلید ۱ (اصلی): sk-...9a12</span>
                      <span className="rounded bg-white/5 px-2 py-0.5 text-neutral-400">کلید ۲ (رزرو Failover): sk-...4d88</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Toolbar */}
              <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[11px] text-neutral-400">
                <span className="flex items-center gap-1.5 text-neutral-400">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span>تست اعتبارسنجی پاس شد (۳۷۱ تست فعال)</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="flex items-center gap-1 rounded-md px-2 py-0.5 hover:bg-white/10 hover:text-white transition-colors"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  <span>{copied ? "کپی شد" : "کپی"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* 3. Floating Capsule Composer Preview */}
          <div className="mt-4 rounded-[22px] border border-white/15 bg-black/50 p-3 shadow-lg">
            <div className="flex items-center justify-between px-1">
              <span className="text-[13px] text-neutral-400">
                هر چه می‌خواهید بپرسید...
              </span>
              <span className="inline-block h-4 w-1 bg-white/70 animate-pulse rounded-full" />
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-2.5">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-1 text-xs text-neutral-200">
                  <span className="size-1.5 rounded-full bg-emerald-400" />
                  <span dir="ltr">Claude Sonnet 4</span>
                  <ChevronDown className="size-3 text-neutral-400" />
                </div>

                <div className="grid size-7 place-items-center rounded-full text-neutral-400 hover:text-white">
                  <Paperclip className="size-3.5" />
                </div>
                <div className="grid size-7 place-items-center rounded-full text-neutral-400 hover:text-white">
                  <ImageIcon className="size-3.5" />
                </div>
              </div>

              <div className="grid size-7 place-items-center rounded-full bg-white text-black shadow-md">
                <ArrowUp className="size-4 stroke-[2.5]" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
