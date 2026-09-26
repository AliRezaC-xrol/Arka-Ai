"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import Link from "next/link";
import { ChevronsUpDown, KeyRound, LogOut, Settings } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * User menu: avatar + name, opens a real dropdown (role=menu).
 *
 * `placement` matters: in the top header the menu must open DOWNWARD
 * (opening up would push it off-screen above the viewport), while in a
 * bottom sidebar block it opens upward. The popover is also clamped to
 * the viewport so it can never be cut off horizontally in RTL.
 */
export function UserMenu({
  name,
  subtitle,
  avatarUrl,
  placement = "up",
  compact = false,
}: {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
  placement?: "up" | "down";
  /** Collapse the trigger to just the avatar (used in the mobile chat header). */
  compact?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const [pos, setPos] = React.useState<{ top: number; left: number; width: number } | null>(null);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const focusTrigger = React.useCallback(() => {
    triggerRef.current?.focus();
  }, []);

  const focusFirstItem = React.useCallback(() => {
    requestAnimationFrame(() => {
      menuRef.current?.querySelector<HTMLButtonElement>("[role='menuitem']")?.focus();
    });
  }, []);

  const close = React.useCallback(
    (returnFocus = false) => {
      setOpen(false);
      if (returnFocus) requestAnimationFrame(() => focusTrigger());
    },
    [focusTrigger],
  );

  /** Keep the panel fully inside the viewport, whichever way it opens. */
  React.useLayoutEffect(() => {
    if (!open) return;

    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const width = Math.max(r.width, 224);
      let left = r.right - width; // align to the trigger's inline-end edge
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      const top = placement === "down" ? r.bottom + 8 : Math.max(12, r.top - 8);
      setPos({ top, left, width });
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
    };
  }, [open, placement]);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        // The panel is portalled out of the root when fixed, so check it too.
        if (menuRef.current?.contains(event.target as Node)) return;
        close();
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
      if (event.key === "Tab") close();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const items = Array.from(menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ?? []);
    if (items.length === 0) return;

    const index = items.findIndex((item) => item === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      items[(index + 1) % items.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      items[(index - 1 + items.length) % items.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      items[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      items[items.length - 1]?.focus();
    }
  };

  const initial = (name || subtitle || "U").trim().charAt(0).toUpperCase();

  const handleLogout = async () => {
    close();
    window.location.href = "/api/auth/logout";
  };

  const panelClass = cn(
    "fixed z-[60] rounded-card border border-line bg-popover p-1.5 shadow-xl",
    "origin-top transition-all duration-150",
    open ? "pointer-events-auto opacity-100 scale-100" : "pointer-events-none opacity-0 scale-95",
  );

  return (
    <div ref={rootRef} className="relative">
      {open && pos && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="منوی کاربر"
          onKeyDown={onMenuKeyDown}
          style={{ top: pos.top, left: pos.left, width: pos.width }}
          className={panelClass}
        >
          <div className="border-b border-line px-3 py-2">
            <p className="truncate text-[12.5px] font-semibold text-foreground">{name}</p>
            <p className="truncate text-[11px] text-foreground-3">{subtitle}</p>
          </div>

          <Link
            href="/settings/providers"
            role="menuitem"
            onClick={() => close()}
            className="mt-1 flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[13px] text-foreground-2 transition-colors duration-150 hover:bg-soft focus-visible:bg-soft focus-visible:text-foreground focus-visible:outline-none"
          >
            <KeyRound aria-hidden className="size-4 shrink-0" />
            <span>کلیدهای API من</span>
          </Link>

          <Link
            href="/settings"
            role="menuitem"
            onClick={() => close()}
            className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[13px] text-foreground-2 transition-colors duration-150 hover:bg-soft focus-visible:bg-soft focus-visible:text-foreground focus-visible:outline-none"
          >
            <Settings aria-hidden className="size-4 shrink-0" />
            <span>تنظیمات حساب</span>
          </Link>

          <div role="separator" className="my-1 h-px bg-line" />

          <button
            type="button"
            role="menuitem"
            onClick={handleLogout}
            className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[13px] text-red-400 transition-colors duration-150 hover:bg-red-500/10 focus-visible:bg-red-500/10 focus-visible:text-red-300 focus-visible:outline-none"
          >
            <LogOut aria-hidden className="size-4 shrink-0" />
            <span>خروج از حساب</span>
          </button>
        </div>
      )}

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            focusFirstItem();
          }
        }}
        className={cn(
          "flex w-full items-center rounded-control border border-transparent text-start transition-colors duration-200 hover:bg-soft focus-visible:border-line focus-visible:outline-none",
          compact ? "justify-center p-1" : "gap-3 p-2",
        )}
      >
        <span
          aria-hidden
          className="relative grid size-9 shrink-0 place-items-center overflow-hidden rounded-full border border-line bg-elevated text-xs font-semibold text-foreground-2"
        >
          {avatarUrl && !imgError ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={avatarUrl}
              alt={name}
              className="size-full object-cover"
              onError={() => setImgError(true)}
            />
          ) : (
            initial
          )}
        </span>
        {!compact && (
          <>
            <span className="min-w-0 flex-1 leading-5">
              <span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
              <span className="block truncate text-[11px] text-foreground-3">{subtitle}</span>
            </span>
            <ChevronsUpDown aria-hidden className="size-4 shrink-0 text-foreground-3" />
          </>
        )}
      </button>
    </div>
  );
}
