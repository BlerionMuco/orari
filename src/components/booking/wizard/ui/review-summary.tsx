import * as React from "react";
import { cn } from "@/lib/utils";

export interface SummaryRow {
  label: string;
  value: string;
  emphasis?: boolean; // the price row — larger, indigo
}

export interface ReviewSummaryProps {
  rows: SummaryRow[];
  // "surface" = white card (review step); "subtle" = bg-bg card (success / rail).
  tone?: "surface" | "subtle";
  className?: string;
}

// Shared summary rows (service / barber / when / duration / price). Used by the
// review step, the success screen, and the desktop live-summary rail.
export function ReviewSummary({
  rows,
  tone = "surface",
  className,
}: ReviewSummaryProps): React.JSX.Element {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border px-4.5",
        tone === "surface" ? "bg-surface shadow-card" : "bg-bg",
        className,
      )}
    >
      {rows.map((row, i) => (
        <div
          key={row.label}
          className={cn(
            "flex items-center justify-between gap-3.5 py-3.25",
            i < rows.length - 1 && "border-b border-fill-subtle",
          )}
        >
          <span className="flex-none text-[13px] text-text-muted">
            {row.label}
          </span>
          <span
            className={cn(
              "text-right",
              row.emphasis
                ? "text-[17px] font-semibold text-primary-pressed"
                : "text-[14px] font-semibold text-text",
            )}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
