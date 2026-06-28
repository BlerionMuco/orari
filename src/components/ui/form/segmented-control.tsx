"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/form/radio-group";

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

export interface SegmentedControlProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<SegmentedOption<T>>;
  ariaLabel: string;
  className?: string;
}

// Pill-shaped multi-tab switch over Radix RadioGroup. Used for booking|block
// mode, role tabs, and any 2–4 option exclusive picker.
export function SegmentedControl<T extends string>({
  value,
  onValueChange,
  options,
  ariaLabel,
  className,
}: SegmentedControlProps<T>): React.JSX.Element {
  return (
    <RadioGroup
      value={value}
      onValueChange={(next) => onValueChange(next as T)}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex w-full gap-1 rounded-[12px] bg-fill-subtle p-1",
        className,
      )}
    >
      {options.map((opt) => (
        <RadioGroupItem
          key={opt.value}
          value={opt.value}
          className={cn(
            "flex-1 rounded-[9px] px-3 py-2 text-[13.5px] font-semibold text-text-muted transition-colors",
            "data-[state=checked]:bg-surface data-[state=checked]:text-text data-[state=checked]:shadow-[0_1px_3px_rgba(26,26,23,0.12)]",
          )}
        >
          {opt.label}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}
