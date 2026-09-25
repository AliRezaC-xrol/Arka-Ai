"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ModelGroup {
  provider: string;
  models: string[];
}

interface ModelPickerProps {
  groups: ModelGroup[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

/**
 * Model picker (SPEC §5), mock data in Phase 0.
 * Grouped by provider — the provider name is exactly what was "entered"
 * when the provider was added (in Phase 2 it comes from the Provider row).
 * The trigger is the real vibefarsi Button (variant="outline").
 *
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Enter selects,
 * Escape closes and returns focus to the trigger, Tab closes.
 */
export function ModelPicker({ groups, value, onChange, className }: ModelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  /** The trigger is the first <button> under the root. */
  const focusTrigger = React.useCallback(() => {
    rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
  }, []);

  const options = React.useMemo(
    () =>
      groups.flatMap((group) =>
        group.models.map((model) => ({
          id: `${group.provider}:${model}`,
          provider: group.provider,
          model,
        })),
      ),
    [groups],
  );

  const current = options.find((option) => option.id === value) ?? options[0];

  const focusSelected = React.useCallback(() => {
    requestAnimationFrame(() => {
      const el =
        listRef.current?.querySelector<HTMLButtonElement>(
          "[aria-selected='true']",
        ) ?? listRef.current?.querySelector<HTMLButtonElement>("button");
      el?.focus();
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

  const onListKeyDown = (event: React.KeyboardEvent) => {
    const buttons = Array.from(
      listRef.current?.querySelectorAll<HTMLButtonElement>("button") ?? [],
    );
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

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      {/* Real vibefarsi Button as the trigger */}
      <Button
        variant="outline"
        size="sm"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={current ? `مدل: ${current.provider} ${current.model}` : "انتخاب مدل"}
        onClick={() => {
          if (open) {
            close();
          } else {
            setOpen(true);
            focusSelected();
          }
        }}
        className="max-w-[220px] sm:max-w-[320px]"
      >
        <span className="min-w-0 truncate">
          {current ? `${current.provider} · ${current.model}` : "انتخاب مدل"}
        </span>
        <ChevronDown
          aria-hidden
          className={cn("shrink-0 transition-transform duration-200", open && "rotate-180")}
        />
      </Button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="انتخاب مدل"
          onKeyDown={onListKeyDown}
          className="absolute top-full start-0 z-50 mt-2 max-h-80 w-72 max-w-[calc(100vw-2rem)] overflow-auto rounded-card border border-line bg-popover p-1.5"
        >
          {groups.map((group, groupIndex) => (
            <React.Fragment key={group.provider}>
              <li
                role="presentation"
                className={cn(
                  "px-3 pb-1.5 pt-2 text-[11px] font-medium tracking-wide text-foreground-3",
                  groupIndex > 0 && "mt-1 border-t border-line pt-3",
                )}
              >
                {group.provider}
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
                        selected ? "bg-soft text-foreground" : "text-foreground-2",
                      )}
                    >
                      <span className="truncate">{model}</span>
                      {selected && (
                        <Check aria-hidden className="size-3.5 shrink-0 text-foreground" />
                      )}
                    </button>
                  </li>
                );
              })}
            </React.Fragment>
          ))}
        </ul>
      )}
    </div>
  );
}
