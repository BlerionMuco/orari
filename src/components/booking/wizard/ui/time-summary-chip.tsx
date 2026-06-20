import * as React from "react";
import { Check } from "lucide-react";

export interface TimeSummaryChipProps {
  name: string; // service name (or "N services")
  meta: string; // "75 min · 2,000 Lek"
}

// The compact "what you're booking" pill above the time picker.
export function TimeSummaryChip({
  name,
  meta,
}: TimeSummaryChipProps): React.JSX.Element {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-[5px] pl-[6px] pr-[14px]">
      <span className="flex h-6 w-6 items-center justify-center rounded-[7px] bg-primary-tint">
        <Check className="h-[13px] w-[13px] text-primary" strokeWidth={2.2} />
      </span>
      <span className="text-[13px] font-semibold text-text">{name}</span>
      {meta ? <span className="text-[12.5px] text-text-muted">{meta}</span> : null}
    </div>
  );
}
