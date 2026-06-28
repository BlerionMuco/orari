import * as React from "react";
import { cn } from "@/lib/utils";
import { BookingStatus } from "@/db/schema";

const STATUS_LABEL: Record<BookingStatus, string> = {
  [BookingStatus.HELD]: "Held",
  [BookingStatus.CONFIRMED]: "Confirmed",
  [BookingStatus.COMPLETED]: "Completed",
  [BookingStatus.NO_SHOW]: "No-show",
  [BookingStatus.CANCELLED]: "Cancelled",
};

const STATUS_STYLE: Record<BookingStatus, string> = {
  [BookingStatus.HELD]: "bg-warning-bg text-warning-text",
  [BookingStatus.CONFIRMED]: "bg-primary-tint text-primary-pressed",
  [BookingStatus.COMPLETED]: "bg-success-bg text-success-text",
  [BookingStatus.NO_SHOW]: "bg-warning-bg text-warning-text",
  [BookingStatus.CANCELLED]: "bg-danger-bg text-danger-text",
};

export interface StatusBadgeProps {
  status: BookingStatus;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex h-6 flex-none items-center rounded-full px-2.5 text-[11px] font-semibold uppercase tracking-[0.04em]",
        STATUS_STYLE[status],
        className,
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}
