"use client";

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

export function HeroWindow() {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative w-full select-none" dir="rtl">
      {/* =========================================================================
          1. LAPTOP FRAME: Renders on Tablet, Laptop, and Desktop (md and above)
         ========================================================================= */}
      <div className="hidden md:block w-full">
        {/* Soft Ambient Glow behind laptop */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-4 rounded-[40px] bg-gradient-to-tr from-white/[0.08] via-white/[0.02] to-transparent opacity-60 blur-2xl"
        />

        {/* Laptop Screen Top Lid */}
        <div className="relative rounded-t-[22px] lg:rounded-t-[26px] border-[10px] lg:border-[12px] border-[#18181d] bg-[#09090c] shadow-[0_30px_90px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/10 overflow-hidden">
          {/* Laptop Webcam & Sensor Bar */}
          <div className="relative flex items-center justify-center py-1.5 bg-[#141418] border-b border-white/5">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-[#08080a] border border-white/20 shadow-inner" />
              <span className="size-1 rounded-full bg-emerald-400/90 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            </div>
          </div>

          {/* Screen Content: macOS Window Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-4 py-2.5 lg:px-5 lg:py-3">
            {/* Window Traffic Lights & Title */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex items-center gap-1.5 shrink-0">
                <span className="size-2.5 rounded-full bg-[#ff5f56]/90 border border-black/20" />
                <span className="size-2.5 rounded-full bg-[#ffbd2e]/90 border border-black/20" />
                <span className="size-2.5 rounded-full bg-[#27c93f]/90 border border-black/20" />
              </div>
              <div className="h-3.5 w-[1px] bg-white/10 mx-0.5 shrink-0" />
              <div className="flex items-center gap-2 truncate">
                <ArkaMark className="size-3.5 lg:size-4 text-white shrink-0" />
                <span dir="ltr" className="font-display text-[12.5px] lg:text-[13px] font-bold text-white tracking-tight">
                  ARKA
                </span>
                <span className="text-[11px] text-neutral-400 font-normal">/ گفتگو</span>
              </div>
            </div>

            {/* Model & Live Status Badges */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-0.5 text-[10.5px] lg:text-[11px] text-emerald-400 font-medium">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>متصل به کلاستر</span>
              </div>

              <div className="flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-0.5 text-[11px] text-neutral-300 font-mono">
                <Cpu className="size-3 text-neutral-400" />
                <span>Claude Sonnet 4</span>
              </div>
            </div>
          </div>

          {/* Screen Conversation Body */}
          <div className="p-4 lg:p-6 space-y-4 lg:space-y-5 text-start">
            {/* User Message */}
            <div className="flex flex-col items-start ms-auto max-w-[85%]">
              <div className="rounded-[18px] lg:rounded-[20px] rounded-se-sm border border-white/15 bg-white text-black px-4 py-2.5 lg:py-3 text-[13px] lg:text-[13.5px] leading-6 font-medium shadow-sm">
                معماری اتصال به مدل‌های هوش مصنوعی با قابلیت سوئیچ خودکار بین کلیدها (Auto-Failover) و امنیت بالا را پیشنهاد بده.
              </div>
              <span className="mt-1 ps-1 text-[10px] text-neutral-500 font-mono">۱۰:۴۲</span>
            </div>

            {/* Assistant Response */}
            <div className="flex items-start gap-2.5 lg:gap-3 me-auto w-full">
              <div className="grid size-6 lg:size-7 shrink-0 place-items-center rounded-lg lg:rounded-xl border border-white/20 bg-white/10 shadow-sm mt-0.5">
                <ArkaMark className="size-3.5 lg:size-4 text-white" />
              </div>

              <div className="flex-1 space-y-2.5 lg:space-y-3 rounded-[18px] lg:rounded-[22px] rounded-ss-sm border border-white/10 bg-white/[0.03] p-3.5 lg:p-4 text-[12px] lg:text-[13px] leading-6 lg:leading-7 text-neutral-200">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 text-[11px] lg:text-xs">
                  <div className="flex items-center gap-1.5 font-semibold text-white">
                    <Sparkles className="size-3 lg:size-3.5 text-neutral-400" />
                    <span>پاسخ ارکا با مدل Claude Sonnet 4</span>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">کلاستر چندکلیدی BYOK</span>
                </div>

                <p className="text-neutral-300 text-[12px] lg:text-[13px]">
                  طراحی پیشنهادی کلاستر متمرکز ارکا با تفکیک وظایف و امنیت سخت‌گیرانه:
                </p>

                <div className="grid gap-2 text-[11.5px] lg:text-[12.5px]">
                  <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/40 p-2.5">
                    <ShieldCheck className="size-3.5 lg:size-4 shrink-0 text-neutral-300 mt-0.5" />
                    <div>
                      <strong className="text-white">رمزنگاری کلیدها (AES-256-GCM):</strong> کلیدهای API شخصی با بردار تصادفی و تگ احراز هویت در دیتابیس رمز شده و صرفاً در رم سرور رمزگشایی می‌شوند.
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-xl border border-white/5 bg-black/40 p-2.5">
                    <Zap className="size-3.5 lg:size-4 shrink-0 text-neutral-300 mt-0.5" />
                    <div className="w-full">
                      <div className="flex items-center justify-between">
                        <strong className="text-white">جابجایی خودکار بدون قطعی چت:</strong>
                        <span className="text-[10.5px] font-mono text-emerald-400">۲ از ۲ کلید فعال</span>
                      </div>
                      <div className="mt-1.5 grid grid-cols-2 gap-2 text-[11px] font-mono">
                        <span className="rounded bg-white/5 px-2 py-0.5 text-neutral-300 truncate">کلید ۱ (اصلی): sk-...9a12</span>
                        <span className="rounded bg-white/5 px-2 py-0.5 text-neutral-400 truncate">کلید ۲ (رزرو Failover): sk-...4d88</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Bar */}
                <div className="flex items-center justify-between border-t border-white/5 pt-2 text-[10.5px] text-neutral-400">
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

            {/* Composer Capsule */}
            <div className="mt-3 lg:mt-4 rounded-[18px] lg:rounded-[22px] border border-white/15 bg-black/50 p-2.5 lg:p-3 shadow-lg">
              <div className="flex items-center justify-between px-1">
                <span className="text-[12.5px] lg:text-[13px] text-neutral-400">
                  هر چه می‌خواهید بپرسید...
                </span>
                <span className="inline-block h-3.5 w-1 bg-white/70 animate-pulse rounded-full" />
              </div>

              <div className="mt-2.5 flex items-center justify-between border-t border-white/10 pt-2">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full border border-white/15 bg-white/[0.05] px-2.5 py-0.5 text-[11px] text-neutral-200">
                    <span className="size-1.5 rounded-full bg-emerald-400" />
                    <span dir="ltr">Claude Sonnet 4</span>
                    <ChevronDown className="size-3 text-neutral-400" />
                  </div>
                  <div className="grid size-6 place-items-center rounded-full text-neutral-400 hover:text-white">
                    <Paperclip className="size-3.5" />
                  </div>
                  <div className="grid size-6 place-items-center rounded-full text-neutral-400 hover:text-white">
                    <ImageIcon className="size-3.5" />
                  </div>
                </div>

                <div className="grid size-6 lg:size-7 place-items-center rounded-full bg-white text-black shadow-md">
                  <ArrowUp className="size-3.5 lg:size-4 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Laptop Chassis Bottom Base & Hinge */}
        <div className="relative w-[104%] -ms-[2%] h-3.5 lg:h-4.5 bg-gradient-to-b from-[#2b2b32] via-[#1a1a20] to-[#0e0e12] rounded-b-[14px] lg:rounded-b-[18px] border-t border-white/20 shadow-[0_20px_40px_rgba(0,0,0,0.85)] flex items-start justify-center">
          {/* Thumb Notch */}
          <div className="w-20 lg:w-28 h-1.5 lg:h-2 bg-[#09090c] rounded-b-md border-t border-white/10 shadow-inner" />
        </div>
        {/* Desk Surface Shadow */}
        <div className="w-[90%] h-3 mx-auto bg-black/80 blur-md rounded-full mt-0.5" />
      </div>

      {/* =========================================================================
          2. SMARTPHONE FRAME: Renders on Mobile Phones (below md breakpoint)
         ========================================================================= */}
      <div className="block md:hidden w-full max-w-[340px] xs:max-w-[360px] mx-auto">
        {/* Soft Ambient Glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-2 rounded-[46px] bg-gradient-to-tr from-white/[0.08] to-transparent opacity-60 blur-xl"
        />

        {/* Smartphone Body Chassis */}
        <div className="relative rounded-[42px] border-[9px] border-[#1d1d23] bg-[#09090c] p-2.5 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.95)] ring-1 ring-white/15 overflow-hidden">
          {/* Dynamic Island Capsule */}
          <div className="relative z-20 flex items-center justify-between w-24 h-5 mx-auto px-2.5 rounded-full bg-black border border-white/15 shadow-sm mb-2">
            <span className="size-2 rounded-full bg-[#111116] border border-white/20" />
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>

          {/* Phone Top Status Bar */}
          <div className="flex items-center justify-between px-3 pb-2 text-[10px] text-neutral-400 font-mono">
            <span>۱۰:۴۲</span>
            <div className="flex items-center gap-1.5 text-neutral-400">
              <Wifi className="size-3" />
              <Battery className="size-3.5" />
            </div>
          </div>

          {/* In-Phone Arka Header */}
          <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.02] px-2.5 py-2 rounded-t-2xl">
            <div className="flex items-center gap-1.5">
              <ArkaMark className="size-3.5 text-white shrink-0" />
              <span dir="ltr" className="font-display text-[12px] font-bold text-white tracking-tight">
                ARKA
              </span>
            </div>
            <div className="flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[9.5px] text-emerald-400 font-medium">
              <span className="size-1 rounded-full bg-emerald-400 animate-pulse" />
              <span>متصل به کلاستر</span>
            </div>
          </div>

          {/* Phone Conversation Canvas */}
          <div className="py-3 px-1 space-y-3 text-start">
            {/* User Message Bubble */}
            <div className="flex flex-col items-start ms-auto max-w-[92%]">
              <div className="rounded-[16px] rounded-se-sm bg-white text-black px-3 py-2 text-[11.5px] leading-5 font-medium shadow-sm">
                معماری اتصال به مدل‌های هوش مصنوعی با جابجایی خودکار کلیدها (Failover) را پیشنهاد بده.
              </div>
              <span className="mt-1 ps-1 text-[9px] text-neutral-500 font-mono">۱۰:۴۲</span>
            </div>

            {/* Assistant Bubble */}
            <div className="space-y-2 rounded-[16px] rounded-ss-sm border border-white/10 bg-white/[0.04] p-2.5 text-[11px] leading-5 text-neutral-200">
              <div className="flex items-center justify-between border-b border-white/5 pb-1.5 text-[10px]">
                <div className="flex items-center gap-1 font-semibold text-white">
                  <Sparkles className="size-3 text-neutral-400" />
                  <span>پاسخ ارکا (Claude Sonnet)</span>
                </div>
                <span className="text-[9px] text-emerald-400 font-mono">۲ کلید فعال</span>
              </div>

              <div className="space-y-1.5 text-[10.5px]">
                <div className="flex items-start gap-1.5 rounded-lg border border-white/5 bg-black/40 p-1.5">
                  <ShieldCheck className="size-3 shrink-0 text-neutral-300 mt-0.5" />
                  <div>
                    <strong className="text-white">رمزنگاری AES-256:</strong> کلیدها امن در سرور ذخیره می‌شوند.
                  </div>
                </div>

                <div className="flex items-start gap-1.5 rounded-lg border border-white/5 bg-black/40 p-1.5">
                  <Zap className="size-3 shrink-0 text-neutral-300 mt-0.5" />
                  <div>
                    <strong className="text-white">جابجایی خودکار:</strong> در صورت خطا، بدون قطعی کلید جایگزین فعال می‌شود.
                  </div>
                </div>
              </div>
            </div>

            {/* Phone Capsule Composer */}
            <div className="rounded-[18px] border border-white/15 bg-black/60 p-2 shadow-md">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] text-neutral-400 truncate">
                  هر چه می‌خواهید بپرسید...
                </span>
                <span className="inline-block h-3 w-1 bg-white/70 animate-pulse rounded-full" />
              </div>

              <div className="mt-2 flex items-center justify-between border-t border-white/10 pt-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center gap-0.5 rounded-full border border-white/15 bg-white/[0.05] px-2 py-0.5 text-[10px] text-neutral-200">
                    <span className="size-1 rounded-full bg-emerald-400" />
                    <span dir="ltr">Sonnet 4</span>
                    <ChevronDown className="size-2.5 text-neutral-400" />
                  </div>
                  <Paperclip className="size-3 text-neutral-400" />
                </div>

                <div className="grid size-5 place-items-center rounded-full bg-white text-black shadow-md">
                  <ArrowUp className="size-3 stroke-[2.5]" />
                </div>
              </div>
            </div>
          </div>

          {/* Phone Bottom Home Bar Indicator */}
          <div className="w-24 h-1 bg-white/30 rounded-full mx-auto mt-2 mb-0.5" />
        </div>
      </div>
    </div>
  );
}
