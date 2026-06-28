"use client";

import * as React from "react";
import { AlertCircle } from "lucide-react";
import { LabeledRow } from "@/components/ui/form/labeled-row";
import { Switch } from "@/components/ui/form/switch";
import { TimeSelect } from "@/components/ui/form/time-select";

const WEEKDAY_LABEL = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export interface DayRowProps {
  weekday: number;
  open: boolean;
  start: string;
  end: string;
  onOpenChange: (open: boolean) => void;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}

// One day in the weekly editor: open switch + start/end pickers when open.
// Inline error chip surfaces when end ≤ start (validated by the form schema).
export function DayRow({
  weekday,
  open,
  start,
  end,
  onOpenChange,
  onStartChange,
  onEndChange,
}: DayRowProps): React.JSX.Element {
  const invalid = open && !(end > start);
  const label = WEEKDAY_LABEL[weekday];
  return (
    <LabeledRow
      title={label}
      subtitle={
        <span className={open ? "text-success-text" : "text-text-disabled"}>
          {open ? "Open" : "Closed"}
        </span>
      }
      trailing={
        <Switch
          checked={open}
          onCheckedChange={onOpenChange}
          aria-label={open ? `Close ${label}` : `Open ${label}`}
        />
      }
      dim={!open}
    >
      {open ? (
        <>
          <div className="grid grid-cols-2 gap-3">
            <TimeSelect
              value={start}
              onValueChange={onStartChange}
              aria-label={`${label} start time`}
              error={invalid}
            />
            <TimeSelect
              value={end}
              onValueChange={onEndChange}
              aria-label={`${label} end time`}
              error={invalid}
            />
          </div>
          {invalid ? (
            <p className="flex items-center gap-1.5 text-[12px] text-danger-text">
              <AlertCircle className="h-3.5 w-3.5" aria-hidden="true" />
              End time must be after the start.
            </p>
          ) : null}
        </>
      ) : null}
    </LabeledRow>
  );
}
