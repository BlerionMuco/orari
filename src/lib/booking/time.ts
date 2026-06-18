// Pure timezone / DST math — the keystone of the engine. No DB, no IO, no
// `Date.now()` (callers inject `now`). Every stored instant is UTC; business
// timezone is an IANA name. All wall-clock → UTC conversion goes through
// `localPartsToUtc` so DST gaps and ambiguity resolve in exactly one place.
//
// Verified against @date-fns/tz@1.5.0:
//  - `new TZDate(y, monthIndex, d, h, min, zone)` reads parts as wall-clock in
//    `zone`; `.getTime()` is the UTC instant. Month is 0-based.
//  - A spring-forward gap (e.g. 02:30 when 02:00→03:00) is rolled forward by the
//    lib (→ 03:30), so a round-trip of the wall clock no longer matches → we
//    report `existed: false`.
//  - A fall-back ambiguous time (occurs twice) is resolved by the lib to the
//    EARLIER occurrence, which is exactly the rule we want — no extra probing.

import { TZDate, tz } from "@date-fns/tz";
import { format, getDay } from "date-fns";
import { MINUTES_PER_DAY } from "./constants";

export interface LocalParts {
  year: number;
  month: number; // 1..12
  day: number;
  hour: number;
  minute: number;
  weekday: number; // 0 = Sun .. 6 = Sat
}

interface IsoDateParts {
  year: number;
  month: number; // 1..12
  day: number;
}

function parseIsoDate(isoDate: string): IsoDateParts {
  const [year, month, day] = isoDate.split("-").map(Number);
  return { year, month, day };
}

function pad2(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

function toIsoDate(year: number, month: number, day: number): string {
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

// Render a UTC instant as the business-local calendar/clock parts.
export function utcToLocalParts(utc: Date, timeZone: string): LocalParts {
  const stamp = format(utc, "yyyy-MM-dd HH:mm", { in: tz(timeZone) });
  const [datePart, timePart] = stamp.split(" ");
  const { year, month, day } = parseIsoDate(datePart);
  const [hour, minute] = timePart.split(":").map(Number);
  const weekday = getDay(utc, { in: tz(timeZone) });
  return { year, month, day, hour, minute, weekday };
}

// Convert a business-local wall time (a calendar date + minutes-from-midnight,
// which may exceed 1440 for overnight windows) into a UTC instant. `existed`
// is false when that wall time falls in a spring-forward gap and does not exist.
export function localPartsToUtc(
  isoDate: string,
  minuteOfDay: number,
  timeZone: string,
): { utc: Date; existed: boolean } {
  const { year, month, day } = parseIsoDate(isoDate);
  const dayOffset = Math.floor(minuteOfDay / MINUTES_PER_DAY);
  const within =
    ((minuteOfDay % MINUTES_PER_DAY) + MINUTES_PER_DAY) % MINUTES_PER_DAY;
  const hour = Math.floor(within / 60);
  const minute = within % 60;

  // `day + dayOffset` overflow is normalized across month/year by the Date core.
  const local = new TZDate(year, month - 1, day + dayOffset, hour, minute, timeZone);
  const utc = new Date(local.getTime());

  // Did the requested wall clock survive the round trip? If the lib had to shift
  // it (DST gap), the local hour:minute won't match what we asked for.
  const back = utcToLocalParts(utc, timeZone);
  const existed = back.hour === hour && back.minute === minute;
  return { utc, existed };
}

// Business-local weekday for a calendar date (read at local noon to avoid any
// midnight-adjacent DST edge).
export function localWeekday(isoDate: string, timeZone: string): number {
  const { year, month, day } = parseIsoDate(isoDate);
  const noon = new TZDate(year, month - 1, day, 12, 0, timeZone);
  return getDay(new Date(noon.getTime()), { in: tz(timeZone) });
}

// Business-local "HH:mm" label for a UTC instant.
export function formatLocalTimeLabel(utc: Date, timeZone: string): string {
  return format(utc, "HH:mm", { in: tz(timeZone) });
}

// Inclusive list of calendar dates "YYYY-MM-DD" from start to end. Pure calendar
// arithmetic in UTC (dates are timezone-agnostic strings), so DST never shifts a
// day boundary here.
export function eachLocalDate(startIso: string, endIso: string): string[] {
  const start = parseIsoDate(startIso);
  const end = parseIsoDate(endIso);
  const cursor = new Date(Date.UTC(start.year, start.month - 1, start.day));
  const last = Date.UTC(end.year, end.month - 1, end.day);
  const out: string[] = [];
  while (cursor.getTime() <= last) {
    out.push(
      toIsoDate(
        cursor.getUTCFullYear(),
        cursor.getUTCMonth() + 1,
        cursor.getUTCDate(),
      ),
    );
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return out;
}

// Offset of `timeZone` at a given instant, in minutes east of UTC (so
// Europe/Tirane summer = +120). JS `getTimezoneOffset()` is negated minutes.
export function tzOffsetMinutes(utc: Date, timeZone: string): number {
  return -new TZDate(utc.getTime(), timeZone).getTimezoneOffset();
}

// Business-local calendar date "YYYY-MM-DD" of a UTC instant.
export function localIsoDate(utc: Date, timeZone: string): string {
  const p = utcToLocalParts(utc, timeZone);
  return toIsoDate(p.year, p.month, p.day);
}

// Friendly, customer-facing timezone label ("Tirana time") — never the raw IANA
// id ("Europe/Tirane"). Known zones get a curated city; otherwise the last path
// segment is humanized (underscores → spaces). The engine still stores/computes
// in the IANA zone — this is display only.
const TZ_CITY_LABELS: Record<string, string> = {
  "Europe/Tirane": "Tirana",
};

export function formatTimezoneLabel(ianaId: string): string {
  const curated = TZ_CITY_LABELS[ianaId];
  const city =
    curated ?? ianaId.split("/").pop()?.replace(/_/g, " ") ?? ianaId;
  return `${city} time`;
}

// Add (or subtract) whole calendar days to a "YYYY-MM-DD" string. Pure calendar
// math in UTC, so DST never shifts the result.
export function addDaysToIsoDate(isoDate: string, days: number): string {
  const { year, month, day } = parseIsoDate(isoDate);
  const d = new Date(Date.UTC(year, month - 1, day));
  d.setUTCDate(d.getUTCDate() + days);
  return toIsoDate(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}
