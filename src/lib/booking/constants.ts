import type { BookingRules } from "./types";

export const MINUTES_PER_DAY = 1440;

// Hard cap on a single public availability query's span, so an anonymous request
// can't ask for a multi-year range and spin CPU. The effective range is
// min(business advance window, this).
export const MAX_AVAILABILITY_RANGE_DAYS = 60;

// Safety fallback for a business with no booking_rules row. create_business
// seeds the business-default row (migration 0007), so in normal operation this
// is never hit — resolveRules warns if it is. Values MUST stay in sync with the
// booking_rules column defaults; the parity test in __tests__ enforces it.
export const DEFAULT_BOOKING_RULES: BookingRules = {
  slotGranularityMin: 15,
  leadTimeMin: 120,
  advanceWindowDays: 60,
};
