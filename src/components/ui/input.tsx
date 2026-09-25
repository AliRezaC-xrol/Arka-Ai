/**
 * ARKA AI Platform — Confidential & Proprietary
 * Copyright (c) 2026 AliRezaC-xrol (https://github.com/AliRezaC-xrol/arka). All rights reserved.
 * PROPRIETARY & CLOSED-SOURCE: Unauthorized copying, modification, or distribution is strictly prohibited.
 */

import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-control border border-line bg-transparent px-3.5 text-sm text-foreground transition-colors duration-200 outline-none placeholder:text-foreground-3 hover:border-white/20 focus-visible:border-white/45 disabled:opacity-40",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
