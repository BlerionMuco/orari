import "server-only";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { bookings, BookingStatus } from "@/db/schema";
import type { BusinessScope } from "@/lib/db/scoped";
import { CancelFailureCode, CancelOutcome } from "./booking-codes";
import type { CancelBookingResult } from "./cancel-booking";

// Dashboard cancel: like cancelBooking() but tenant-scoped by business (the
// public path uses the manage token IS the authorization). Owner or staff can
// cancel any live booking belonging to their business. Past-start is still
// rejected — a started appointment becomes a no_show, not a cancel.
export async function cancelBookingScoped(
  scope: BusinessScope,
  bookingId: string,
  now: Date = new Date(),
): Promise<CancelBookingResult> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(scope.where("bookings", eq(bookings.id, bookingId)))
    .limit(1);

  if (!booking) {
    return {
      ok: false,
      code: CancelFailureCode.NOT_FOUND,
      error: "Booking not found.",
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
      error: "This booking has already started.",
    };
  }

  const updated = await db
    .update(bookings)
    .set({ status: BookingStatus.CANCELLED })
    .where(
      scope.where(
        "bookings",
        eq(bookings.id, bookingId),
        inArray(bookings.status, [BookingStatus.HELD, BookingStatus.CONFIRMED]),
      ),
    )
    .returning({ id: bookings.id });

  return updated.length > 0
    ? { ok: true, status: CancelOutcome.CANCELLED }
    : { ok: true, status: CancelOutcome.ALREADY_CANCELLED };
}
