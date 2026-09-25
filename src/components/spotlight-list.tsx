"use client";

/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";
import { Check, Edit2, Pin, PinOff, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SpotlightEntry {
  id: string;
  title: string;
  meta?: string;
  isPinned?: boolean;
}

export interface SpotlightGroup {
  label: string;
  items: SpotlightEntry[];
}

interface SpotlightListProps {
  groups: SpotlightGroup[];
  activeId: string | null;
  onSelect?: (id: string) => void;
  onPin?: (id: string, isPinned: boolean) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

interface SpotlightBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

export function SpotlightList({
  groups,
  activeId,
  onSelect,
  onPin,
  onRename,
  onDelete,
  className,
  ariaLabel = "فهرست گفتگوها",
}: SpotlightListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Record<string, HTMLElement | null>>({});
  const [box, setBox] = React.useState<SpotlightBox | null>(null);
  const [animate, setAnimate] = React.useState(false);

  // Inline rename state
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editTitle, setEditTitle] = React.useState("");

  const activeIdRef = React.useRef(activeId);
  activeIdRef.current = activeId;

  const measure = React.useCallback(
    (id: string | null, shouldAnimate: boolean) => {
      if (!id) {
        setBox(null);
        return;
      }
      const el = itemRefs.current[id];
      const container = containerRef.current;
      if (!el || !container) {
        setBox(null);
        return;
      }
      setAnimate(shouldAnimate);
      setBox({
        x: el.offsetLeft,
        y: el.offsetTop,
        w: el.offsetWidth,
        h: el.offsetHeight,
      });
    },
    [],
  );

  // Animate on activeId change
  React.useEffect(() => {
    measure(activeId, true);
  }, [activeId, measure]);

  // Non-animating re-measure on layout/content changes
  React.useEffect(() => {
    measure(activeIdRef.current, false);
  }, [groups, measure]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let rafId: number | null = null;
    const observer = new ResizeObserver(() => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        measure(activeIdRef.current, false);
      });
    });

    observer.observe(container);

    const onResize = () => measure(activeIdRef.current, false);
    window.addEventListener("resize", onResize);
    document.fonts?.ready?.then(() => measure(activeIdRef.current, false));

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      observer.disconnect();
      window.removeEventListener("resize", onResize);
    };
  }, [measure]);

  const allItems = React.useMemo(
    () => groups.flatMap((group) => group.items),
    [groups],
  );

  const handleKeyDown = (event: React.KeyboardEvent, currentIndex: number) => {
    let nextIndex: number | null = null;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      nextIndex = (currentIndex + 1) % allItems.length;
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      nextIndex = (currentIndex - 1 + allItems.length) % allItems.length;
    } else if (event.key === "Home") {
      event.preventDefault();
      nextIndex = 0;
    } else if (event.key === "End") {
      event.preventDefault();
      nextIndex = allItems.length - 1;
    }

    if (nextIndex !== null) {
      const nextItem = allItems[nextIndex];
      if (nextItem) {
        onSelect?.(nextItem.id);
        itemRefs.current[nextItem.id]?.focus();
      }
    }
  };

  const startRename = (id: string, currentTitle: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditTitle(currentTitle);
  };

  const submitRename = (id: string) => {
    if (editTitle.trim()) {
      onRename?.(id, editTitle.trim());
    }
    setEditingId(null);
  };

  let flatIndex = -1;

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label={ariaLabel}
      aria-orientation="vertical"
      className={cn("relative", className)}
    >
      {box && (
        <div
          aria-hidden
          data-spotlight=""
          className="spotlight pointer-events-none absolute left-0 top-0 z-0 rounded-control border border-white/20 bg-white/[0.06]"
          style={{
            width: box.w,
            height: box.h,
            transform: `translate(${box.x}px, ${box.y}px)`,
            transition: animate
              ? "transform 350ms cubic-bezier(0.65,0,0.35,1), width 350ms cubic-bezier(0.65,0,0.35,1), height 350ms cubic-bezier(0.65,0,0.35,1)"
              : "none",
          }}
        />
      )}
      {groups.map((group, groupIndex) => {
        if (group.items.length === 0) return null;
        return (
          <React.Fragment key={group.label}>
            <p
              role="presentation"
              className={cn(
                "px-3 pb-1.5 text-[11px] font-medium text-foreground-3",
                groupIndex === 0 ? "pt-1" : "pt-4",
              )}
            >
              {group.label}
            </p>
            {group.items.map((item) => {
              flatIndex += 1;
              const index = flatIndex;
              const active = item.id === activeId;
              const isEditing = editingId === item.id;

              return (
                <div
                  key={item.id}
                  ref={(el) => {
                    itemRefs.current[item.id] = el;
                  }}
                  role="option"
                  aria-selected={active}
                  tabIndex={active || (!activeId && index === 0) ? 0 : -1}
                  onClick={() => !isEditing && onSelect?.(item.id)}
                  onKeyDown={(event) => !isEditing && handleKeyDown(event, index)}
                  className={cn(
                    "group relative z-[1] mb-1 flex w-full cursor-pointer items-center justify-between rounded-control px-3 py-2 text-start transition-colors duration-200 hover:bg-soft focus-visible:outline-none",
                    active ? "text-foreground" : "text-foreground-2",
                  )}
                >
                  {isEditing ? (
                    <div
                      className="flex w-full items-center gap-1.5"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") submitRename(item.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        autoFocus
                        className="h-7 w-full rounded border border-line bg-background px-2 text-xs text-foreground focus:border-white focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => submitRename(item.id)}
                        className="rounded p-1 text-emerald-400 hover:bg-white/10"
                        title="ذخیره"
                      >
                        <Check className="size-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="rounded p-1 text-foreground-3 hover:bg-white/10"
                        title="انصراف"
                      >
                        <X className="size-3.5" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <div className="flex min-w-0 flex-1 items-center gap-2">
                        {item.isPinned && (
                          <Pin className="size-3 shrink-0 text-white fill-white/80" />
                        )}
                        <span className="truncate text-[13px] font-medium">
                          {item.title}
                        </span>
                      </div>

                      {/* Hover action buttons (pin, rename, delete) */}
                      <div className="ms-2 hidden shrink-0 items-center gap-1 group-hover:flex">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onPin?.(item.id, !item.isPinned);
                          }}
                          className="rounded p-1 text-foreground-3 transition-colors hover:bg-white/10 hover:text-foreground"
                          title={item.isPinned ? "برداشتن پین" : "سنجاق کردن"}
                        >
                          {item.isPinned ? (
                            <PinOff className="size-3.5" />
                          ) : (
                            <Pin className="size-3.5" />
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={(e) => startRename(item.id, item.title, e)}
                          className="rounded p-1 text-foreground-3 transition-colors hover:bg-white/10 hover:text-foreground"
                          title="تغییر نام"
                        >
                          <Edit2 className="size-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm("آیا از حذف این گفتگو اطمینان دارید؟")) {
                              onDelete?.(item.id);
                            }
                          }}
                          className="rounded p-1 text-foreground-3 transition-colors hover:bg-red-500/20 hover:text-red-400"
                          title="حذف گفتگو"
                        >
                          <Trash2 className="size-3.5" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        );
      })}
    </div>
  );
}
