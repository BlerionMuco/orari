// Pure working-hours helpers — no DB, no IO, client-importable (defaults seed the
// form; expandSchedule shapes the payload the onboarding RPC consumes).

import type { DayHoursInput } from "@/lib/schemas/onboarding";

// A single resource's open window for one weekday, in business-local minutes —
// the shape the engine's working_hours rows use.
export interface ExpandedDay {
  weekday: number; // 0 = Sun .. 6 = Sat
  startMinute: number; // minutes from local midnight
  endMinute: number;
}

// "HH:MM" → minutes from midnight.
export function hhmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Minutes from midnight → zero-padded "HH:MM".
export function minutesToHhmm(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// Seed schedule: Mon–Fri open 09:00–17:00, Sat/Sun closed. Closed days keep a
// valid placeholder time so the form's format validation never trips on them.
export function defaultWeeklyHours(): DayHoursInput[] {
  return Array.from({ length: 7 }, (_, weekday) => ({
    weekday,
    open: weekday >= 1 && weekday <= 5,
    start: "09:00",
    end: "17:00",
  }));
}

// Open days only, mapped to engine minutes. The action converts these camelCase
// fields to the RPC's snake_case JSON at the boundary.
export function expandSchedule(hours: DayHoursInput[]): ExpandedDay[] {
  return hours
    .filter((d) => d.open)
    .map((d) => ({
      weekday: d.weekday,
      startMinute: hhmmToMinutes(d.start),
      endMinute: hhmmToMinutes(d.end),
    }));
}
