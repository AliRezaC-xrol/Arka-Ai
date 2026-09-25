"use client";

import * as React from "react";

import { cn } from "@/lib/utils";

interface OtpInputProps {
  length?: number;
  onComplete?: (code: string) => void;
  className?: string;
}

/**
 * Six-box OTP entry (SPEC §7.1), UI-only in Phase 0:
 * - auto-focus moves forward as you type, back on empty Backspace
 * - Arrow keys navigate between boxes
 * - pasting a full code fills all boxes at once
 * - the group is forced LTR so code semantics stay stable inside the RTL page
 */
export function OtpInput({ length = 6, onComplete, className }: OtpInputProps) {
  const [values, setValues] = React.useState<string[]>(() =>
    Array.from({ length }, () => ""),
  );
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  const focusAt = (index: number) => {
    const clamped = Math.max(0, Math.min(length - 1, index));
    refs.current[clamped]?.focus();
  };

  // Auto-focus the first box when the group mounts (the user just asked
  // for a code — start typing immediately).
  React.useEffect(() => {
    focusAt(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const commit = (next: string[], focusIndex: number) => {
    setValues(next);
    focusAt(focusIndex);
    if (next.every((v) => v !== "")) onComplete?.(next.join(""));
  };

  const handleChange = (index: number, raw: string) => {
    const digits = raw.replace(/\D/g, "");

    if (digits === "") {
      const next = [...values];
      next[index] = "";
      setValues(next);
      return;
    }

    const next = [...values];
    let cursor = index;
    for (const digit of digits) {
      if (cursor >= length) break;
      next[cursor] = digit;
      cursor += 1;
    }
    commit(next, Math.min(cursor, length - 1));
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent) => {
    if (event.key === "Backspace") {
      if (values[index]) {
        const next = [...values];
        next[index] = "";
        setValues(next);
      } else if (index > 0) {
        event.preventDefault();
        const next = [...values];
        next[index - 1] = "";
        commit(next, index - 1);
      }
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      focusAt(index - 1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (index: number, event: React.ClipboardEvent) => {
    event.preventDefault();
    const digits = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, length - index);
    if (!digits) return;

    const next = [...values];
    digits.split("").forEach((digit, offset) => {
      next[index + offset] = digit;
    });
    commit(next, Math.min(index + digits.length, length - 1));
  };

  return (
    <div
      role="group"
      aria-label={`کد تأیید ${length} رقمی`}
      dir="ltr"
      className={cn("grid grid-cols-6 gap-1.5", className)}
    >
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={value}
          onChange={(event) => handleChange(index, event.target.value)}
          onKeyDown={(event) => handleKeyDown(index, event)}
          onPaste={(event) => handlePaste(index, event)}
          onFocus={(event) => event.currentTarget.select()}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          aria-label={`رقم ${index + 1}`}
          className="h-12 w-full rounded-control border border-line bg-elevated text-center text-lg font-medium text-foreground transition-colors duration-200 outline-none hover:border-white/20 focus-visible:border-white/45"
        />
      ))}
    </div>
  );
}
