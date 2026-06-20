// Failure codes for the create-booking paths. Pure (no `server-only`) so both
// the engine and client components (e.g. the confirm hook branching on a taken
// slot) reference the same named values instead of bare string literals.
export const BookingFailureCode = {
  NOT_FOUND: "not-found",
  INVALID_PHONE: "invalid-phone",
  SLOT_UNAVAILABLE: "slot-unavailable",
  SLOT_TAKEN: "slot-taken",
  UNKNOWN: "unknown",
} as const;

export type CreateBookingFailureCode =
  (typeof BookingFailureCode)[keyof typeof BookingFailureCode];

// Failure codes for the cancel path.
export const CancelFailureCode = {
  NOT_FOUND: "not-found",
  TOO_LATE: "too-late", // past start — no rebook-by-cancel on a bygone slot
  NOT_CANCELLABLE: "not-cancellable", // completed / no_show — terminal
  UNKNOWN: "unknown",
} as const;

export type CancelBookingFailureCode =
  (typeof CancelFailureCode)[keyof typeof CancelFailureCode];

// App-level outcome of a cancel (distinct from the DB booking status): the
// booking was cancelled now, or was already cancelled (idempotent replay).
export const CancelOutcome = {
  CANCELLED: "cancelled",
  ALREADY_CANCELLED: "already-cancelled",
} as const;

export type CancelOutcome = (typeof CancelOutcome)[keyof typeof CancelOutcome];
