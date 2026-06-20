import { describe, it, expect } from "vitest";
import { partOfDay, groupSlotsByPartOfDay } from "../slots-view";
import type { AvailabilitySlot } from "../types";

function slot(hhmm: string): AvailabilitySlot {
  return {
    startUtc: `2026-06-18T${hhmm}:00.000Z`,
    endUtc: `2026-06-18T${hhmm}:30.000Z`,
    isoDate: "2026-06-18",
    localTimeLabel: hhmm,
  };
}

describe("partOfDay", () => {
  it("buckets by business-local hour", () => {
    expect(partOfDay(9)).toBe("Morning");
    expect(partOfDay(11)).toBe("Morning");
    expect(partOfDay(12)).toBe("Afternoon");
    expect(partOfDay(16)).toBe("Afternoon");
    expect(partOfDay(17)).toBe("Evening");
    expect(partOfDay(20)).toBe("Evening");
  });
});

describe("groupSlotsByPartOfDay", () => {
  it("groups in Morning→Afternoon→Evening order, omitting empty parts", () => {
    const groups = groupSlotsByPartOfDay([
      slot("17:00"),
      slot("09:30"),
      slot("12:00"),
      slot("09:00"),
    ]);
    expect(groups.map((g) => g.title)).toEqual([
      "Morning",
      "Afternoon",
      "Evening",
    ]);
    expect(groups[0].slots.map((s) => s.localTimeLabel)).toEqual([
      "09:00",
      "09:30",
    ]);
  });

  it("omits a part with no slots", () => {
    const groups = groupSlotsByPartOfDay([slot("09:00"), slot("10:30")]);
    expect(groups.map((g) => g.title)).toEqual(["Morning"]);
  });

  it("returns nothing for an empty day", () => {
    expect(groupSlotsByPartOfDay([])).toEqual([]);
  });
});
