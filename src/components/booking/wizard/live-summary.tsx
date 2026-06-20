"use client";

import * as React from "react";
import { Lock } from "lucide-react";
import { useBookingSummary } from "./use-booking-summary";

const RAIL_LABELS = ["Service", "Barber", "Date & time"];

// Desktop-only live "Your booking" rail card — reflects the current selection.
export function LiveSummary(): React.JSX.Element {
  const { rows, priceLabel, selectedServices } = useBookingSummary();
  const railRows = rows.filter((r) => RAIL_LABELS.includes(r.label));
  const total = selectedServices.length > 0 ? priceLabel : "—";

  return (
    <div className="rounded-[16px] border border-border bg-surface px-5 pb-4 pt-2 shadow-card">
      <div className="py-3.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-text-disabled">
        Your booking
      </div>
      {railRows.map((row) => (
        <div
          key={row.label}
          className="flex items-start justify-between gap-3.5 border-b border-fill-subtle py-2.75"
        >
          <span className="flex-none text-[13px] text-text-muted">
            {row.label}
          </span>
          <span className="text-right text-[13.5px] font-semibold text-text">
            {row.value}
          </span>
        </div>
      ))}
      <div className="flex items-center justify-between py-3.5">
        <span className="text-[13px] font-semibold text-text">Total</span>
        <span className="text-[19px] font-semibold tabular-nums text-primary-pressed">
          {total}
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-[11px] bg-fill-subtle px-3.25 py-2.75">
        <Lock className="h-3.75 w-3.75 flex-none text-primary" strokeWidth={1.9} />
        <span className="text-[12px] leading-[1.4] text-text-muted">
          No account needed · Pay in person.
        </span>
      </div>
    </div>
  );
}
