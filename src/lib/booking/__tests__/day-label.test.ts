import { describe, it, expect } from "vitest";
import { dayLabel } from "../day-label";

describe("dayLabel", () => {
  const today = "2026-06-18"; // a Thursday

  it("labels today and tomorrow", () => {
    expect(dayLabel("2026-06-18", today)).toBe("Today");
    expect(dayLabel("2026-06-19", today)).toBe("Tomorrow");
  });

  it("labels other days by short weekday", () => {
    expect(dayLabel("2026-06-20", today)).toBe("Sat");
    expect(dayLabel("2026-06-21", today)).toBe("Sun");
    expect(dayLabel("2026-06-22", today)).toBe("Mon");
  });

  it("crosses month boundaries correctly", () => {
    expect(dayLabel("2026-07-01", "2026-06-30")).toBe("Tomorrow");
  });
});
