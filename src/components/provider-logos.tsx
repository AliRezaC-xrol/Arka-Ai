import * as React from "react";
import { cn } from "@/lib/utils";

export interface ProviderLogoItem {
  id: string;
  name: string;
  subname: string;
  badge?: string;
  icon: (props: { className?: string }) => React.JSX.Element;
}

export function OpenAILogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M22.2819 9.8211a5.9847 5.9847 0 0 0-.5157-4.9108 6.0462 6.0462 0 0 0-6.5098-2.9A6.0651 6.0651 0 0 0 4.9807 4.1818a5.9847 5.9847 0 0 0-3.9977 2.9 6.0462 6.0462 0 0 0 .7427 7.0966 5.98 5.98 0 0 0 .511 4.9107 6.051 6.051 0 0 0 6.5146 2.9001A5.9847 5.9847 0 0 0 13.2599 24a6.0557 6.0557 0 0 0 5.7718-4.2058 5.9894 5.9894 0 0 0 3.9977-2.9001 6.0557 6.0557 0 0 0-.7475-7.0729zm-9.022 12.6081a4.4755 4.4755 0 0 1-2.8764-1.0408l.1419-.0804 4.7783-2.7582a.7948.7948 0 0 0 .3927-.6813v-6.7369l2.02 1.1683a.071.071 0 0 1 .038.052v5.5826a4.504 4.504 0 0 1-4.4945 4.4947zm-9.66-4.5042a4.4708 4.4708 0 0 1-.5346-3.0137l.142.0852 4.783 2.7582a.7712.7712 0 0 0 .7806 0l5.8428-3.3685v2.3324a.0804.0804 0 0 1-.0332.0615L9.74 19.9502a4.4992 4.4992 0 0 1-6.1402-2.0252zm-1.0264-9.3524a4.4755 4.4755 0 0 1 2.3418-1.9729v.1656l.0047 5.5212a.7854.7854 0 0 0 .388.6766l5.8428 3.3685-2.02 1.1683a.0757.0757 0 0 1-.071 0l-4.8303-2.7865a4.504 4.504 0 0 1-1.656-6.1323zm16.597 3.855l-5.8333-3.3685L15.357 7.89a.0757.0757 0 0 1 .071 0l4.8303 2.7913a4.4944 4.4944 0 0 1-.6765 8.1042v-5.6772a.79.79 0 0 0-.388-.6766zm2.0107-3.0231l-.142-.0852-4.7735-2.7818a.7759.7759 0 0 0-.7854 0L9.409 7.8953V5.563a.0804.0804 0 0 1 .0332-.0615l4.8397-2.7913a4.4992 4.4992 0 0 1 6.6802 5.0345zm-12.641-4.2396a4.4755 4.4755 0 0 1 2.8717 1.0408l-.142.0804-4.7783 2.7582a.7948.7948 0 0 0-.3927.6813v6.7369L7.046 16.03a.071.071 0 0 1-.038-.052v-5.5826a4.504 4.504 0 0 1 4.4945-4.4947zm1.887 5.7008l2.915 1.6833v3.3685l-2.915-1.6833zm0 0" />
    </svg>
  );
}

export function ClaudeLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 2a1.5 1.5 0 0 1 1.493 1.356L13.5 3.5v5.086l3.596-3.596a1.5 1.5 0 0 1 2.228 2.008l-.107.113L15.62 10.7h5.086a1.5 1.5 0 0 1 1.493 1.356L22.2 12.2a1.5 1.5 0 0 1-1.356 1.493L20.7 13.7h-5.087l3.596 3.596a1.5 1.5 0 0 1-2.008 2.228l-.113-.107L13.5 15.82v5.086a1.5 1.5 0 0 1-1.356 1.493L12 22.4a1.5 1.5 0 0 1-1.493-1.356L10.5 20.9v-5.087l-3.596 3.596a1.5 1.5 0 0 1-2.228-2.008l.107-.113L8.38 13.7H3.293a1.5 1.5 0 0 1-1.493-1.356L1.8 12.2a1.5 1.5 0 0 1 1.356-1.493L3.3 10.7h5.087L4.79 7.104a1.5 1.5 0 0 1 2.008-2.228l.113.107L10.5 8.58V3.5A1.5 1.5 0 0 1 12 2z" />
    </svg>
  );
}

