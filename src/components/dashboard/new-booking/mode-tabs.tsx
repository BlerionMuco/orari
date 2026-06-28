"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { SegmentedControl } from "@/components/ui/form/segmented-control";

export const NewBookingMode = {
  BOOKING: "booking",
  BLOCK: "block",
} as const;
export type NewBookingMode =
  (typeof NewBookingMode)[keyof typeof NewBookingMode];

const OPTIONS = [
  { value: NewBookingMode.BOOKING, label: "New booking" },
  { value: NewBookingMode.BLOCK, label: "Block time" },
] as const;

export interface ModeTabsProps {
  mode: NewBookingMode;
  showBooking: boolean; // staff sees only block; hide the booking tab entirely
}

// URL-driven mode switch. Staff don't get the booking tab; with only one tab
// the segmented control is dead weight so we render nothing.
export function ModeTabs({ mode, showBooking }: ModeTabsProps): React.JSX.Element | null {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  if (!showBooking) return null;

  const onChange = (next: NewBookingMode): void => {
    const search = new URLSearchParams(params.toString());
    search.set("mode", next);
    router.replace(`${pathname}?${search.toString()}`);
  };

  return (
    <div className="mb-4">
      <SegmentedControl
        ariaLabel="New booking or block time"
        value={mode}
        onValueChange={onChange}
        options={OPTIONS}
      />
    </div>
  );
}
