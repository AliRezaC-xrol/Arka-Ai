"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

interface Step {
  title: string;
  text: string;
}

/**
 * "How it works" — horizontal steps driven by scroll on EVERY breakpoint
 * (phone, tablet, laptop, desktop). The section is taller than the
 * viewport; its content sticks while the user scrolls, and the progress
 * line fills right-to-left (RTL) step by step. Each step lights up once
 * the line reaches it. Type scales down below sm so three columns stay
 * readable at 360px. Reduced motion: all steps shown complete, no sticky
 * scroll-jacking.
 */
export function StepsScroll({ steps }: { steps: Step[] }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [progress, setProgress] = React.useState(0);
  const [reduced, setReduced] = React.useState(false);

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    if (mq.matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const total = rect.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -rect.top / total)) : 1;
      setProgress(p);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const p = reduced ? 1 : progress;
  const n = steps.length;
  // Line spans between the first and last circle centres.
  const lineFill = Math.min(1, p * 1.08);
  const activeCount = Math.min(n, Math.floor(lineFill * (n - 1) + 1e-6) + 1);

  return (
    <div ref={ref} className={cn("relative", !reduced && "h-[190vh] md:h-[220vh]")}>
      <div className={cn(!reduced && "sticky top-0 flex h-dvh items-center")}>
        <div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-8 sm:py-20">
          <p className="text-[13.5px] font-semibold text-foreground-3">چطور کار می‌کند</p>
          <h2 id="steps-title" className="mt-3 text-[1.9rem] font-extrabold leading-[1.3] sm:text-[3rem]">
            در یک دقیقه شروع کن.
          </h2>

          {/* Horizontal at every size: circles sit on one rail, the white
              line fills between the first/last circle centres as the user
              scrolls (RTL: right → left). */}
          <ol
            className="relative mt-10 grid sm:mt-14 md:mt-16 [grid-template-columns:repeat(var(--steps-n),minmax(0,1fr))]"
            style={{ ["--steps-n" as string]: String(n) }}
          >
            {/* rail: horizontal, between the first/last circle centres */}
            <div
              aria-hidden
              className="absolute top-5 h-px bg-white/10"
              style={{ insetInlineStart: `calc(100% / ${n * 2})`, insetInlineEnd: `calc(100% / ${n * 2})` }}
            >
              <div
                className="absolute inset-y-0 start-0 bg-white transition-[width] duration-150 ease-out"
                style={{ width: `${lineFill * 100}%` }}
              />
            </div>

            {steps.map((step, i) => {
              const done = i < activeCount;
              return (
                <li key={step.title} className="relative flex flex-col items-center px-1 sm:px-2 lg:px-4">
                  <span
                    className={cn(
                      "relative grid size-10 shrink-0 place-items-center rounded-full border text-[15px] font-bold transition-[background-color,color,border-color,transform] duration-300",
                      done ? "scale-110 border-white bg-white text-black" : "border-white/25 bg-background text-foreground-3",
                    )}
                  >
                    {(i + 1).toLocaleString("fa-IR")}
                  </span>
                  <div className="mt-5 text-center md:mt-6">
                    <h3
                      className={cn(
                        "text-[13.5px] font-bold transition-colors duration-300 sm:text-[19px]",
                        done ? "text-foreground" : "text-foreground-3",
                      )}
                    >
                      {step.title}
                    </h3>
                    <p
                      className={cn(
                        "mt-2 text-[11.5px] leading-5 transition-[opacity,transform] duration-500 sm:text-[15px] sm:leading-7",
                        done ? "translate-y-0 text-foreground-2 opacity-100" : "translate-y-2 text-foreground-3 opacity-40",
                      )}
                    >
                      {step.text}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          <span className="sr-only" aria-live="polite">
            {`مرحله‌ی ${activeCount.toLocaleString("fa-IR")} از ${n.toLocaleString("fa-IR")}`}
          </span>
        </div>
      </div>
    </div>
  );
}
