import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, BookingStatus } from "@/db/schema";
import type { BusinessScope } from "@/lib/db/scoped";

export const MarkNoShowFailure = {
  NOT_FOUND: "not-found",
  NOT_MARKABLE: "not-markable",
  IN_FUTURE: "in-future",
} as const;
export type MarkNoShowFailureCode =
  (typeof MarkNoShowFailure)[keyof typeof MarkNoShowFailure];

export type MarkNoShowResult =
  | { ok: true; alreadyNoShow: boolean }
  | { ok: false; code: MarkNoShowFailureCode; error: string };

// Owner / staff transition: confirmed → no_show. Already-no_show is idempotent;
// completed / cancelled is terminal. Like cancel, the EXCLUDE constraint drops
// the row from its predicate once the status leaves the live set, so the slot
// is freed atomically. `now` is injected for testability.
export async function markBookingNoShow(
  scope: BusinessScope,
  bookingId: string,
  now: Date,
): Promise<MarkNoShowResult> {
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
      code: MarkNoShowFailure.NOT_FOUND,
      error: "Booking not found.",
    };
  }
  if (booking.status === BookingStatus.NO_SHOW) {
    return { ok: true, alreadyNoShow: true };
  }
  if (booking.status !== BookingStatus.CONFIRMED) {
    return {
      ok: false,
      code: MarkNoShowFailure.NOT_MARKABLE,
      error: "This booking can't be marked as a no-show.",
    };
  }
  if (booking.startsAt.getTime() > now.getTime()) {
    return {
      ok: false,
      code: MarkNoShowFailure.IN_FUTURE,
      error: "This booking hasn't started yet.",
    };
  }

  const updated = await db
    .update(bookings)
    .set({ status: BookingStatus.NO_SHOW })
    .where(
      scope.where(
        "bookings",
        eq(bookings.id, bookingId),
        inArray(bookings.status, [BookingStatus.CONFIRMED]),
      ),
    )
    .returning({ id: bookings.id });

  return updated.length > 0
    ? { ok: true, alreadyNoShow: false }
    : { ok: true, alreadyNoShow: true };
}
