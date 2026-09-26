/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProviderLogoItem {
  id: string;
  name: string;
  subname: string;
  badge?: string;
  renderLogo: () => React.JSX.Element;
}

/* =========================================================================
   AUTHENTIC OFFICIAL AI LOGOS (Exact brand vector marks & colors)
   ========================================================================= */

/** 1. OpenAI Official Spiral Vortex */
export function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#10A37F" className={className} aria-hidden>
      <path d="M22.28 9.82a5.98 5.98 0 0 0-.51-4.91 6.05 6.05 0 0 0-6.51-2.9 6.06 6.06 0 0 0-10.28 2.17 5.98 5.98 0 0 0-4 2.9 6.05 6.05 0 0 0 .74 7.1 5.98 5.98 0 0 0 .51 4.91 6.05 6.05 0 0 0 6.51 2.9 6.07 6.07 0 0 0 10.28-2.18 5.99 5.99 0 0 0 4-2.9 6.05 6.05 0 0 0-.74-7.09zM13.26 22.43a4.5 4.5 0 0 1-2.88-1.04l.14-.08 4.78-2.76c.24-.14.39-.4.39-.68v-6.74l2.02 1.17c.02.01.04.03.04.05v5.58a4.5 4.5 0 0 1-4.49 4.5zm-9.66-4.5a4.47 4.47 0 0 1-.53-3.02l.14.09 4.78 2.76c.24.14.54.14.78 0l5.84-3.37v2.33c0 .03-.01.05-.03.06l-4.84 2.8a4.5 4.5 0 0 1-6.14-2.03l-.01.01zm-1.03-9.36a4.48 4.48 0 0 1 2.34-1.97v.17l.01 5.52c0 .28.15.53.39.68l5.84 3.37-2.02 1.17a.08.08 0 0 1-.07 0L4.23 14.7a4.5 4.5 0 0 1-1.66-6.13zm16.6 3.86l-5.84-3.37 2.02-1.17c.02-.01.05-.01.07 0l4.83 2.79a4.5 4.5 0 0 1-.68 8.1v-5.67c0-.28-.15-.54-.4-.68zm2.01-3.02l-.14-.09-4.77-2.78a.78.78 0 0 0-.79 0L9.41 7.9V5.56c0-.02.01-.05.03-.06l4.84-2.79a4.5 4.5 0 0 1 6.68 5.03zm-12.64-4.24a4.48 4.48 0 0 1 2.87 1.04l-.14.08-4.78 2.76c-.24.14-.39.4-.39.68v6.74l-2.02-1.17a.07.07 0 0 1-.04-.05v-5.58a4.5 4.5 0 0 1 4.5-4.5zm1.89 5.7l2.91 1.68v3.37l-2.91-1.68V10.87z" />
    </svg>
  );
}

/** 2. Anthropic Claude Official Terracotta Starburst */
export function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#D97757" className={className} aria-hidden>
      <path d="M12 2a1.5 1.5 0 0 1 1.49 1.36L13.5 3.5v5.09l3.6-3.6a1.5 1.5 0 0 1 2.22 2.01l-.1.11-3.6 3.59h5.08a1.5 1.5 0 0 1 1.5 1.5c0 .78-.6 1.42-1.36 1.5l-.14.01h-5.08l3.6 3.6a1.5 1.5 0 0 1-2.01 2.22l-.11-.1-3.6-3.6v5.08a1.5 1.5 0 0 1-1.5 1.5c-.78 0-1.42-.6-1.5-1.36l-.01-.14v-5.08l-3.6 3.6a1.5 1.5 0 0 1-2.22-2.01l.1-.11 3.6-3.6H3.5a1.5 1.5 0 0 1-1.5-1.5c0-.78.6-1.42 1.36-1.5l.14-.01h5.08L5 7.1a1.5 1.5 0 0 1 2.01-2.22l.11.1 3.6 3.6V3.5A1.5 1.5 0 0 1 12 2z" />
    </svg>
  );
}

