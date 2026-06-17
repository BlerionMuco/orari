import { describe, it, expect } from "vitest";
import { DEFAULT_BOOKING_RULES } from "../constants";

// DEFAULT_BOOKING_RULES is the safety fallback when a business has no
// booking_rules row. create_business seeds a real row using the DB column
// defaults (lead_time_min 120, advance_window_days 60, slot_granularity_min 15),
// so the constant must match those defaults or a row-less business would see
// different rules than a seeded one. This pins the two together.
describe("DEFAULT_BOOKING_RULES", () => {
  it("matches the booking_rules column defaults", () => {
    expect(DEFAULT_BOOKING_RULES).toEqual({
      slotGranularityMin: 15,
      leadTimeMin: 120,
      advanceWindowDays: 60,
    });
  });
});
