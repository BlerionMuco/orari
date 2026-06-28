"use client";

import * as React from "react";
import { Select, type SelectOption } from "@/components/ui/form/select";

export interface TimeSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  startHour?: number;
  endHour?: number;
  stepMin?: number;
  disabled?: boolean;
  error?: boolean;
  id?: string;
  "aria-label"?: string;
}

function buildTimeOptions(
  startHour: number,
  endHour: number,
  stepMin: number,
): SelectOption[] {
  const opts: SelectOption[] = [];
  for (let h = startHour; h <= endHour; h++) {
    for (let m = 0; m < 60; m += stepMin) {
      if (h === endHour && m > 0) break;
      const value = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      opts.push({ value, label: value });
    }
  }
  return opts;
}

// HH:MM picker built on the styled Select. Shared by working-hours editor,
// new-booking time, and block-time start/end.
export function TimeSelect({
  value,
  onValueChange,
  startHour = 8,
  endHour = 22,
  stepMin = 30,
  disabled,
  error,
  id,
  "aria-label": ariaLabel,
}: TimeSelectProps): React.JSX.Element {
  const options = React.useMemo(
    () => buildTimeOptions(startHour, endHour, stepMin),
    [startHour, endHour, stepMin],
  );
  return (
    <Select
      value={value}
      onValueChange={onValueChange}
      options={options}
      disabled={disabled}
      error={error}
      id={id}
      aria-label={ariaLabel}
    />
  );
}
