import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, BookingStatus } from "@/db/schema";
import {
  CancelFailureCode,
  CancelOutcome,
  type CancelBookingFailureCode,
} from "./booking-codes";

export type { CancelBookingFailureCode };

export type CancelBookingResult =
  | { ok: true; status: CancelOutcome }
  | { ok: false; code: CancelBookingFailureCode; error: string };

// Cancel a booking via its manage token (the token IS the authorization — no
// account, so no business scope). Allowed for held/confirmed with a future
// start; already-cancelled is idempotent; completed/no_show or a past start is
// rejected. V1 has no minimum-notice window — cancel is permitted any time
// before `startsAt`. Leaving LIVE_STATUSES drops the row out of the EXCLUDE
// predicate, freeing the slot. No outbox row in V1 (notifications phase).
export async function cancelBooking(
  manageToken: string,
  now: Date = new Date(),
): Promise<CancelBookingResult> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.manageToken, manageToken))
    .limit(1);

  if (!booking) {
    return {
      ok: false,
      code: CancelFailureCode.NOT_FOUND,
      error: "This link is no longer valid.",
    };
  }

  if (booking.status === BookingStatus.CANCELLED) {
    return { ok: true, status: CancelOutcome.ALREADY_CANCELLED };
  }

  if (
    booking.status === BookingStatus.COMPLETED ||
    booking.status === BookingStatus.NO_SHOW
  ) {
    return {
      ok: false,
      code: CancelFailureCode.NOT_CANCELLABLE,
      error: "This booking can no longer be cancelled.",
    };
  }

  if (booking.startsAt.getTime() <= now.getTime()) {
    return {
      ok: false,
      code: CancelFailureCode.TOO_LATE,
      error: "This booking has already started and can't be cancelled.",
    };
  }

  // Conditional on still being live, so a concurrent cancel/complete can't be
  // clobbered — 0 rows means someone else moved it first (idempotent success).
  const updated = await db
    .update(bookings)
    .set({ status: BookingStatus.CANCELLED })
    .where(
      and(
        eq(bookings.id, booking.id),
        inArray(bookings.status, [BookingStatus.HELD, BookingStatus.CONFIRMED]),
      ),
    )
    .returning({ id: bookings.id });

  return updated.length > 0
    ? { ok: true, status: CancelOutcome.CANCELLED }
    : { ok: true, status: CancelOutcome.ALREADY_CANCELLED };
}
