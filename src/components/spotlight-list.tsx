"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

export interface SpotlightEntry {
  id: string;
  title: string;
  meta?: string;
}

interface SpotlightListProps {
  items: SpotlightEntry[];
  activeId: string;
  onSelect?: (id: string) => void;
  className?: string;
  ariaLabel?: string;
}

interface SpotlightBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Spotlight selection box (SPEC §5): a soft, low-contrast background+border
 * box that sits behind the active item and glides to the clicked item.
 *
 * Implementation notes:
 * - The destination item's offsetTop/offsetLeft/width/height are measured at
 *   selection time, then the box moves via `transform: translate(...)` with
 *   easing `cubic-bezier(0.65,0,0.35,1)` over ~350ms (never a jump).
 * - Works in RTL: offsetLeft/offsetTop are *physical* coordinates relative to
 *   the offsetParent, and translate() is physical too — so no logical/physical
 *   mismatch is possible regardless of direction.
 * - Honors prefers-reduced-motion via the global CSS media query on .spotlight.
 */
export function SpotlightList({
  items,
  activeId,
  onSelect,
  className,
  ariaLabel,
}: SpotlightListProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<Record<string, HTMLButtonElement | null>>({});
  const [box, setBox] = React.useState<SpotlightBox | null>(null);
  // Disable the transition until the first measurement has been applied,
  // so the box doesn't animate from (0,0) on mount.
  const [ready, setReady] = React.useState(false);

  const measure = React.useCallback(() => {
    const el = itemRefs.current[activeId];
    if (!el) {
      setBox(null);
      return;
    }
    setBox({
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
    });
  }, [activeId]);

  React.useEffect(() => {
    measure();
    const raf = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(raf);
  }, [measure]);

  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(measure);
    observer.observe(container);
    window.addEventListener("resize", measure);
    // Re-measure once web fonts finish loading (metrics change).
    document.fonts?.ready.then(measure).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    let next: number | null = null;
    if (event.key === "ArrowDown") next = (index + 1) % items.length;
    else if (event.key === "ArrowUp")
      next = (index - 1 + items.length) % items.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = items.length - 1;
    if (next === null) return;

    event.preventDefault();
    const item = items[next];
    onSelect?.(item.id);
    itemRefs.current[item.id]?.focus();
  };

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
          className="spotlight pointer-events-none absolute left-0 top-0 z-0 rounded-control border border-line bg-soft"
          style={{
            width: box.w,
            height: box.h,
            transform: `translate(${box.x}px, ${box.y}px)`,
            transition: ready
              ? "transform 350ms cubic-bezier(0.65,0,0.35,1), width 350ms cubic-bezier(0.65,0,0.35,1), height 350ms cubic-bezier(0.65,0,0.35,1)"
              : "none",
          }}
        />
      )}
      {items.map((item, index) => {
        const active = item.id === activeId;
        return (
          <button
            key={item.id}
            ref={(el) => {
              itemRefs.current[item.id] = el;
            }}
            type="button"
            role="option"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            onClick={() => onSelect?.(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "relative z-[1] flex w-full flex-col items-start gap-0.5 rounded-control px-3 py-2.5 text-start transition-colors duration-200 hover:bg-soft focus-visible:outline-none",
              active ? "text-foreground" : "text-foreground-2",
            )}
          >
            <span className="w-full truncate text-[13px] font-medium">
              {item.title}
            </span>
            {item.meta && (
              <span className="text-[11px] text-foreground-3">{item.meta}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
