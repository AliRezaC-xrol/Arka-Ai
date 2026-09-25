"use client";

import * as React from "react";
import {
  ArrowUp,
  Check,
  ChevronDown,
  Code2,
  Copy,
  Cpu,
  ImageIcon,
  Key,
  MessageSquare,
  Paperclip,
  ShieldCheck,
  Sparkles,
  Zap,
} from "lucide-react";
import { cn } from "@/lib/utils";

type ShowcaseTab = "text" | "code" | "image" | "provider";

const TABS: Array<{ id: ShowcaseTab; label: string; icon: React.ElementType; model: string }> = [
  { id: "text", label: "گفتگوی متنی", icon: MessageSquare, model: "Claude Sonnet 4" },
  { id: "code", label: "تولید کد تایپ‌سیف", icon: Code2, model: "DeepSeek-R1" },
  { id: "image", label: "استودیو تولید تصویر", icon: ImageIcon, model: "FLUX.1 Schnell" },
  { id: "provider", label: "پروایدر شخصی و فیل‌اور", icon: Key, model: "BYOK Cluster" },
];

export function HeroWindow() {
  const [activeTab, setActiveTab] = React.useState<ShowcaseTab>("text");
  const [copied, setCopied] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isIntersecting, setIsIntersecting] = React.useState(true);

  // Performance: Pause scroll tracking when off-screen
  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Scroll driven animation: As user scrolls the hero, smoothly rotate showcase
  React.useEffect(() => {
    if (!isIntersecting) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          // Determine tab based on scroll band in hero
          if (scrollY < 120) {
            setActiveTab("text");
          } else if (scrollY < 260) {
            setActiveTab("code");
          } else if (scrollY < 420) {
            setActiveTab("image");
          } else if (scrollY < 650) {
            setActiveTab("provider");
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isIntersecting]);

  const copyCode = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Tab index for smooth gliding background box
  const tabIndex = TABS.findIndex((t) => t.id === activeTab);

  return (
    <div
      ref={containerRef}
      className="relative w-full text-start text-foreground select-none"
      dir="rtl"
    >
      {/* Dynamic Ambient Background Glow that glides with active tab */}
      <div
        className="pointer-events-none absolute -inset-2 rounded-3xl opacity-35 blur-2xl transition-all duration-700 ease-out will-change-transform"
        style={{
          background:
            activeTab === "text"
              ? "radial-gradient(circle at 70% 30%, rgba(255, 255, 255, 0.15), transparent 70%)"
              : activeTab === "code"
                ? "radial-gradient(circle at 40% 40%, rgba(56, 189, 248, 0.18), transparent 70%)"
                : activeTab === "image"
                  ? "radial-gradient(circle at 50% 50%, rgba(168, 85, 247, 0.2), transparent 70%)"
                  : "radial-gradient(circle at 30% 60%, rgba(16, 185, 129, 0.18), transparent 70%)",
        }}
      />

      {/* Main Glass Showcase Window */}
      <div className="relative overflow-hidden rounded-card border border-white/10 bg-[#0d0d0f]/95 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.95)] backdrop-blur-xl">
        {/* Top Window Bar: Browser dots + Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-white/10 bg-black/40 px-3 py-2 gap-2">
          {/* macOS window dots */}
          <div className="hidden sm:flex items-center gap-1.5 px-2">
            <span className="size-2.5 rounded-full bg-red-500/30 border border-red-500/40" />
            <span className="size-2.5 rounded-full bg-amber-500/30 border border-amber-500/40" />
            <span className="size-2.5 rounded-full bg-emerald-500/30 border border-emerald-500/40" />
            <span dir="ltr" className="ms-2 font-mono text-[11px] text-white/40">
              arka.ai/chat
            </span>
          </div>

          {/* Gliding Tabs Header with Soft Ambient Highlight Box */}
          <div className="relative flex items-center gap-1 p-1 rounded-control bg-white/[0.04] border border-white/5 overflow-x-auto">
            {/* The Floating Gliding Box (Moving Highlight Box from Phase 0 design) */}
            <div
              className="absolute inset-y-1 rounded-[7px] border border-white/20 bg-white/10 shadow-sm backdrop-blur-md transition-all duration-300 ease-out will-change-transform"
              style={{
                width: `calc((100% - 0.5rem) / 4)`,
                transform: `translateX(-${tabIndex * 100}%)`,
              }}
            />

            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "relative z-10 flex flex-1 items-center justify-center gap-1.5 px-2.5 py-1 text-[11px] font-medium transition-colors whitespace-nowrap",
                    isActive ? "text-white font-bold" : "text-foreground-3 hover:text-white",
                  )}
                >
                  <Icon className="size-3 shrink-0" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-5 min-h-[320px] sm:min-h-[360px] flex flex-col justify-between">
          {/* ================= Mode 1: Text Chat ================= */}
          <div className={activeTab === "text" ? "block space-y-4 animate-in fade-in-50 duration-300" : "hidden"}>
            <div className="flex flex-col items-start">
              <div className="max-w-[90%] rounded-card rounded-ss-sm bg-white px-4 py-2.5 text-[13px] leading-6 text-black font-medium shadow-sm">
                یک برنامه‌ی جامع و سبک ۳ روزه برای استانبول به همراه برآورد هزینه بنویس.
              </div>
              <span className="mt-1 ps-1 font-mono text-[10px] text-foreground-3">۱۰:۴۲</span>
            </div>

            {/* Assistant Response with Typing Effect */}
            <div className="flex items-start gap-3">
              <div className="size-7 rounded-full border border-white/15 bg-white/5 grid place-items-center text-[10px] font-bold text-white shrink-0 mt-0.5">
                A
              </div>
              <div className="max-w-[90%] rounded-card rounded-se-sm border border-white/10 bg-white/[0.04] p-3.5 text-[12.5px] leading-relaxed text-neutral-200 space-y-2">
                <div className="flex items-center gap-2 text-white font-semibold text-xs border-b border-white/10 pb-1.5">
                  <Sparkles className="size-3.5 text-amber-300" />
                  <span>برنامه پیشنهادی کلاستر آرکا (Claude Sonnet 4):</span>
                </div>
                <p><strong className="text-white">روز اول:</strong> ورود، بازدید از میدان سلطان‌احمد، مسجد ایاصوفیه و گشت عصرگاهی در بازار بزرگ.</p>
                <p><strong className="text-white">روز دوم:</strong> گشت با کشتی روی تنگه بسفر، محله رنگارنگ بالات و غروب در برج گالاتا.</p>
                <p><strong className="text-white">روز سوم:</strong> خیابان استقلال، موزه مادام توسو و طعم باقلوای حافظ مصطفی.
                  <span className="ms-1 inline-block h-3.5 w-1.5 bg-white animate-pulse" />
                </p>
              </div>
            </div>
          </div>

          {/* ================= Mode 2: Code Generation ================= */}
          <div className={activeTab === "code" ? "block space-y-4 animate-in fade-in-50 duration-300" : "hidden"}>
            <div className="flex flex-col items-start">
              <div className="max-w-[90%] rounded-card rounded-ss-sm bg-white px-4 py-2.5 text-[13px] leading-6 text-black font-medium shadow-sm">
                یک هوک ری‌اکت تایپ‌اسکریپت برای Debounce ورودی جستجو بنویس.
              </div>
              <span className="mt-1 ps-1 font-mono text-[10px] text-foreground-3">۱۰:۴۳</span>
            </div>

            {/* Syntax Highlighted Code Box */}
            <div className="rounded-control border border-white/15 bg-[#08080a] overflow-hidden text-start font-mono text-xs shadow-inner">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-3 py-1.5 text-[11px] text-foreground-3">
                <span dir="ltr" className="text-emerald-400 font-semibold">useDebounce.ts (DeepSeek-R1)</span>
                <button
                  type="button"
                  onClick={copyCode}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
                  <span>{copied ? "کپی شد" : "کپی کد"}</span>
                </button>
              </div>
              <pre dir="ltr" className="p-3 text-[11.5px] leading-5 text-neutral-300 overflow-x-auto">
                <code>{`import { useState, useEffect } from "react";

export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debounced;
}`}</code>
              </pre>
            </div>
          </div>

          {/* ================= Mode 3: Image Studio ================= */}
          <div className={activeTab === "image" ? "block space-y-4 animate-in fade-in-50 duration-300" : "hidden"}>
            <div className="flex flex-col items-start">
              <div className="max-w-[90%] rounded-card rounded-ss-sm bg-white px-4 py-2.5 text-[13px] leading-6 text-black font-medium shadow-sm">
                تصویری از یک استودیوی طراحی مینیمال با پالت خاکستری و نور متمرکز خلق کن.
              </div>
              <span className="mt-1 ps-1 font-mono text-[10px] text-foreground-3">۱۰:۴۴</span>
            </div>

            {/* Generated Image Card */}
            <div className="overflow-hidden rounded-control border border-white/15 bg-black/60 shadow-lg">
              <div className="relative aspect-[16/9] w-full bg-gradient-to-tr from-neutral-900 via-zinc-800 to-black p-4 flex flex-col justify-between">
                {/* Subtle Grid and Geometric Motif */}
                <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
                <div className="relative flex items-center justify-between text-[11px]">
                  <span className="rounded bg-black/70 border border-white/20 px-2 py-0.5 text-white font-mono">
                    FLUX.1 Schnell
                  </span>
                  <span className="text-white/60 font-mono text-[10px]">1024 × 1024 • 1.4s</span>
                </div>

                <div className="relative text-center py-4">
                  <div className="mx-auto size-14 rounded-2xl border border-white/20 bg-white/5 backdrop-blur-md grid place-items-center mb-2 shadow-2xl">
                    <ImageIcon className="size-6 text-white" />
                  </div>
                  <span className="font-display font-bold text-sm tracking-widest text-white block">
                    ARKA IMAGE STUDIO
                  </span>
                  <span className="text-[11px] text-foreground-3 mt-1 block">
                    «طراحی مینیمال مه‌آلود با پالت خاکستری»
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= Mode 4: Personal Providers & Failover ================= */}
          <div className={activeTab === "provider" ? "block space-y-3 animate-in fade-in-50 duration-300" : "hidden"}>
            <div className="rounded-control border border-emerald-500/30 bg-emerald-500/[0.05] p-3 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="size-4 text-emerald-400" />
                <span className="font-bold text-white">کلاستر چندکلیدی متصل (Multi-Key BYOK)</span>
              </div>
              <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.2 text-[10px] font-mono">
                AES-256-GCM
              </span>
            </div>

              {/* Provider Card Mock */}
              <div className="rounded-control border border-line bg-card/60 p-3 space-y-2.5 text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="font-bold text-white">OpenAI Enterprise Primary</span>
                  </div>
                  <span className="font-mono text-[10.5px] text-foreground-3">استفاده کمترین بار (Least-Used)</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                  <div className="bg-black/40 border border-line p-2 rounded">
                    <span className="text-foreground-3 block text-[10px]">کلید ۱ (اصلی)</span>
                    <span className="text-white">sk-...9a12 (فعال)</span>
                  </div>
                  <div className="bg-black/40 border border-line p-2 rounded">
                    <span className="text-foreground-3 block text-[10px]">کلید ۲ (رزرو Failover)</span>
                    <span className="text-emerald-400">sk-...4d88 (آماده‌باش)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1 text-[11px] text-foreground-3">
                  <span className="flex items-center gap-1">
                    <Zap className="size-3 text-amber-400" />
                    جابجایی آنی در صورت سقف مصرف (بدون قطعی چت)
                  </span>
                  <span className="text-white font-bold">{"۲ از ۲ کلید فعال"}</span>
                </div>
              </div>
            </div>

          {/* Bottom Interactive Composer Pill */}
          <div className="mt-4 rounded-[12px] border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center justify-between text-[11px] text-foreground-3 mb-1 px-1">
              <span>مدل فعال در این گفتگو:</span>
              <span className="font-mono text-white text-[11.5px] flex items-center gap-1">
                <Cpu className="size-3 text-neutral-400" />
                {TABS.find((t) => t.id === activeTab)?.model}
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-white/5">
              <Paperclip className="size-4 text-white/40 shrink-0" />
              <span className="text-xs text-white/40 truncate">
                پیام خود را بنویسید یا مدلی دیگر انتخاب کنید...
              </span>
              <div className="ms-auto flex items-center gap-1.5">
                <span className="flex items-center gap-1 rounded-full border border-white/15 px-2 py-0.5 text-[10.5px] text-white/80">
                  <span dir="ltr">{TABS.find((t) => t.id === activeTab)?.model}</span>
                  <ChevronDown className="size-3" />
                </span>
                <span className="grid size-7 place-items-center rounded-control bg-white text-black shadow">
                  <ArrowUp className="size-3.5" />
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