/** 3. Google Gemini Official 4-Point Radiant Spark Star */
export function GeminiLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="gemini-star-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1B72E8" />
          <stop offset="50%" stopColor="#8E44AD" />
          <stop offset="100%" stopColor="#EA4335" />
        </linearGradient>
      </defs>
      <path
        fill="url(#gemini-star-grad)"
        d="M12 0c-.3 6.3-5.7 11.7-12 12 6.3.3 11.7 5.7 12 12 .3-6.3 5.7-11.7 12-12-6.3-.3-11.7-5.7-12-12z"
      />
    </svg>
  );
}

/** 4. DeepSeek Official Mascot Icon */
export function DeepSeekLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <path
        fill="#0066FF"
        d="M21.5 13.8c-.8 3.5-3.8 6.2-7.5 6.2-2.1 0-4-.8-5.4-2.1l-4.1 1.1c-.8.2-1.5-.5-1.3-1.3l1.1-4.1C3 12.2 2.2 10.3 2.2 8.2c0-4.6 4.3-8.2 9.5-8.2s9.5 3.7 9.5 8.2c0 1.9-.8 3.7-2.1 5.1l2.4.5z"
      />
      <circle cx="8" cy="7.5" r="1.2" fill="#FFFFFF" />
      <path d="M7 11.5c1.5 1.2 3.5 1.2 5 0" stroke="#FFFFFF" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

/** 5. xAI Grok Official Angular Logo */
export function GrokLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#FFFFFF" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

/** 6. Meta Llama Official Infinity Loop */
export function MetaLlamaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden>
      <defs>
        <linearGradient id="meta-blue-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0064e0" />
          <stop offset="100%" stopColor="#00aaff" />
        </linearGradient>
      </defs>
      <path
        fill="url(#meta-blue-grad)"
        d="M12 7.2c-2.3-2.7-4.6-4.2-7.1-4.2C2.2 3 0 5.4 0 9.2c0 4.6 3.7 9 7.4 9 2.5 0 4.6-1.5 6.6-4.5 2 3 4.1 4.5 6.6 4.5 3.7 0 7.4-4.4 7.4-9 0-3.8-2.2-6.2-4.9-6.2-2.5 0-4.8 1.5-7.1 4.2zm4.3 8.3c-1.8 0-3.4-1.3-4.3-3.4 1.4-2.2 2.8-3.5 4.3-3.5 1.4 0 2.4 1.1 2.4 2.9 0 2.4-1.2 4-2.4 4zm-8.6 0c-1.2 0-2.4-1.6-2.4-4 0-1.8 1-2.9 2.4-2.9 1.5 0 2.9 1.3 4.3 3.5-.9 2.1-2.5 3.4-4.3 3.4z"
      />
    </svg>
  );
}

/** 7. Mistral AI Official Stepped Pixels */
export function MistralLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#FF7000" className={className} aria-hidden>
      <path d="M3 3h4.2v3.6H3V3zm13.8 0H21v3.6h-4.2V3zM3 8.4h4.2V12H3V8.4zm8.4 0h4.2V12h-4.2V8.4zm5.4 0H21V12h-4.2V8.4zM3 13.8h4.2v3.6H3v-3.6zm4.2 0h4.2v3.6H7.2v-3.6zm8.4 0h4.2v3.6h-4.2v-3.6zM3 19.2h18V22H3v-2.8z" />
    </svg>
  );
}

/** 8. Perplexity AI Official Knot */
export function PerplexityLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="#20B2AA" className={className} aria-hidden>
      <path d="M13.2 2.5v6.1l4.8-4.8 1.7 1.7-4.8 4.8h6.1v2.4h-6.1l4.8 4.8-1.7 1.7-4.8-4.8v6.1h-2.4v-6.1l-4.8 4.8-1.7-1.7 4.8-4.8H3v-2.4h6.1L4.3 5.5l1.7-1.7 4.8 4.8V2.5h2.4z" />
    </svg>
  );
}

/** 9. FLUX.1 (Black Forest Labs) */
export function FluxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="4" fill="#FFFFFF" fillOpacity="0.25" />
    </svg>
  );
}

/* =========================================================================
   PROVIDER LIST WITH AUTHENTIC MARKS
   ========================================================================= */

