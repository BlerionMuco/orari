import "server-only";
import { db } from "@/db/client";
import { bookings, outbox, type Booking } from "@/db/schema";

// The exact column set both booking paths insert. `status` is forced to
// "confirmed" inside the helper; `reserved_range` is trigger-maintained (0006).
export interface NewBookingValues {
  businessId: string;
  resourceId: string;
  serviceId: string;
  customerName: string;
  customerPhone: string; // already normalized to E.164
  customerEmail: string | null;
  startsAt: Date;
  endsAt: Date;
  beforeBufferMin: number;
  afterBufferMin: number;
  manageToken: string;
  idempotencyKey: string | null;
  notes: string | null;
}

// Insert one confirmed booking AND enqueue its `booking_confirmed` outbox row in
// the SAME transaction. Both booking paths (specific resource + "any available")
// route through here, so invariant 6 (every booking enqueues the outbox row) is
// structural — a new path physically cannot forget it. Lets the EXCLUDE
// constraint resolve the double-booking race (SQLSTATE 23P01); callers catch and
// branch on it. Throws on any DB error (no internal catch).
export async function insertConfirmedBooking(
  values: NewBookingValues,
): Promise<Booking> {
  return db.transaction(async (tx) => {
    const [row] = await tx
      .insert(bookings)
      .values({
        businessId: values.businessId,
        resourceId: values.resourceId,
        serviceId: values.serviceId,
        customerName: values.customerName,
        customerPhone: values.customerPhone,
        customerEmail: values.customerEmail,
        startsAt: values.startsAt,
        endsAt: values.endsAt,
        status: "confirmed",
        beforeBufferMin: values.beforeBufferMin,
        afterBufferMin: values.afterBufferMin,
        manageToken: values.manageToken,
        idempotencyKey: values.idempotencyKey,
        notes: values.notes,
      })
      .returning();

    await tx.insert(outbox).values({
      type: "booking_confirmed",
      payload: { bookingId: row.id, startsAt: values.startsAt.toISOString() },
    });

    return row;
  });
}
