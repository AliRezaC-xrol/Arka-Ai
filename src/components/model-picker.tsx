"use client";

import * as React from "react";
import { Check, ChevronDown } from "lucide-react";

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
 * Keyboard: Enter/Space/ArrowDown opens, arrows move, Enter selects,
 * Escape closes and returns focus to the trigger.
 */
export function ModelPicker({ groups, value, onChange, className }: ModelPickerProps) {
  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

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

  React.useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: PointerEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const trigger = () => {
    if (open) {
      setOpen(false);
    } else {
      setOpen(true);
      focusSelected();
    }
  };

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
    } else if (event.key === "Escape") {
      setOpen(false);
      rootRef.current?.querySelector<HTMLButtonElement>("button")?.focus();
    }
  };

  return (
    <div ref={rootRef} className={cn("relative", className)}>
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={trigger}
        className="flex h-9 max-w-[210px] items-center gap-2 rounded-control border border-line bg-transparent px-3 text-[13px] text-foreground transition-colors duration-200 hover:bg-soft sm:max-w-[320px]"
      >
        <span className="truncate">
          {current ? `${current.provider} · ${current.model}` : "انتخاب مدل"}
        </span>
        <ChevronDown aria-hidden className="size-3.5 shrink-0 text-foreground-3" />
      </button>

      {open && (
        <ul
          ref={listRef}
          role="listbox"
          aria-label="انتخاب مدل"
          onKeyDown={onListKeyDown}
          className="absolute top-full start-0 z-50 mt-2 max-h-80 w-72 max-w-[calc(100vw-2rem)] overflow-auto rounded-card border border-line bg-card p-1.5"
        >
          {groups.map((group) => (
            <React.Fragment key={group.provider}>
              <li
                role="presentation"
                className="px-3 pb-1 pt-2 text-[11px] font-medium text-foreground-3"
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
                      tabIndex={-1}
                      onClick={() => {
                        onChange(id);
                        setOpen(false);
                        rootRef.current
                          ?.querySelector<HTMLButtonElement>("button")
                          ?.focus();
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-3 rounded-control px-3 py-2 text-[13px] transition-colors duration-200 hover:bg-soft",
                        selected ? "text-foreground" : "text-foreground-2",
                      )}
                    >
                      <span className="truncate">{model}</span>
                      {selected && <Check aria-hidden className="size-3.5 shrink-0" />}
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
