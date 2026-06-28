"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/form/radio-group";
import { useDragScroll } from "./use-drag-scroll";

export interface DayPill {
  iso: string;
  label: string; // "Today" | "Tomorrow" | "Sat"
  dom: number; // day-of-month
  disabled: boolean; // closed
  statusText?: "Closed" | "Full"; // shown instead of the availability dot
}

export interface DayStripProps {
  days: DayPill[];
  selectedIso: string | null;
  onPick: (iso: string) => void;
}

// Shown while the windowed availability fetch is in flight (the real day strip
// is derived from the server's returned date window, so it has no days yet).
export function DayStripSkeleton(): React.JSX.Element {
  return (
    <div className="-mx-0.5 flex gap-2.25 overflow-hidden px-0.5 pb-2.75">
      {Array.from({ length: 7 }, (_, i) => (
        <div
          key={i}
          className="h-19.5 w-16 flex-none animate-pulse rounded-[14px] bg-fill-subtle"
        />
      ))}
    </div>
  );
}

// Horizontal day strip as a single Radix radio group. Closed days are disabled;
// "Full" days are pickable (they resolve to the empty-day state).
export function DayStrip({
  days,
  selectedIso,
  onPick,
}: DayStripProps): React.JSX.Element {
  const scrollRef = useDragScroll<HTMLDivElement>();
  return (
    <RadioGroup
      ref={scrollRef}
      value={selectedIso ?? ""}
      onValueChange={onPick}
      aria-label="Choose a day"
      className="-mx-0.5 flex min-w-0 max-w-full cursor-grab select-none gap-2.25 overflow-x-auto px-0.5 pb-2.75 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden [mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%_-_16px),transparent)] [-webkit-mask-image:linear-gradient(to_right,transparent,black_16px,black_calc(100%_-_16px),transparent)]"
    >
      {days.map((d) => (
        <RadioGroupItem
          key={d.iso}
          value={d.iso}
          disabled={d.disabled}
          className={cn(
            "flex h-19.5 w-16 flex-none touch-manipulation select-none flex-col items-center justify-center gap-1 rounded-[14px] border transition-[transform,background-color,border-color]",
            d.disabled
              ? "border-border bg-bg text-text-disabled"
              : "border-border bg-surface text-text hover:border-border-strong",
            "data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-surface data-[state=checked]:shadow-[0_8px_18px_-10px_rgba(91,95,199,0.6)]",
          )}
        >
          <span className="text-[9.5px] font-semibold uppercase tracking-[0.04em] opacity-[0.78]">
            {d.label}
          </span>
          <span className="text-[19px] font-semibold tracking-[-0.01em]">
            {d.dom}
          </span>
          {d.statusText ? (
            <span
              className={cn(
                "text-[9px] font-semibold uppercase tracking-[0.02em]",
                d.statusText === "Full" ? "text-danger-text" : "text-text-disabled",
              )}
            >
              {d.statusText}
            </span>
          ) : (
            <span className="h-1.25 w-1.25 rounded-full bg-success group-data-[state=checked]:bg-surface" />
          )}
        </RadioGroupItem>
      ))}
    </RadioGroup>
  );
}
