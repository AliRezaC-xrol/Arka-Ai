"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/** apmix-style accordion: one item open at a time, keyboard accessible. */
export function FaqList({ items }: { items: { q: string; a: string }[] }) {
  const [open, setOpen] = React.useState(0);
  const baseId = React.useId();

  return (
    <div className="card-soft rounded-card px-6 sm:px-8">
      {items.map((item, i) => {
        const isOpen = open === i;
        return (
          <div key={item.q} className={cn(i > 0 && "border-t border-line")}>
            <h3>
              <button
                type="button"
                aria-expanded={isOpen}
                aria-controls={`${baseId}-${i}`}
                onClick={() => setOpen(isOpen ? -1 : i)}
                className="flex w-full items-center justify-between gap-6 py-6 text-start text-[17px] font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 rounded-sm"
              >
                {item.q}
                <span
                  aria-hidden
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-full border transition-colors duration-150",
                    isOpen ? "border-white bg-white text-black" : "border-line text-foreground-2",
                  )}
                >
                  <Plus className={cn("size-4 transition-transform duration-200", isOpen && "rotate-45")} />
                </span>
              </button>
            </h3>
            {/* Smooth drawer: grid-rows 0fr → 1fr animates to the content's
                real height without measuring. inert keeps closed answers
                out of the tab/AT order. */}
            <div
              id={`${baseId}-${i}`}
              role="region"
              inert={!isOpen}
              className={cn(
                "grid transition-[grid-template-rows,opacity] duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]",
                isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
              )}
            >
              <div className="overflow-hidden">
                <p className="-mt-2 pb-6 pe-12 text-[15px] leading-[1.9] text-foreground-2">{item.a}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