export function GeminiLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 0c-.3 6.3-5.7 11.7-12 12 6.3.3 11.7 5.7 12 12 .3-6.3 5.7-11.7 12-12-6.3-.3-11.7-5.7-12-12z" />
    </svg>
  );
}

export function DeepSeekLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M3 13.5C3 8 7.5 3.5 13 3.5c4.5 0 8 3 8 7 0 3.5-3 6.5-7 7.5l-4 1.5c-2 .8-4.5-.2-5.5-2-.8-1.5-1.5-2.5-1.5-4z" />
      <path d="M8 12c1.5-1 3.5-1 5 0" />
      <circle cx="9" cy="8.5" r="1" fill="currentColor" />
    </svg>
  );
}

export function FluxLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 3v18" />
      <path d="M3 12h18" />
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export function GrokLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function MetaLlamaLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 3c-4.97 0-9 4.03-9 9 0 2.12.74 4.07 1.97 5.61L4.35 20.3a1 1 0 0 0 1.35 1.35l2.69-.62C9.93 21.26 11.88 22 14 22c4.97 0 9-4.03 9-9s-4.03-9-9-9zm-2 13a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3zm6 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3z" />
    </svg>
  );
}

export function MistralLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M3 3h4.5v4.5H3V3zm13.5 0H21v4.5h-4.5V3zM3 9.75h4.5v4.5H3v-4.5zm13.5 0H21v4.5h-4.5v-4.5zM3 16.5h18V21H3v-4.5zm4.5-6.75h9v4.5h-9v-4.5z" />
    </svg>
  );
}

export const PROVIDERS_LIST: ProviderLogoItem[] = [
  { id: "openai", name: "OpenAI", subname: "GPT-4o", icon: OpenAILogo },
  { id: "claude", name: "Claude", subname: "Sonnet 3.7", icon: ClaudeLogo },
  { id: "gemini", name: "Gemini", subname: "Flash 2.5", icon: GeminiLogo },
  { id: "deepseek", name: "DeepSeek", subname: "R1 & V3", icon: DeepSeekLogo },
  { id: "flux", name: "FLUX.1", subname: "Image Studio", badge: "تصویر", icon: FluxLogo },
  { id: "grok", name: "Grok", subname: "xAI 2", icon: GrokLogo },
  { id: "llama", name: "Llama", subname: "Meta 3.3", icon: MetaLlamaLogo },
  { id: "mistral", name: "Mistral", subname: "Large 2", icon: MistralLogo },
];

export function ProviderLogosRow({ className }: { className?: string }) {
  return (
    <div className={cn("relative w-full overflow-hidden select-none py-4 border-y border-white/5 bg-[#08080a]", className)}>
      {/* Edge gradient masks for silky seamless fade */}
      <div className="pointer-events-none absolute inset-y-0 start-0 z-10 w-28 bg-gradient-to-r from-[#08080a] to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 end-0 z-10 w-28 bg-gradient-to-l from-[#08080a] to-transparent" />

      {/* Uninterrupted Continuous Marquee Loop — Endless and unbreakable */}
      <div
        dir="ltr"
        className="flex w-max will-change-transform animate-infinite-marquee"
        style={{
          animation: "marquee 32s linear infinite",
        }}
      >
        {/* We duplicate the full set multiple times so half is always >= viewport width */}
        {[0, 1].map((copyIndex) => (
          <div
            key={copyIndex}
            aria-hidden={copyIndex === 1}
            className="flex shrink-0 items-center gap-6 sm:gap-8 pe-6 sm:pe-8"
          >
            {PROVIDERS_LIST.concat(PROVIDERS_LIST).map((p, itemIdx) => {
              const Icon = p.icon;
              return (
                <div
                  key={`${copyIndex}-${p.id}-${itemIdx}`}
                  className="group flex items-center gap-2.5 rounded-full border border-white/10 bg-[#111114] px-4 py-2 transition-all duration-300 hover:border-white/30 hover:bg-white/[0.08]"
                >
                  <div className="grid size-6 place-items-center rounded-full bg-white/10 text-white transition-colors group-hover:bg-white group-hover:text-black">
                    <Icon className="size-3.5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-display text-[13.5px] font-bold text-white tracking-tight">
                      {p.name}
                    </span>
                    <span className="text-[11px] text-neutral-400 font-mono">
                      {p.subname}
                    </span>
                    {p.badge && (
                      <span className="rounded-full bg-white/15 px-2 py-0.2 text-[9.5px] font-medium text-neutral-200">
                        {p.badge}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
