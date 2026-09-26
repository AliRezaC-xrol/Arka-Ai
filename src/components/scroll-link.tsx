"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 *
 * A secondary hero CTA that scrolls to a section on the same page. It lives in
 * its own client component because the landing page itself is a Server
 * Component, and Server Components cannot receive event handlers.
 */

import { cn } from "@/lib/utils";

const HEADER_OFFSET = 72;

export function ScrollLink({
  target,
  children,
  className,
}: {
  target: string;
  children: React.ReactNode;
  className?: string;
}) {
  const handleClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
    const el = document.getElementById(target);
    if (!el) return;
    event.preventDefault();

    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({
      top: Math.max(0, el.getBoundingClientRect().top + window.scrollY - HEADER_OFFSET),
      behavior: reduceMotion ? "auto" : "smooth",
    });
    window.history.replaceState(null, "", `#${target}`);
  };

  return (
    <a href={`#${target}`} onClick={handleClick} className={cn(className)}>
      {children}
    </a>
  );
}
