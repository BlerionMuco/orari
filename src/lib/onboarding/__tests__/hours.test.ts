import { describe, it, expect } from "vitest";
import {
  hhmmToMinutes,
  minutesToHhmm,
  defaultWeeklyHours,
  expandSchedule,
} from "../hours";

describe("hhmm <-> minutes", () => {
  it("parses HH:MM to minutes", () => {
    expect(hhmmToMinutes("00:00")).toBe(0);
    expect(hhmmToMinutes("09:00")).toBe(540);
    expect(hhmmToMinutes("17:30")).toBe(1050);
    expect(hhmmToMinutes("23:30")).toBe(1410);
  });

  it("formats minutes to zero-padded HH:MM", () => {
    expect(minutesToHhmm(0)).toBe("00:00");
    expect(minutesToHhmm(540)).toBe("09:00");
    expect(minutesToHhmm(1410)).toBe("23:30");
  });

  it("round-trips", () => {
    for (const t of ["00:00", "08:15", "12:30", "23:30"]) {
      expect(minutesToHhmm(hhmmToMinutes(t))).toBe(t);
    }
  });
});

describe("defaultWeeklyHours", () => {
  it("has all 7 days in Sun..Sat order", () => {
    const h = defaultWeeklyHours();
    expect(h).toHaveLength(7);
    expect(h.map((d) => d.weekday)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("opens Mon–Fri 09:00–17:00 and closes the weekend", () => {
    const h = defaultWeeklyHours();
    expect(h.filter((d) => d.open).map((d) => d.weekday)).toEqual([1, 2, 3, 4, 5]);
    expect(h[0].open).toBe(false); // Sun
    expect(h[6].open).toBe(false); // Sat
    for (const d of h) {
      expect(d.start).toBe("09:00");
      expect(d.end).toBe("17:00");
    }
  });
});

describe("expandSchedule", () => {
  it("emits open days only, mapped to minutes", () => {
    const rows = expandSchedule(defaultWeeklyHours());
    expect(rows).toHaveLength(5);
    expect(rows).toContainEqual({ weekday: 1, startMinute: 540, endMinute: 1020 });
    expect(rows.every((r) => r.startMinute === 540 && r.endMinute === 1020)).toBe(
      true,
    );
  });

  it("omits closed days and respects custom times", () => {
    const rows = expandSchedule([
      { weekday: 0, open: false, start: "09:00", end: "17:00" },
      { weekday: 1, open: true, start: "08:30", end: "12:00" },
      { weekday: 2, open: true, start: "10:00", end: "18:30" },
      { weekday: 3, open: false, start: "09:00", end: "17:00" },
      { weekday: 4, open: false, start: "09:00", end: "17:00" },
      { weekday: 5, open: false, start: "09:00", end: "17:00" },
      { weekday: 6, open: false, start: "09:00", end: "17:00" },
    ]);
    expect(rows).toEqual([
      { weekday: 1, startMinute: 510, endMinute: 720 },
      { weekday: 2, startMinute: 600, endMinute: 1110 },
    ]);
  });
});
