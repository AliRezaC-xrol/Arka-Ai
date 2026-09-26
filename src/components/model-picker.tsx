"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import { Check, ChevronDown, Key, Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export interface ModelGroup {
  provider: string;
  models: string[];
  isUserProvider?: boolean;
  isSiteProvider?: boolean;
  providerId?: string;
}

interface ModelPickerProps {
  groups: ModelGroup[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/** Gap between the trigger and the panel, and the minimum viewport margin. */
const GAP = 8;
const MARGIN = 8;
/** The panel should never grow past this share of the viewport height. */
const MAX_VH = 0.5;

/**
 * The model selector.
 *
 * Positioned from measurement rather than by CSS alone. The previous version
 * was a CSS-only `bottom-full` popover pinned to `w-[19rem] max-h-[19rem]`,
 * which meant that on the empty-state hero composer it floated a full 19rem
 * above the trigger, overlapped the suggestion chips and ran off the top of
 * short viewports. It now:
 *
 *   - measures the room above and below the trigger and opens whichever way
 *     has more space, with a hard clamp to the viewport;
 *   - sizes its height to `min(18rem, 50dvh)` so a phone in landscape still
 *     gets a usable panel instead of one taller than the screen;
 *   - lets the list scroll inside a fixed-height shell so the panel never
 *     resizes while you type in the search box.
 */
export function ModelPicker({ groups, value, onChange, className }: ModelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const [pos, setPos] = React.useState<{
    top: number;
    bottom: number;
    width: number;
    left: number;
    maxHeight: number;
    flip: "up" | "down";
  } | null>(null);

  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  /** Flat list of every selectable option, regardless of the current filter. */
  const options = React.useMemo(
    () =>
      groups.flatMap((group) =>
        group.models.map((model) => ({
          id: `${group.provider}:${model}`,
          provider: group.provider,
          model,
          isUserProvider: group.isUserProvider,
          isSiteProvider: group.isSiteProvider,
          providerId: group.providerId,
        })),
      ),
    [groups],
  );

  /** Search across both the model id and the provider name. */
  const filteredGroups = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return groups;
    return groups
      .map((group) => ({
        ...group,
        models: group.models.filter(
          (m) => m.toLowerCase().includes(q) || group.provider.toLowerCase().includes(q),
        ),
      }))
      .filter((group) => group.models.length > 0);
  }, [groups, query]);

  const matchCount = filteredGroups.reduce((n, g) => n + g.models.length, 0);

  const current = options.find((option) => option.id === value) ?? options[0];

