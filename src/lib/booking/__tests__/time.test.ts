import { describe, it, expect } from "vitest";
import {
  localPartsToUtc,
  utcToLocalParts,
  localWeekday,
  formatLocalTimeLabel,
  eachLocalDate,
  tzOffsetMinutes,
} from "../time";

const TZ = "Europe/Tirane";

describe("localPartsToUtc", () => {
  it("converts a summer wall time to the correct UTC instant", () => {
    // 2025-07-15 09:30 CEST (+02:00) → 07:30 UTC
    const { utc, existed } = localPartsToUtc("2025-07-15", 9 * 60 + 30, TZ);
    expect(existed).toBe(true);
    expect(utc.toISOString()).toBe("2025-07-15T07:30:00.000Z");
  });

  it("converts a winter wall time (+01:00) correctly", () => {
    // 2025-01-15 09:30 CET (+01:00) → 08:30 UTC
    const { utc } = localPartsToUtc("2025-01-15", 9 * 60 + 30, TZ);
    expect(utc.toISOString()).toBe("2025-01-15T08:30:00.000Z");
  });

  it("flags a spring-forward gap as non-existent (02:30 on 2025-03-30)", () => {
    const { existed } = localPartsToUtc("2025-03-30", 2 * 60 + 30, TZ);
    expect(existed).toBe(false);
  });

  it("keeps the times bracketing the gap valid", () => {
    const before = localPartsToUtc("2025-03-30", 1 * 60 + 30, TZ); // 01:30 (+01)
    const after = localPartsToUtc("2025-03-30", 3 * 60, TZ); // 03:00 (+02)
    expect(before.existed).toBe(true);
    expect(before.utc.toISOString()).toBe("2025-03-30T00:30:00.000Z");
    expect(after.existed).toBe(true);
    expect(after.utc.toISOString()).toBe("2025-03-30T01:00:00.000Z");
  });

  it("resolves a fall-back ambiguous time to the earlier occurrence", () => {
    // 2025-10-26 02:30 occurs twice; earlier is +02:00 → 00:30 UTC
    const { utc, existed } = localPartsToUtc("2025-10-26", 2 * 60 + 30, TZ);
    expect(existed).toBe(true);
    expect(utc.toISOString()).toBe("2025-10-26T00:30:00.000Z");
  });

  it("spills overnight minutes (>1440) into the next local day", () => {
    // 2025-07-15 + 25:00 → 2025-07-16 01:00 CEST → 2025-07-15 23:00 UTC
    const { utc, existed } = localPartsToUtc("2025-07-15", 25 * 60, TZ);
    expect(existed).toBe(true);
    expect(utc.toISOString()).toBe("2025-07-15T23:00:00.000Z");
  });
});

describe("utcToLocalParts", () => {
  it("renders a UTC instant in business-local parts", () => {
    const parts = utcToLocalParts(new Date("2025-07-15T07:30:00.000Z"), TZ);
    expect(parts).toEqual({
      year: 2025,
      month: 7,
      day: 15,
      hour: 9,
      minute: 30,
      weekday: 2, // Tuesday
    });
  });
});

describe("round-trip identity", () => {
  const cases: Array<{ isoDate: string; minuteOfDay: number }> = [
    { isoDate: "2025-01-15", minuteOfDay: 9 * 60 },
    { isoDate: "2025-07-15", minuteOfDay: 17 * 60 + 45 },
    { isoDate: "2025-12-31", minuteOfDay: 23 * 60 },
    { isoDate: "2024-02-29", minuteOfDay: 12 * 60 }, // leap day
  ];
  it.each(cases)(
    "reproduces $isoDate +$minuteOfDay",
    ({ isoDate, minuteOfDay }) => {
      const { utc, existed } = localPartsToUtc(isoDate, minuteOfDay, TZ);
      expect(existed).toBe(true);
      const back = utcToLocalParts(utc, TZ);
      expect(back.hour).toBe(Math.floor(minuteOfDay / 60));
      expect(back.minute).toBe(minuteOfDay % 60);
    },
  );
});

describe("localWeekday", () => {
  it("returns 0..6 with 0 = Sunday", () => {
    expect(localWeekday("2025-07-13", TZ)).toBe(0); // Sunday
    expect(localWeekday("2025-07-15", TZ)).toBe(2); // Tuesday
    expect(localWeekday("2025-07-19", TZ)).toBe(6); // Saturday
  });
});

describe("formatLocalTimeLabel", () => {
  it("formats HH:mm in business time", () => {
    expect(formatLocalTimeLabel(new Date("2025-07-15T07:30:00.000Z"), TZ)).toBe(
      "09:30",
    );
    expect(formatLocalTimeLabel(new Date("2025-01-15T08:05:00.000Z"), TZ)).toBe(
      "09:05",
    );
  });
});

describe("eachLocalDate", () => {
  it("is inclusive and crosses a month boundary", () => {
    expect(eachLocalDate("2025-03-30", "2025-04-02")).toEqual([
      "2025-03-30",
      "2025-03-31",
      "2025-04-01",
      "2025-04-02",
    ]);
  });

  it("returns a single date when start == end", () => {
    expect(eachLocalDate("2025-07-15", "2025-07-15")).toEqual(["2025-07-15"]);
  });
});

describe("tzOffsetMinutes", () => {
  it("is +120 in summer and +60 in winter for Europe/Tirane", () => {
    expect(tzOffsetMinutes(new Date("2025-07-15T12:00:00.000Z"), TZ)).toBe(120);
    expect(tzOffsetMinutes(new Date("2025-01-15T12:00:00.000Z"), TZ)).toBe(60);
  });
});