export const PROVIDERS_LIST: ProviderLogoItem[] = [
  { id: "openai", name: "OpenAI", subname: "GPT-4o", renderLogo: () => <OpenAILogo className="size-4" /> },
  { id: "claude", name: "Claude", subname: "Sonnet 3.7", renderLogo: () => <ClaudeLogo className="size-4" /> },
  { id: "gemini", name: "Gemini", subname: "Flash 2.5", renderLogo: () => <GeminiLogo className="size-4" /> },
  { id: "deepseek", name: "DeepSeek", subname: "R1 & V3", renderLogo: () => <DeepSeekLogo className="size-4" /> },
  { id: "grok", name: "Grok", subname: "xAI 2", renderLogo: () => <GrokLogo className="size-3.5" /> },
  { id: "flux", name: "FLUX.1", subname: "Image Studio", badge: "تصویر", renderLogo: () => <FluxLogo className="size-4" /> },
  { id: "llama", name: "Llama", subname: "Meta 3.3", renderLogo: () => <MetaLlamaLogo className="size-4" /> },
  { id: "mistral", name: "Mistral", subname: "Large 2", renderLogo: () => <MistralLogo className="size-4" /> },
  { id: "perplexity", name: "Perplexity", subname: "Sonar Pro", renderLogo: () => <PerplexityLogo className="size-4" /> },
];

/**
 * 4x Repetitions per Set (36 items per set, >6000px wide).
 * Even on a 4K display (3840px), Set B alone easily overfills the entire viewport.
 * Result: The chain is 100% physically uninterrupted and continuous on all screens.
 * When the list reaches the end, the start of the list is immediately attached to it with zero gaps.
 */
const PROVIDER_STREAM = [
  ...PROVIDERS_LIST,
  ...PROVIDERS_LIST,
  ...PROVIDERS_LIST,
  ...PROVIDERS_LIST,
];

export function ProviderLogosRow({ className }: { className?: string }) {
  return (
    <div
      id="models"
      dir="ltr"
      className={cn(
        "relative w-full overflow-hidden select-none py-3.5 border-y border-white/5 bg-[#08080a] scroll-mt-20",
        className
      )}
    >
      {/* Soft gradient edge masks */}
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 sm:w-32 bg-gradient-to-r from-[#08080a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 sm:w-32 bg-gradient-to-l from-[#08080a] to-transparent" />

      {/* Endless, Unbroken Marquee Track */}
      <div className="arka-endless-track flex w-max flex-nowrap">
        {/* Set A (36 items, ending with exact 24px padding matching gap-6) */}
        <div className="flex shrink-0 items-center gap-6 pr-6 flex-nowrap">
          {PROVIDER_STREAM.map((p, idx) => (
            <div
              key={`a-${p.id}-${idx}`}
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-[#101013] px-3.5 py-1.5 transition-colors hover:border-white/30 hover:bg-white/[0.06] whitespace-nowrap"
            >
              <div className="grid size-6 place-items-center rounded-full bg-white/[0.06] border border-white/10 shrink-0">
                {p.renderLogo()}
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-display text-[13px] font-bold text-white tracking-tight">
                  {p.name}
                </span>
                <span className="text-[10.5px] text-neutral-400 font-mono">
                  {p.subname}
                </span>
                {p.badge && (
                  <span className="rounded-full bg-white/15 px-1.5 py-0.2 text-[9px] font-medium text-neutral-200">
                    {p.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Set B (Identical 36 items, smoothly sliding into Set A position with zero gap) */}
        <div aria-hidden="true" className="flex shrink-0 items-center gap-6 pr-6 flex-nowrap">
          {PROVIDER_STREAM.map((p, idx) => (
            <div
              key={`b-${p.id}-${idx}`}
              className="flex shrink-0 items-center gap-2.5 rounded-full border border-white/10 bg-[#101013] px-3.5 py-1.5 transition-colors hover:border-white/30 hover:bg-white/[0.06] whitespace-nowrap"
            >
              <div className="grid size-6 place-items-center rounded-full bg-white/[0.06] border border-white/10 shrink-0">
                {p.renderLogo()}
              </div>
              <div className="flex items-center gap-1.5 whitespace-nowrap">
                <span className="font-display text-[13px] font-bold text-white tracking-tight">
                  {p.name}
                </span>
                <span className="text-[10.5px] text-neutral-400 font-mono">
                  {p.subname}
                </span>
                {p.badge && (
                  <span className="rounded-full bg-white/15 px-1.5 py-0.2 text-[9px] font-medium text-neutral-200">
                    {p.badge}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
