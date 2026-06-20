import type { BookingRules } from "./types";

export const MINUTES_PER_DAY = 1440;

// Hard cap on a single public availability query's span, so an anonymous request
// can't ask for a multi-year range and spin CPU. The effective range is
// min(business advance window, this).
export const MAX_AVAILABILITY_RANGE_DAYS = 60;

// Default span the public availability fetch returns when the client doesn't pin
// an explicit end. The server owns the date window (invariant 3): clients send a
// day COUNT, never dates. Clamped to MAX_AVAILABILITY_RANGE_DAYS.
export const PUBLIC_AVAILABILITY_WINDOW_DAYS = 14;

// Safety fallback for a business with no booking_rules row. create_business
// seeds the business-default row (migration 0007), so in normal operation this
// is never hit — resolveRulesForServices warns if it is. Values MUST stay in sync with the
// booking_rules column defaults; the parity test in __tests__ enforces it.
export const DEFAULT_BOOKING_RULES: BookingRules = {
  slotGranularityMin: 15,
  leadTimeMin: 120,
  advanceWindowDays: 60,
};
