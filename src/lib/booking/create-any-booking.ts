import "server-only";
import type { CreateBookingInput } from "@/lib/schemas/booking";
import { normalizePhone } from "@/lib/business/phone";
import type { Resource } from "@/db/schema";
import { MINUTES_PER_DAY } from "./constants";
import { validateSlot } from "./availability";
import { buildServiceBundle } from "./service-bundle";
import { insertConfirmedBooking } from "./book-insert";
import { isPgError, pgConstraintName } from "./pg-errors";
import { BookingFailureCode } from "./booking-codes";
import { localIsoDate, localPartsToUtc } from "./time";
import {
  countLiveBookingsPerResource,
  findByIdempotencyKey,
  loadActiveResources,
  loadBusyIntervals,
  loadServiceContext,
  loadWorkingWindows,
} from "./queries";
import {
  success,
  replaySuccess,
  type CreateBookingResult,
} from "./create-booking";

// "Any available" booking: pick a concrete free resource server-side and book
// it. A SEPARATE orchestration from createBooking (specific resource), but it
// shares the leaf insert (insertConfirmedBooking → outbox enqueue, invariant 6)
// and the success/replay builders, so behavior can't drift between paths.
//
// Order of operations is load-bearing (invariant 5):
//   1. idempotency early-return BEFORE any candidate selection/insert;
//   2. carry the key on EVERY candidate insert;
//   3. on 23P01 (slot exclusion) that candidate is taken → drop it, try the next
//      free resource; on 23505 (idempotency unique) a concurrent same-key request
//      beat us → re-fetch and return THAT booking, never advance to another
//      resource (else we'd book a second barber).
export async function createAnyBooking(
  input: CreateBookingInput,
): Promise<CreateBookingResult> {
  // (1) Idempotent replay precedes assignment.
  if (input.idempotencyKey) {
    const existing = await findByIdempotencyKey(
      input.businessId,
      input.idempotencyKey,
    );
    if (existing) return replaySuccess(input.businessId, existing);
  }

  const ctx = await loadServiceContext(input.businessId, input.serviceIds);
  if (!ctx) {
    return {
      ok: false,
      code: BookingFailureCode.NOT_FOUND,
      error: "This service is no longer available.",
    };
  }

  const { business, services, rules } = ctx;
  const bundle = buildServiceBundle(services);
  const timeZone = business.timezone;

  const phone = normalizePhone(
    input.customerPhone,
    business.location?.countryCode ?? "AL",
  );
  if (!phone.valid) {
    return { ok: false, code: BookingFailureCode.INVALID_PHONE, error: "Enter a valid phone number." };
  }

  const startsAt = input.startsAt;
  const endsAt = new Date(startsAt.getTime() + bundle.totalDurationMin * 60_000);
  const now = new Date();

  const candidates = await loadActiveResources(input.businessId);
  if (candidates.length === 0) {
    return {
      ok: false,
      code: BookingFailureCode.NOT_FOUND,
      error: "This service is no longer available.",
    };
  }

  // (b) Recompute live which candidates are actually free at this instant.
  const padMs =
    (bundle.beforeBufferMin + bundle.afterBufferMin + MINUTES_PER_DAY) * 60_000;
  const busyStart = new Date(startsAt.getTime() - padMs);
  const busyEnd = new Date(endsAt.getTime() + padMs);

  const checks = await Promise.all(
    candidates.map(async (resource) => {
      const [workingWindows, busy] = await Promise.all([
        loadWorkingWindows(resource.id),
        loadBusyIntervals(business.id, resource.id, busyStart, busyEnd),
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
      return { resource, free: validity.ok };
    }),
  );

  const free: Resource[] = checks.filter((c) => c.free).map((c) => c.resource);
  if (free.length === 0) {
    // No resource is free at this instant. The union only ever offered slots
    // that WERE free, so this means they were all taken since fetch → signal
    // slot-taken (not slot-unavailable) so the wizard refetches + reconciles the
    // selection rather than dead-ending on a form error.
    return {
      ok: false,
      code: BookingFailureCode.SLOT_TAKEN,
      error: "Sorry — that slot was just taken. Pick another time.",
    };
  }

  // (c) Order least-booked-that-(local)-date first, tie-break by stable id.
  const dayIso = localIsoDate(startsAt, timeZone);
  const dayStart = localPartsToUtc(dayIso, 0, timeZone).utc;
  const dayEnd = localPartsToUtc(dayIso, MINUTES_PER_DAY, timeZone).utc;
  const counts = await countLiveBookingsPerResource(
    business.id,
    free.map((r) => r.id),
    dayStart,
    dayEnd,
  );
  free.sort((a, b) => {
    const ca = counts.get(a.id) ?? 0;
    const cb = counts.get(b.id) ?? 0;
    if (ca !== cb) return ca - cb;
    return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  });

  // (d) Try candidates in order. Each insert is atomic via EXCLUDE — fairness is
  // best-effort, the constraint is the real guard.
  for (const resource of free) {
    // Inner loop only regenerates a colliding manage_token for the SAME resource.
    for (let tokenAttempt = 0; tokenAttempt < 2; tokenAttempt++) {
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
        return success(row, { id: resource.id, name: resource.name });
      } catch (e) {
        if (isPgError(e) && e.code === "23P01") {
          break; // this resource was just taken → next candidate
        }
        if (isPgError(e) && e.code === "23505") {
          const constraint = pgConstraintName(e);
          if (constraint.includes("idempotency")) {
            // A concurrent same-key request beat us past the early-return —
            // return ITS booking; do NOT advance to another resource.
            const existing = input.idempotencyKey
              ? await findByIdempotencyKey(business.id, input.idempotencyKey)
              : null;
            if (existing) return replaySuccess(business.id, existing);
          } else if (constraint.includes("manage_token")) {
            continue; // regenerate token, retry SAME resource
          }
        }
        console.error("[create-any-booking] insert failed:", e);
        return {
          ok: false,
          code: BookingFailureCode.UNKNOWN,
          error: "Could not complete your booking. Please try again.",
        };
      }
    }
  }

  // (exhausted) every free candidate was taken out from under us.
  return {
    ok: false,
    code: BookingFailureCode.SLOT_TAKEN,
    error: "Sorry — that slot was just taken. Pick another time.",
  };
}
