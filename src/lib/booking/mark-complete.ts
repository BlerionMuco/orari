import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, BookingStatus } from "@/db/schema";
import type { BusinessScope } from "@/lib/db/scoped";

export const MarkCompleteFailure = {
  NOT_FOUND: "not-found",
  NOT_COMPLETABLE: "not-completable",
  IN_FUTURE: "in-future",
} as const;
export type MarkCompleteFailureCode =
  (typeof MarkCompleteFailure)[keyof typeof MarkCompleteFailure];

export type MarkCompleteResult =
  | { ok: true; alreadyCompleted: boolean }
  | { ok: false; code: MarkCompleteFailureCode; error: string };

// Owner / staff transition: confirmed → completed. Tenant-scoped via the
// passed scope. Idempotent — already-completed is a success replay; terminal
// (cancelled / no_show) is rejected. The conditional UPDATE prevents a
// concurrent cancel from being clobbered. `now` is injected so unit tests can
// pin time; callers from the server-action layer pass `new Date()`.
export async function markBookingComplete(
  scope: BusinessScope,
  bookingId: string,
  now: Date,
): Promise<MarkCompleteResult> {
  const [booking] = await db
    .select({
      id: bookings.id,
      status: bookings.status,
      startsAt: bookings.startsAt,
    })
    .from(bookings)
    .where(scope.where("bookings", eq(bookings.id, bookingId)))
    .limit(1);

  if (!booking) {
    return {
      ok: false,
      code: MarkCompleteFailure.NOT_FOUND,
      error: "Booking not found.",
    };
  }
  if (booking.status === BookingStatus.COMPLETED) {
    return { ok: true, alreadyCompleted: true };
  }
  if (booking.status !== BookingStatus.CONFIRMED) {
    return {
      ok: false,
      code: MarkCompleteFailure.NOT_COMPLETABLE,
      error: "This booking can't be marked complete.",
    };
  }
  if (booking.startsAt.getTime() > now.getTime()) {
    return {
      ok: false,
      code: MarkCompleteFailure.IN_FUTURE,
      error: "This booking hasn't started yet.",
    };
  }

  const updated = await db
    .update(bookings)
    .set({ status: BookingStatus.COMPLETED })
    .where(
      scope.where(
        "bookings",
        eq(bookings.id, bookingId),
        inArray(bookings.status, [BookingStatus.CONFIRMED]),
      ),
    )
    .returning({ id: bookings.id });

  return updated.length > 0
    ? { ok: true, alreadyCompleted: false }
    : { ok: true, alreadyCompleted: true };
}
