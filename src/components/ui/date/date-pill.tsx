import * as React from "react";
import { cn } from "@/lib/utils";
import { dayLabel } from "@/lib/booking/day-label";

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

export interface DatePillProps {
  iso: string;
  todayIso: string;
  className?: string;
}

// Compact tag like "Today · Mon 23 Jun" used as a sub-label on cards
// (booking detail header, calendar day chip).
export function DatePill({ iso, todayIso, className }: DatePillProps): React.JSX.Element {
  const [year, month, day] = iso.split("-").map(Number);
  const friendly = dayLabel(iso, todayIso);
  const weekday = new Date(Date.UTC(year, month - 1, day)).toLocaleDateString("en-US", {
    weekday: "short",
    timeZone: "UTC",
  });
  const monthShort = MONTHS[month - 1];
  const right = `${weekday} ${day} ${monthShort}`;
  const showFriendly = friendly === "Today" || friendly === "Tomorrow";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-fill-subtle px-2.5 py-1 text-[11.5px] font-semibold text-text-muted",
        className,
      )}
    >
      {showFriendly ? <span className="text-text">{friendly}</span> : null}
      {showFriendly ? <span aria-hidden="true">·</span> : null}
      <span>{right}</span>
    </span>
  );
}
