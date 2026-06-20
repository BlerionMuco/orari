import { describe, it, expect } from "vitest";
import { buildIcsHref } from "../ics";

describe("buildIcsHref", () => {
  const href = buildIcsHref({
    title: "Haircut at Beni Barber",
    location: "Rruga e Kavajës 23, Tirana",
    startUtc: "2026-06-18T09:00:00.000Z",
    endUtc: "2026-06-18T09:30:00.000Z",
  });
  const decoded = decodeURIComponent(
    href.replace(/^data:text\/calendar;charset=utf-8,/, ""),
  );

  it("is a calendar data URL", () => {
    expect(href.startsWith("data:text/calendar;charset=utf-8,")).toBe(true);
  });

  it("stamps UTC start/end without separators", () => {
    expect(decoded).toContain("DTSTART:20260618T090000Z");
    expect(decoded).toContain("DTEND:20260618T093000Z");
  });

  it("wraps a single VEVENT with the summary", () => {
    expect(decoded).toContain("BEGIN:VEVENT");
    expect(decoded).toContain("END:VEVENT");
    expect(decoded).toContain("SUMMARY:Haircut at Beni Barber");
  });

  it("escapes commas in text fields", () => {
    expect(decoded).toContain("LOCATION:Rruga e Kavajës 23\\, Tirana");
  });
});
