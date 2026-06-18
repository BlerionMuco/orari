import { describe, it, expect } from "vitest";
import { groupSlotsByDay, formatPrice } from "../slots-view";
import type { AvailabilitySlot } from "../types";

function slot(isoDate: string, hhmm: string): AvailabilitySlot {
  // startUtc only needs to sort consistently with the label for these tests.
  return {
    startUtc: `${isoDate}T${hhmm}:00.000Z`,
    endUtc: `${isoDate}T${hhmm}:30.000Z`,
    isoDate,
    localTimeLabel: hhmm,
  };
}

describe("groupSlotsByDay", () => {
  it("groups by business-local day, days ordered chronologically", () => {
    const days = groupSlotsByDay([
      slot("2026-06-20", "10:00"),
      slot("2026-06-19", "09:00"),
      slot("2026-06-20", "09:30"),
    ]);
    expect(days.map((d) => d.isoDate)).toEqual(["2026-06-19", "2026-06-20"]);
  });

  it("orders chips within a day by start instant", () => {
    const [day] = groupSlotsByDay([
      slot("2026-06-19", "11:00"),
      slot("2026-06-19", "09:00"),
      slot("2026-06-19", "10:00"),
    ]);
    expect(day.slots.map((s) => s.localTimeLabel)).toEqual([
      "09:00",
      "10:00",
      "11:00",
    ]);
  });

  it("returns no days for an empty slot list", () => {
    expect(groupSlotsByDay([])).toEqual([]);
  });
});

describe("formatPrice", () => {
  it("returns Free at zero regardless of currency", () => {
    expect(formatPrice(0, "ALL")).toBe("Free");
    expect(formatPrice(0, "EUR")).toBe("Free");
  });

  it("formats ALL as whole Lek (exponent 0) with thousands grouping", () => {
    expect(formatPrice(2000, "ALL")).toBe("2,000 Lek");
    expect(formatPrice(500, "ALL")).toBe("500 Lek");
    expect(formatPrice(1500000, "ALL")).toBe("1,500,000 Lek");
  });

  it("formats EUR/USD with 2 decimals and leading symbol", () => {
    expect(formatPrice(2000, "EUR")).toBe("€20.00");
    expect(formatPrice(500, "USD")).toBe("$5.00");
    expect(formatPrice(123456, "EUR")).toBe("€1,234.56");
  });

  it("falls back to the code with 2 decimals for unknown currencies", () => {
    expect(formatPrice(2000, "chf")).toBe("CHF20.00");
  });
});