  const focusSelected = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el =
        listRef.current?.querySelector<HTMLButtonElement>("[aria-selected='true']") ??
        listRef.current?.querySelector<HTMLButtonElement>("button");
      /* `block: "nearest"` keeps the panel's own scroll from yanking the
         whole page when a selected model sits far down a long list. */
      el?.scrollIntoView({ block: "nearest" });
    });
  }, []);

  const close = React.useCallback((returnFocus = false) => {
    setOpen(false);
    setQuery("");
    if (returnFocus) {
      requestAnimationFrame(() =>
        rootRef.current?.querySelector<HTMLButtonElement>("[data-trigger]")?.focus(),
      );
    }
  }, []);

  /**
   * Keep the panel inside the viewport. Recomputed on anything that can move
   * the trigger: scroll (capture, so nested scroll containers count), resize,
   * and the panel's own open/close.
   */
  React.useLayoutEffect(() => {
    if (!open) return;

    const compute = () => {
      const el = triggerRef.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      /* Wide enough for real model ids like
         "anthropic/claude-sonnet-4-20250514", but never wider than the
         screen allows. */
      const width = Math.min(Math.max(r.width, 280), vw - MARGIN * 2);

      /* RTL-safe: the panel's inline-start edge lines up with the trigger's,
         then gets clamped so it cannot poke out of either side. */
      let left = r.left;
      left = Math.max(MARGIN, Math.min(left, vw - width - MARGIN));

      const roomAbove = r.top - GAP - MARGIN;
      const roomBelow = vh - r.bottom - GAP - MARGIN;
      const cap = Math.max(160, Math.min(288, vh * MAX_VH));

      /* Prefer upward when there is genuinely more room there; otherwise
         drop below the trigger. A viewport with no good option gets the
         larger of the two, clamped. */
      const flip: "up" | "down" = roomAbove >= roomBelow ? "up" : "down";

      if (flip === "up") {
        const maxHeight = Math.min(cap, Math.max(140, roomAbove));
        setPos({
          top: 0,
          bottom: vh - r.top + GAP,
          width,
          left,
          maxHeight,
          flip,
        });
      } else {
        const maxHeight = Math.min(cap, Math.max(140, roomBelow));
        setPos({
          top: r.bottom + GAP,
          bottom: 0,
          width,
          left,
          maxHeight,
          flip,
        });
      }
    };

    compute();
    window.addEventListener("resize", compute);
    window.addEventListener("scroll", compute, true);
    window.visualViewport?.addEventListener("resize", compute);
    window.visualViewport?.addEventListener("scroll", compute);
    return () => {
      window.removeEventListener("resize", compute);
      window.removeEventListener("scroll", compute, true);
      window.visualViewport?.removeEventListener("resize", compute);
      window.visualViewport?.removeEventListener("scroll", compute);
    };
  }, [open]);

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      /* The panel is fixed-positioned, so it is not inside the trigger's
         subtree in the layout sense — check it explicitly. */
      if (listRef.current?.contains(target)) return;
      close();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") close(true);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open, close]);

  React.useEffect(() => {
    if (open) focusSelected();
  }, [open, focusSelected]);

  const onListKeyDown = (event: React.KeyboardEvent) => {
    // While typing in the search box the arrow keys belong to the text caret.
    if (event.target === searchRef.current) return;

    const buttons = Array.from(listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? []);
    if (buttons.length === 0) return;

    const index = buttons.findIndex((button) => button === document.activeElement);

    if (event.key === "ArrowDown") {
      event.preventDefault();
      buttons[(index + 1) % buttons.length]?.focus();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      buttons[(index - 1 + buttons.length) % buttons.length]?.focus();
    } else if (event.key === "Home") {
      event.preventDefault();
      buttons[0]?.focus();
    } else if (event.key === "End") {
      event.preventDefault();
      buttons[buttons.length - 1]?.focus();
    } else if (event.key === "Tab") {
      close();
    }
  };

  /** Enter inside the search box selects the first visible match. */
  const onSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      const first = filteredGroups[0]?.models[0];
      if (first) {
        event.preventDefault();
        onChange(`${filteredGroups[0].provider}:${first}`);
        close(true);
      }
    }
  };

  const panelStyle: React.CSSProperties | undefined = pos
    ? {
        top: pos.flip === "up" ? undefined : pos.top,
        bottom: pos.flip === "up" ? pos.bottom : undefined,
        left: pos.left,
        width: pos.width,
        maxHeight: pos.maxHeight,
      }
    : undefined;

  return (
    <div ref={rootRef} className={cn("relative inline-block text-start", className)}>
      <button
        ref={triggerRef}
        type="button"
        data-trigger=""
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`مدل انتخاب‌شده: ${current?.model ?? "انتخاب مدل"}`}
        onClick={() => {
          if (open) close();
          else setOpen(true);
        }}
        /* The trigger itself stays compact: `max-w` + `truncate` keep a long
           model id from stretching the composer's control row on a phone. */
        className={cn(
          "inline-flex h-8 max-w-[11rem] items-center gap-1.5 rounded-control border border-line bg-card px-2 text-[12.5px] text-foreground transition-colors duration-150 sm:max-w-[15rem]",
          "hover:border-white/30 hover:bg-soft focus-visible:border-white focus-visible:outline-none",
          open && "border-white/40 bg-soft",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {current?.isUserProvider ? (
            <Key className="size-3.5 shrink-0 text-amber-400" />
          ) : (
            <ProviderGlyph provider={current?.provider ?? "OpenAI"} />
          )}
          <span dir="ltr" className="truncate font-medium">
            {current?.model ?? "انتخاب مدل"}
          </span>
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 shrink-0 transition-transform duration-150", open && "rotate-180")}
        />
      </button>

      {/* Popover — fixed-positioned from JS so it is never clipped by the
          composer's overflow, and stays mounted so the enter/exit transition
          can run both ways. `inert` keeps the closed list out of the tab
          order and unclickable. */}
      <ul
        ref={listRef}
        role="listbox"
        aria-label="انتخاب مدل"
        data-open={open ? "true" : "false"}
        data-flip={pos?.flip === "down" ? "down" : "up"}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onListKeyDown}
        style={panelStyle}
        className="picker-pop fixed z-[70] flex flex-col overflow-hidden rounded-card border border-line bg-[#141416] shadow-2xl ring-1 ring-black/60"
      >
        {/* Search */}
        <li role="presentation" className="shrink-0 border-b border-line/60 p-1.5">
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute start-2.5 top-1/2 size-3.5 -translate-y-1/2 text-foreground-3"
            />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={onSearchKeyDown}
              placeholder="جستجوی مدل یا پروایدر…"
              className="h-8 w-full rounded-control border border-line bg-black/40 ps-8 pe-7 text-[12.5px] text-foreground placeholder:text-foreground-3 outline-none focus:border-white/30"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="absolute end-1.5 top-1/2 grid size-5 -translate-y-1/2 place-items-center rounded text-foreground-3 hover:text-white"
                aria-label="پاک‌کردن جستجو"
              >
                <X className="size-3" />
              </button>
            )}
          </div>
        </li>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-1.5">
          {matchCount === 0 ? (
            <p className="px-3 py-6 text-center text-[12px] text-foreground-3">
              مدلی با «{query}» پیدا نشد.
            </p>
          ) : (
            filteredGroups.map((group, groupIndex) => (
              <React.Fragment key={group.provider}>
                <li
                  role="presentation"
                  className={cn(
                    "sticky top-0 z-10 -mx-1.5 mb-0.5 flex items-center justify-between gap-2 bg-[#141416]/95 px-3 pb-1 pt-1.5 text-[11px] font-semibold text-foreground-3 backdrop-blur-sm",
                    groupIndex > 0 && "mt-1 border-t border-line/60",
                  )}
                >
                  <div className="flex min-w-0 items-center gap-1.5">
                    {group.isUserProvider ? (
                      <Key className="size-3 shrink-0 text-amber-400" />
                    ) : (
                      <ProviderGlyph provider={group.provider} />
                    )}
                    <span dir="ltr" className="truncate">
                      {group.provider}
                    </span>
                  </div>
                  {group.isUserProvider && (
                    <span className="shrink-0 rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9px] font-medium text-amber-300">
                      شخصی
                    </span>
                  )}
                  {group.isSiteProvider && (
                    <span className="shrink-0 rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-medium text-emerald-300">
                      سایت
                    </span>
                  )}
                </li>
                {group.models.map((model) => {
                  const id = `${group.provider}:${model}`;
                  const selected = id === current?.id;
                  return (
                    <li key={id} role="presentation">
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        onClick={() => {
                          onChange(id);
                          close(true);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-control px-2.5 py-1.5 text-[12.5px] transition-colors duration-100",
                          "hover:bg-soft focus-visible:bg-soft focus-visible:outline-none",
                          selected ? "bg-white/10 font-semibold text-white" : "text-foreground-2",
                        )}
                      >
                        <span dir="ltr" className="truncate">
                          {model}
                        </span>
                        {selected && <Check aria-hidden className="size-3.5 shrink-0 text-white" />}
                      </button>
                    </li>
                  );
                })}
              </React.Fragment>
            ))
          )}
        </div>

        <li
          role="presentation"
          className="shrink-0 border-t border-line/60 px-3 py-1.5 text-[10.5px] text-foreground-3"
        >
          {matchCount.toLocaleString("fa-IR")} مدل
        </li>
      </ul>
    </div>
  );
}

/** Tiny monochrome provider mark (initial in a hairline square). */
function ProviderGlyph({ provider }: { provider: string }) {
  const initial = provider.trim().charAt(0).toUpperCase();
  return (
    <span
      aria-hidden
      className="grid size-4 shrink-0 place-items-center rounded-sm border border-line bg-elevated font-mono text-[9px] font-semibold text-foreground-2"
    >
      {initial}
    </span>
  );
}
