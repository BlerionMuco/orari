import "server-only";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import { normalizePhone } from "@/lib/business/phone";
import { MINUTES_PER_DAY } from "./constants";
import { validateSlot } from "./availability";
import { buildServiceBundle } from "./service-bundle";
import { insertConfirmedBooking } from "./book-insert";
import { isPgError, pgConstraintName } from "./pg-errors";
import {
  BookingFailureCode,
  type CreateBookingFailureCode,
} from "./booking-codes";
import {
  findByIdempotencyKey,
  getResourceById,
  loadBusyIntervals,
  loadResourceContext,
  loadWorkingWindows,
} from "./queries";
import type { Booking } from "@/db/schema";

export type { CreateBookingFailureCode };

// The assigned resource, echoed back so the confirmation can name the barber
// (essential for "Any available", where the client didn't pick one).
export interface AssignedResource {
  id: string;
  name: string;
}

export interface CreateBookingSuccess {
  ok: true;
  bookingId: string;
  manageToken: string;
  startsAt: Date;
  endsAt: Date;
  resource: AssignedResource;
}

export interface CreateBookingFailure {
  ok: false;
  code: CreateBookingFailureCode;
  error: string;
}

export type CreateBookingResult = CreateBookingSuccess | CreateBookingFailure;

export function success(
  b: Booking,
  resource: AssignedResource,
): CreateBookingSuccess {
  return {
    ok: true,
    bookingId: b.id,
    manageToken: b.manageToken,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
    resource,
  };
}

// Idempotent replay path: rebuild the success result for an already-stored
// booking, resolving its assigned resource's name for the confirmation.
export async function replaySuccess(
  businessId: string,
  existing: Booking,
): Promise<CreateBookingSuccess> {
  const r = await getResourceById(businessId, existing.resourceId);
  return success(existing, {
    id: existing.resourceId,
    name: r?.name ?? "",
  });
}

// Create a confirmed booking. Re-derives the end and buffers server-side,
// re-validates the slot, then inserts inside a transaction and lets the DB
// EXCLUDE constraint resolve the double-booking race (SQLSTATE 23P01). Side
// effects (email, reminder) are enqueued to the outbox in the same transaction
// and processed post-commit by the drainer — never inline.
export async function createBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  // Idempotent replay: a repeated key returns the existing booking (scoped to
  // the business being booked).
  if (input.idempotencyKey) {
    const existing = await findByIdempotencyKey(
      input.businessId,
      input.idempotencyKey,
    );
    if (existing) return replaySuccess(input.businessId, existing);
  }

  // This path books a specific resource. "Any available" (no resourceId) is the
  // separate createAnyBooking orchestration; the action routes to it.
  if (!input.resourceId) {
    return {
      ok: false,
      code: BookingFailureCode.NOT_FOUND,
      error: "This service is no longer available.",
    };
  }

  const ctx = await loadResourceContext(
    input.businessId,
    input.resourceId,
    input.serviceIds,
  );
  if (!ctx) {
    return {
      ok: false,
      code: BookingFailureCode.NOT_FOUND,
      error: "This service is no longer available.",
    };
  }

  const { business, resource, services, rules } = ctx;
  const bundle = buildServiceBundle(services);
  const timeZone = business.timezone;

  const phone = normalizePhone(
    input.customerPhone,
    business.location?.countryCode ?? "AL",
  );
  if (!phone.valid) {
    return {
      ok: false,
      code: BookingFailureCode.INVALID_PHONE,
      error: "Enter a valid phone number.",
    };
  }

  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + bundle.totalDurationMin * 60_000);
  const now = new Date();

  const padMs =
    (bundle.beforeBufferMin + bundle.afterBufferMin + MINUTES_PER_DAY) * 60_000;
  const [workingWindows, busy] = await Promise.all([
    loadWorkingWindows(resource.id),
    loadBusyIntervals(
      business.id,
      resource.id,
      new Date(startsAt.getTime() - padMs),
      new Date(endsAt.getTime() + padMs),
    ),
  ]);

  const validity = validateSlot({
    resourceId: resource.id,
    startUtc: startsAt,
    timeZone,
    durationMin: bundle.totalDurationMin,
    beforeBufferMin: bundle.beforeBufferMin,
    afterBufferMin: bundle.afterBufferMin,
    rules,
    workingWindows,
    busy,
    now,
  });
  if (!validity.ok) {
    return {
      ok: false,
      code: BookingFailureCode.SLOT_UNAVAILABLE,
      error: "That time isn't available anymore.",
    };
  }

  const assigned: AssignedResource = { id: resource.id, name: resource.name };

  // Up to two attempts so a cosmetic manage_token collision can regenerate.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const row = await insertConfirmedBooking({
        businessId: business.id,
        resourceId: resource.id,
        serviceId: bundle.items[0].serviceId, // primary (position 0)
        services: bundle.items,
        customerName: input.customerName,
        customerPhone: phone.e164,
        customerEmail: input.customerEmail ?? null,
        startsAt,
        endsAt,
        beforeBufferMin: bundle.beforeBufferMin,
        afterBufferMin: bundle.afterBufferMin,
        manageToken: crypto.randomUUID(),
        idempotencyKey: input.idempotencyKey ?? null,
        notes: input.notes ?? null,
      });

      return success(row, assigned);
    } catch (e) {
      if (isPgError(e) && e.code === "23P01") {
        return {
          ok: false,
          code: BookingFailureCode.SLOT_TAKEN,
          error: "Sorry — that slot was just taken. Pick another time.",
        };
      }
      if (isPgError(e) && e.code === "23505") {
        const constraint = pgConstraintName(e);
        if (constraint.includes("idempotency")) {
          // A concurrent request with the same key won the insert.
          const existing = input.idempotencyKey
            ? await findByIdempotencyKey(business.id, input.idempotencyKey)
            : null;
          if (existing) return success(existing, assigned);
        } else if (constraint.includes("manage_token")) {
          continue; // regenerate and retry
        }
      }
      console.error("[create-booking] insert failed:", e);
      return {
        ok: false,
        code: BookingFailureCode.UNKNOWN,
        error: "Could not complete your booking. Please try again.",
      };
    }
  }

  return {
    ok: false,
    code: BookingFailureCode.UNKNOWN,
    error: "Could not complete your booking. Please try again.",
  };
}
