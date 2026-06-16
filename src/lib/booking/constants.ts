import type { BookingRules } from "./types";

export const MINUTES_PER_DAY = 1440;

// Hard cap on a single public availability query's span, so an anonymous request
// can't ask for a multi-year range and spin CPU. The effective range is
// min(business advance window, this).
export const MAX_AVAILABILITY_RANGE_DAYS = 60;

// Fallback when a business has no booking_rules row yet (onboarding doesn't
// create one — see booking-engine.md).
export const DEFAULT_BOOKING_RULES: BookingRules = {
  slotGranularityMin: 15,
  leadTimeMin: 120,
  advanceWindowDays: 60,
};
