// Core booking-engine domain types. Every instant is a UTC `Date`; every
// `*Min` field is integer minutes. Pure modules (time.ts, availability.ts) and
// the query/mutation layers share these. No `any` anywhere.

// Booking rules resolved for a (business, service). Buffers are NOT here — they
// live on the service (before/after) and are snapshotted onto each booking.
export interface BookingRules {
  slotGranularityMin: number; // candidate stride from a window's start
  leadTimeMin: number; // earliest bookable = now + leadTimeMin
  advanceWindowDays: number; // latest bookable local day = today + this many days
}

// A recurring weekly availability window for a resource, in business-local time.
// `endMinute > 1440` means the window spills past local midnight into the next day.
export interface WorkingWindow {
  weekday: number; // 0 = Sun .. 6 = Sat (business-local)
  startMinute: number; // minutes from local midnight
  endMinute: number; // minutes from local midnight (> startMinute)
}

// A UTC half-open [start, end) interval the resource is NOT free. Bookings are
// buffer-expanded into these; time-off is used as-is.
export interface BusyInterval {
  start: Date;
  end: Date;
}

// One bookable slot. `startUtc` is the canonical instant we store.
export interface Slot {
  resourceId: string;
  startUtc: Date;
  endUtc: Date; // startUtc + service.durationMin
  isoDate: string; // business-local calendar date "YYYY-MM-DD" of the start
  localTimeLabel: string; // business-local "HH:mm" of the start
  startMinuteLocal: number; // minutes-from-local-midnight of the start
}

// Inputs to the pure per-resource slot generator.
export interface ResourceSlotInput {
  resourceId: string;
  isoDates: string[]; // business-local calendar dates to compute, inclusive
  timeZone: string; // IANA, e.g. "Europe/Tirane"
  durationMin: number;
  beforeBufferMin: number;
  afterBufferMin: number;
  rules: BookingRules;
  workingWindows: WorkingWindow[];
  busy: BusyInterval[];
  now: Date; // injected UTC "now"
}

export type SlotRejectionReason =
  | "outside-working-hours"
  | "before-lead-time"
  | "after-advance-window"
  | "overlaps-busy"
  | "not-a-generated-slot"
  | "nonexistent-local-time";

export interface SlotValidationResult {
  ok: boolean;
  reason?: SlotRejectionReason;
}

// Inputs to validate a single proposed start (used by create-booking).
export interface SlotValidationInput {
  resourceId: string;
  startUtc: Date;
  timeZone: string;
  durationMin: number;
  beforeBufferMin: number;
  afterBufferMin: number;
  rules: BookingRules;
  workingWindows: WorkingWindow[];
  busy: BusyInterval[];
  now: Date;
}
