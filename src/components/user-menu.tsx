"use client";

import * as React from "react";
import { ChevronsUpDown, LogOut, Settings } from "lucide-react";

/**
 * Sidebar user menu (bottom block): avatar circle + name, opens a real
 * dropdown (role=menu) with settings / logout.
 */
export function UserMenu({
  name,
  subtitle,
  avatarUrl,
}: {
  name: string;
  subtitle: string;
  avatarUrl?: string | null;
}) {
  const [open, setOpen] = React.useState(false);
  const [imgError, setImgError] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  /** The trigger is the first <button> under the root. */
  const focusTrigger = React.useCallback(() => {
    rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);

  const focusFirstItem = React.useCallback(() => {
    requestAnimationFrame(() => {
      menuRef.current
        ?.querySelector<HTMLButtonElement>("[role='menuitem']")
        ?.focus();
    });
  }, []);

  const close = React.useCallback(
    (returnFocus = false) => {
      setOpen(false);
      if (returnFocus) requestAnimationFrame(() => focusTrigger());
    },
    [focusTrigger],
  );

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
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
    const items = Array.from(
      menuRef.current?.querySelectorAll<HTMLButtonElement>("[role='menuitem']") ??
        [],
    );
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

  return (
    <div ref={rootRef} className="relative">
      {open && (
        <div
          ref={menuRef}
          role="menu"
          aria-label="منوی کاربر"
          onKeyDown={onMenuKeyDown}
          className="absolute bottom-full start-0 z-50 mb-2 w-full rounded-card border border-line bg-popover p-1.5 shadow-xl"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => close()}
            className="flex w-full items-center gap-2.5 rounded-control px-3 py-2 text-[13px] text-foreground-2 transition-colors duration-150 hover:bg-soft focus-visible:bg-soft focus-visible:text-foreground focus-visible:outline-none"
          >
            <Settings aria-hidden className="size-4 shrink-0" />
            <span>تنظیمات</span>
            <span className="ms-auto text-[10px] text-foreground-3">به‌زودی</span>
          </button>
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
        className="flex w-full items-center gap-3 rounded-control border border-transparent p-2 text-start transition-colors duration-200 hover:bg-soft focus-visible:border-line focus-visible:outline-none"
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
        <span className="min-w-0 flex-1 leading-5">
          <span className="block truncate text-[13px] font-medium text-foreground">{name}</span>
          <span className="block truncate text-[11px] text-foreground-3">
            {subtitle}
          </span>
        </span>
        <ChevronsUpDown
          aria-hidden
          className="size-4 shrink-0 text-foreground-3"
        />
      </button>
    </div>
  );
}
