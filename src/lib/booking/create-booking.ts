import "server-only";
import { db } from "@/db/client";
import { bookings, outbox, type Booking } from "@/db/schema";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import { MINUTES_PER_DAY } from "./constants";
import { validateSlot } from "./availability";
import {
  findByIdempotencyKey,
  loadBusyIntervals,
  loadResourceContext,
  loadWorkingWindows,
} from "./queries";

export type CreateBookingFailureCode =
  | "not-found"
  | "slot-unavailable"
  | "slot-taken"
  | "unknown";

export interface CreateBookingSuccess {
  ok: true;
  bookingId: string;
  manageToken: string;
  startsAt: Date;
  endsAt: Date;
}

export interface CreateBookingFailure {
  ok: false;
  code: CreateBookingFailureCode;
  error: string;
}

export type CreateBookingResult = CreateBookingSuccess | CreateBookingFailure;

function isPgError(e: unknown): e is { code: string } {
  return e instanceof Error && "code" in e;
}

// Postgres returns the violated constraint's name. postgres-js spells it
// `constraint_name`; read both spellings defensively so the disambiguation is
// robust to the driver.
function pgConstraintName(e: unknown): string {
  if (e && typeof e === "object") {
    const rec = e as Record<string, unknown>;
    const v = rec.constraint_name ?? rec.constraint;
    if (typeof v === "string") return v;
  }
  return "";
}

function success(b: Booking): CreateBookingSuccess {
  return {
    ok: true,
    bookingId: b.id,
    manageToken: b.manageToken,
    startsAt: b.startsAt,
    endsAt: b.endsAt,
  };
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
    if (existing) return success(existing);
  }

  const ctx = await loadResourceContext(
    input.businessId,
    input.resourceId,
    input.serviceId,
  );
  if (!ctx) {
    return {
      ok: false,
      code: "not-found",
      error: "This service is no longer available.",
    };
  }

  const { business, resource, service, rules } = ctx;
  const timeZone = business.timezone;
  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + service.durationMin * 60_000);
  const now = new Date();

  const padMs =
    (service.beforeBufferMin + service.afterBufferMin + MINUTES_PER_DAY) *
    60_000;
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
    durationMin: service.durationMin,
    beforeBufferMin: service.beforeBufferMin,
    afterBufferMin: service.afterBufferMin,
    rules,
    workingWindows,
    busy,
    now,
  });
  if (!validity.ok) {
    return {
      ok: false,
      code: "slot-unavailable",
      error: "That time isn't available anymore.",
    };
  }

  // Up to two attempts so a cosmetic manage_token collision can regenerate.
  for (let attempt = 0; attempt < 2; attempt++) {
    const manageToken = crypto.randomUUID();
    try {
      const bookingId = await db.transaction(async (tx) => {
        const [row] = await tx
          .insert(bookings)
          .values({
            businessId: business.id,
            resourceId: resource.id,
            serviceId: service.id,
            customerName: input.customerName,
            customerPhone: input.customerPhone,
            customerEmail: input.customerEmail ?? null,
            startsAt,
            endsAt,
            status: "confirmed",
            beforeBufferMin: service.beforeBufferMin,
            afterBufferMin: service.afterBufferMin,
            manageToken,
            idempotencyKey: input.idempotencyKey ?? null,
            notes: input.notes ?? null,
          })
          .returning({ id: bookings.id });

        await tx.insert(outbox).values({
          type: "booking_confirmed",
          payload: { bookingId: row.id, startsAt: startsAt.toISOString() },
        });

        return row.id;
      });

      return { ok: true, bookingId, manageToken, startsAt, endsAt };
    } catch (e) {
      if (isPgError(e) && e.code === "23P01") {
        return {
          ok: false,
          code: "slot-taken",
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
          if (existing) return success(existing);
        } else if (constraint.includes("manage_token")) {
          continue; // regenerate and retry
        }
      }
      console.error("[create-booking] insert failed:", e);
      return {
        ok: false,
        code: "unknown",
        error: "Could not complete your booking. Please try again.",
      };
    }
  }

  return {
    ok: false,
    code: "unknown",
    error: "Could not complete your booking. Please try again.",
  };
}
