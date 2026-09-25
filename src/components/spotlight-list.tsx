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
  /** Null = no active item (e.g. the "new chat" welcome state). */
  activeId: string | null;
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
 *   easing `cubic-bezier(0.65,0,0.35,1)` over 350ms (never a jump).
 * - offsetLeft/offsetTop are *physical* coordinates relative to the
 *   offsetParent, and translate() is physical too — so the glide is correct
 *   in RTL and LTR alike.
 * - The box animates ONLY on selection changes. Layout-driven re-measurements
 *   (resize, font load, list changes) re-apply the position with transitions
 *   disabled so the box never drifts across the list on layout changes.
 * - The ResizeObserver is subscribed ONCE (refs carry the latest state);
 *   re-subscribing on every selection would fire a fresh initial callback
 *   and cancel the glide mid-flight (that was the jump bug).
 * - Honors prefers-reduced-motion via the global CSS media query (.spotlight).
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
  const activeIdRef = React.useRef(activeId);
  const [box, setBox] = React.useState<SpotlightBox | null>(null);
  // Transitions are only enabled right after a selection-triggered move.
  const [animate, setAnimate] = React.useState(false);

  activeIdRef.current = activeId;

  /** Re-position without animating (layout changed, not the selection). */
  const remeasure = React.useCallback(() => {
    const el = activeIdRef.current
      ? itemRefs.current[activeIdRef.current]
      : undefined;
    if (!el) {
      setBox(null);
      return;
    }
    const next = {
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
    };
    setBox((prev) => {
      // Skip identical measurements entirely — this keeps `animate` (and the
      // in-flight glide) untouched when nothing actually moved.
      if (
        prev &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.w === next.w &&
        prev.h === next.h
      ) {
        return prev;
      }
      setAnimate(false);
      return next;
    });
  }, []);

  /** Glide to the active item (selection changed or first mount). */
  React.useEffect(() => {
    const el = activeId ? itemRefs.current[activeId] : undefined;
    if (!el) {
      setAnimate(false);
      setBox(null);
      return;
    }
    setAnimate(true);
    setBox({
      x: el.offsetLeft,
      y: el.offsetTop,
      w: el.offsetWidth,
      h: el.offsetHeight,
    });
  }, [activeId]);

  // Layout listeners — subscribed once, always reading fresh state via refs.
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(remeasure);
    observer.observe(container);
    window.addEventListener("resize", remeasure);
    // Re-measure once web fonts finish loading (metrics change).
    document.fonts?.ready.then(remeasure).catch(() => undefined);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", remeasure);
    };
  }, [remeasure]);

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
          data-spotlight=""
          className="spotlight pointer-events-none absolute left-0 top-0 z-0 rounded-control border border-line bg-soft"
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
            // Roving tab index: the active item is reachable; with no active
            // item the first one is, so the listbox stays keyboard-accessible.
            tabIndex={active || (!activeId && index === 0) ? 0 : -1}
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
