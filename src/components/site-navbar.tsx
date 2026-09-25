"use client";

import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Marketing navbar (Phase 0 fix): sticky, transparent at the top of the
 * page; a hairline bottom border + blur backdrop fades in only after the
 * page is scrolled past the top. Uses the real vibefarsi Button for the
 * primary «شروع کنید» action.
 */
export function SiteNavbar() {
  const [scrolled, setScrolled] = React.useState(false);

  React.useEffect(() => {
    // Passive scroll listener: rAF-throttled so it runs at most once/frame.
    let ticking = false;
    const update = () => {
      setScrolled(window.scrollY > 8);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full transition-[background-color,border-color,backdrop-filter] duration-300",
        scrolled
          ? "border-b border-line bg-background/80 backdrop-blur-md"
          : "border-b border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between px-5 sm:px-8">
        <Link
          href="/"
          dir="ltr" className="text-[20px] font-extrabold tracking-[-0.04em] text-foreground"
          aria-label="Arka — صفحه‌ی اصلی"
        >
          Arka
        </Link>

        <nav className="flex items-center gap-1.5 sm:gap-2" aria-label="ناوبری اصلی">
          <Link
            href="/login"
            className="rounded-control px-3 py-2 text-[13px] text-foreground-2 transition-colors duration-200 hover:bg-soft hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ورود
          </Link>
          <Link href="/login" className="btn-blue inline-flex h-9 items-center rounded-control px-4 text-[13px] font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70">
شروع کنید
</Link>
        </nav>
      </div>
    </header>
  );
}
