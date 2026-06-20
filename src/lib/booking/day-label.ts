// Friendly day-strip label for a business-local calendar date. "Today" /
// "Tomorrow" / short weekday ("Sat"). Pure: `todayIso` (business-local) is
// injected — no clock in pure code. The day-of-month is read straight off the
// ISO string by the caller for the pill's number.
import { addDaysToIsoDate } from "./time";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

export function dayLabel(iso: string, todayIso: string): string {
  if (iso === todayIso) return "Today";
  if (iso === addDaysToIsoDate(todayIso, 1)) return "Tomorrow";
  const [year, month, day] = iso.split("-").map(Number);
  // Date-only string is timezone-agnostic; UTC construction is deterministic.
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()];
}
