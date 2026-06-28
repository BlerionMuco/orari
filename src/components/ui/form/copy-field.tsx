"use client";

import * as React from "react";
import { CopyButton } from "@/components/ui/buttons/copy-button";
import { cn } from "@/lib/utils";

export interface CopyFieldProps {
  value: string;
  label?: string;
  className?: string;
  ariaLabel?: string;
}

// Read-only input with an inline copy button — used for the public booking URL
// on the business-profile screen. The input is sized for mobile (text-base to
// stop iOS zoom on focus); the button slot is sized to a 44px tap target.
export function CopyField({
  value,
  label,
  className,
  ariaLabel,
}: CopyFieldProps): React.JSX.Element {
  return (
    <div className={cn("flex items-stretch gap-2", className)}>
      <input
        readOnly
        type="text"
        value={value}
        aria-label={ariaLabel ?? label ?? "Copyable value"}
        onFocus={(e) => e.currentTarget.select()}
        className="min-h-11 flex-1 rounded-[12px] border border-border bg-bg px-3 text-base text-text focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
      />
      <CopyButton value={value} label={label ?? "Copy"} className="min-h-11" />
    </div>
  );
}
