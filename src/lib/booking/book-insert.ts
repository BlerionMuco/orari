import "server-only";
import { db } from "@/db/client";
import {
  bookings,
  bookingServices,
  outbox,
  BookingStatus,
  type Booking,
} from "@/db/schema";
import type { BundleItem } from "./service-bundle";

// The exact column set both booking paths insert. `status` is forced to
// "confirmed" inside the helper; `reserved_range` is trigger-maintained (0006).
// `serviceId` is the PRIMARY service (the position-0 item); `services` is the
// full ordered basket persisted to booking_services. `beforeBufferMin` /
// `afterBufferMin` are the block's aggregate buffers (first.before / last.after).
export interface NewBookingValues {
  businessId: string;
  resourceId: string;
  serviceId: string;
  services: BundleItem[]; // execution order; services[0].serviceId === serviceId
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

// Insert one confirmed booking, its per-service booking_services snapshots, AND
// its `booking_confirmed` outbox row — all in the SAME transaction. Both booking
// paths (specific resource + "any available") route through here, so invariant 6
// (every booking enqueues the outbox row) and the full-basket persistence are
// structural — a new path physically cannot forget either. Lets the EXCLUDE
// constraint resolve the double-booking race (SQLSTATE 23P01); callers catch and
// branch on it. Throws on any DB error (no internal catch).
export async function insertConfirmedBooking(
  values: NewBookingValues,
): Promise<Booking> {
  // Invariant: the booking's denormalized primary service is the position-0
  // junction row. Guard here so the two homes for that one fact can't drift.
  if (
    values.services.length === 0 ||
    values.services[0].serviceId !== values.serviceId
  ) {
    throw new Error(
      "insertConfirmedBooking: serviceId must equal services[0].serviceId (primary invariant)",
    );
  }

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
        status: BookingStatus.CONFIRMED,
        beforeBufferMin: values.beforeBufferMin,
        afterBufferMin: values.afterBufferMin,
        manageToken: values.manageToken,
        idempotencyKey: values.idempotencyKey,
        notes: values.notes,
      })
      .returning();

    await tx.insert(bookingServices).values(
      values.services.map((s) => ({
        bookingId: row.id,
        businessId: values.businessId,
        serviceId: s.serviceId,
        name: s.name,
        durationMin: s.durationMin,
        priceCents: s.priceCents,
        beforeBufferMin: s.beforeBufferMin,
        afterBufferMin: s.afterBufferMin,
        position: s.position,
      })),
    );

    await tx.insert(outbox).values({
      type: "booking_confirmed",
      payload: { bookingId: row.id, startsAt: values.startsAt.toISOString() },
    });

    return row;
  });
}
