/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import Link from "next/link";

/** apmix-style navbar: logo at start, links centred, actions at end. */
export function SiteNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-line bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
        <Link href="/" aria-label="Arka — صفحه‌ی اصلی" className="flex items-center gap-2 rounded-sm">
          <ArkaMark className="size-7" />
          <span dir="ltr" className="font-display text-[19px] font-bold tracking-[-0.02em]">ARKA</span>
        </Link>

        <nav aria-label="ناوبری اصلی" className="hidden items-center gap-8 text-[14.5px] text-foreground-2 md:flex">
          <a href="#features" className="rounded-sm hover:text-foreground">قابلیت‌ها</a>
          <a href="#models" className="rounded-sm hover:text-foreground">مدل‌ها</a>
          <a href="#how" className="rounded-sm hover:text-foreground">چطور کار می‌کند</a>
          <a href="#faq" className="rounded-sm hover:text-foreground">سوالات</a>
        </nav>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link href="/login" className="rounded-control px-3 py-2 text-[14.5px] text-foreground hover:bg-soft">ورود</Link>
          <Link href="/login" className="btn-ink inline-flex h-10 items-center rounded-control px-4 text-[14.5px] font-semibold sm:px-5">
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
