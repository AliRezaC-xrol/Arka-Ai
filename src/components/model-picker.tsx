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

export function ModelPicker({ groups, value, onChange, className }: ModelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);
  const searchRef = React.useRef<HTMLInputElement>(null);

  /** The trigger is the first <button> under the root. */
  const focusTrigger = React.useCallback(() => {
    rootRef.current?.querySelector<HTMLButtonElement>("[data-trigger]")?.focus();
  }, []);

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
      el?.focus();
    });
  }, []);

  const close = React.useCallback(
    (returnFocus = false) => {
      setOpen(false);
      setQuery("");
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

  return (
    <div ref={rootRef} className={cn("relative inline-block text-start", className)}>
      <button
        type="button"
        data-trigger=""
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={`مدل انتخاب‌شده: ${current?.model ?? "انتخاب مدل"}`}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            focusSelected();
          }
        }}
        className={cn(
          "inline-flex h-9 items-center gap-2 rounded-control border border-line bg-card px-2.5 text-[13px] text-foreground transition-colors duration-200",
          "hover:border-white/30 hover:bg-soft focus-visible:border-white focus-visible:outline-none",
          open && "border-white/40 bg-soft",
        )}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {current?.isUserProvider ? (
            <Key className="size-3.5 text-amber-400" />
          ) : (
            <ProviderGlyph provider={current?.provider ?? "OpenAI"} />
          )}
          <span className="truncate font-medium">{current?.model ?? "انتخاب مدل"}</span>
          {current?.isUserProvider && (
            <span className="hidden rounded bg-amber-500/10 px-1.5 py-0.2 text-[10px] text-amber-300 sm:inline">
              شخصی
            </span>
          )}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("size-3.5 shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </button>

      {/* Popover — stays mounted so .picker-pop can animate BOTH ways.
          data-open drives the transition (see globals.css); inert keeps the
          closed list out of the tab order and unclickable. */}
      <ul
        ref={listRef}
        role="listbox"
        aria-label="انتخاب مدل"
        data-open={open ? "true" : "false"}
        aria-hidden={!open}
        inert={!open}
        onKeyDown={onListKeyDown}
        className="picker-pop absolute bottom-full start-0 z-50 mb-2 flex max-h-[19rem] w-[19rem] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-card border border-line bg-[#141414] shadow-2xl"
      >
        {/* Search */}
        <li role="presentation" className="border-b border-line/60 p-1.5">
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

        <div className="min-h-0 flex-1 overflow-auto p-1.5">
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
                    "flex items-center justify-between gap-2 px-3 pb-1.5 pt-2 text-[12px] font-semibold text-foreground-3",
                    groupIndex > 0 && "mt-1 border-t border-line/60 pt-3",
                  )}
                >
                  <div className="flex items-center gap-2">
                    {group.isUserProvider ? (
                      <Key className="size-3 text-amber-400" />
                    ) : (
                      <ProviderGlyph provider={group.provider} />
                    )}
                    <span dir="ltr">{group.provider}</span>
                  </div>
                  {group.isUserProvider && (
                    <span className="rounded border border-amber-500/20 bg-amber-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-amber-300">
                      پروایدر شخصی
                    </span>
                  )}
                  {group.isSiteProvider && (
                    <span className="rounded border border-emerald-500/20 bg-emerald-500/10 px-1.5 py-0.5 text-[9.5px] font-medium text-emerald-300">
                      پروایدر سایت
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
                          "flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-[13px] transition-colors duration-150",
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
