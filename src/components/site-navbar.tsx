"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import Link from "next/link";
import * as React from "react";

import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#features", label: "قابلیت‌ها" },
  { href: "#models", label: "مدل‌ها" },
  { href: "#how", label: "چطور کار می‌کند" },
  { href: "#faq", label: "سوالات" },
];

/** Height of the sticky header, used to offset scroll targets. */
const HEADER_OFFSET = 72;

function smoothScrollTo(id: string) {
  const el = document.getElementById(id);
  if (!el) return;

  const reduceMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  const top = el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET;

  window.scrollTo({
    top: Math.max(0, top),
    behavior: reduceMotion ? "auto" : "smooth",
  });
}

/** apmix-style navbar: logo at start, links centred, actions at end. */
export function SiteNavbar() {
  const [scrolled, setScrolled] = React.useState(false);
  const [active, setActive] = React.useState<string>("");

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Highlight the section currently under the header.
  React.useEffect(() => {
    const ids = NAV_LINKS.map((l) => l.href.slice(1)).filter((id) => document.getElementById(id));
    if (ids.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(`#${visible.target.id}`);
      },
      { rootMargin: `-${HEADER_OFFSET + 8}px 0px -55% 0px`, threshold: 0 },
    );

    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = (event: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    smoothScrollTo(href.slice(1));
    setActive(href);
    // Keep the URL shareable without triggering a jump.
    window.history.replaceState(null, "", href);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Arka — صفحه‌ی اصلی" className="flex items-center gap-2 rounded-sm">
          <ArkaMark className="size-7" />
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em]">
            ARKA
          </span>
        </Link>

        <nav
          aria-label="ناوبری اصلی"
          className="hidden items-center gap-1 text-[14.5px] text-foreground-2 md:flex"
        >
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={(e) => handleNavClick(e, link.href)}
              className={cn(
                "relative rounded-full px-3.5 py-1.5 transition-colors duration-200",
                active === link.href ? "text-foreground" : "hover:text-foreground",
              )}
            >
              {link.label}
              <span
                aria-hidden
                className={cn(
                  "absolute inset-x-3 -bottom-0.5 h-[2px] rounded-full bg-foreground transition-all duration-300",
                  active === link.href ? "scale-x-100 opacity-100" : "scale-x-0 opacity-0",
                )}
              />
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/login"
            className="rounded-control px-3 py-2 text-[14.5px] text-foreground transition-colors hover:bg-soft"
          >
            ورود
          </Link>
          <Link
            href="/login"
            className={cn(
              "btn-ink inline-flex h-10 items-center rounded-control px-4 text-[14.5px] font-semibold transition-transform duration-200 sm:px-5",
              scrolled && "scale-[0.98]",
            )}
          >
            شروع کنید
          </Link>
        </div>
      </div>
    </header>
  );
}

export function ArkaMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={className}>
      <path d="M16 3 29 28h-6.2L16 14.6 9.2 28H3L16 3Z" fill="currentColor" />
      <path d="M11.5 22.5h9l2 4h-13l2-4Z" fill="currentColor" opacity="0.35" />
    </svg>
  );
}
