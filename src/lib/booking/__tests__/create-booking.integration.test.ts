// DB-touching integration tests. Skipped unless RUN_DB_TESTS is set, so the
// default `pnpm test` stays pure-unit. Point DATABASE_URL at a THROWAWAY
// Postgres (local docker or a test project), migrate it, then:
//   RUN_DB_TESTS=1 pnpm vitest run create-booking.integration
//
// Creates an isolated temp business and tears it down (cascade) afterwards.
import {
  describe,
  it,
  expect,
  beforeAll,
  afterAll,
} from "vitest";
import postgres from "postgres";
import { eq, gte } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businesses,
  resources,
  services,
  workingHours,
  bookingRules,
  bookings,
  outbox,
} from "@/db/schema";
import { getAvailableSlots } from "@/lib/booking/get-available-slots";
import { createBooking } from "@/lib/booking/create-booking";
import { addDaysToIsoDate, localIsoDate } from "@/lib/booking/time";
import type { Slot } from "@/lib/booking/types";

const RUN = Boolean(process.env.RUN_DB_TESTS);
const TZ = "Europe/Tirane";

interface PgErrorLike {
  code?: string;
}

describe.skipIf(!RUN)("create-booking (integration)", () => {
  let businessId = "";
  let resourceId = "";
  let serviceId = "";
  let slots: Slot[] = [];
  const testStart = new Date();

  beforeAll(async () => {
    const [business] = await db
      .insert(businesses)
      .values({
        slug: `test-engine-${crypto.randomUUID().slice(0, 8)}`,
        name: "Test Engine Co",
        vertical: "barber",
        timezone: TZ,
      })
      .returning();
    businessId = business.id;

    const [resource] = await db
      .insert(resources)
      .values({ businessId, type: "staff", name: "Tester" })
      .returning();
    resourceId = resource.id;

    const [service] = await db
      .insert(services)
      .values({
        businessId,
        name: "Cut",
        durationMin: 30,
        beforeBufferMin: 0,
        afterBufferMin: 0,
      })
      .returning();
    serviceId = service.id;

    // Every weekday 09:00–17:00 so any target date has slots.
    await db.insert(workingHours).values(
      [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
        resourceId,
        weekday,
        startMinute: 540,
        endMinute: 1020,
      })),
    );

    await db.insert(bookingRules).values({
      businessId,
      serviceId: null,
      leadTimeMin: 0,
      advanceWindowDays: 365,
      slotGranularityMin: 30,
    });

    // A target day comfortably in the future (past lead time).
    const target = addDaysToIsoDate(localIsoDate(new Date(), TZ), 40);
    const result = await getAvailableSlots({
      businessId,
      resourceId,
      serviceId,
      rangeStartDate: target,
      rangeEndDate: target,
    });
    slots = result.slots;
    expect(slots.length).toBeGreaterThan(6);
  }, 30_000);

  afterAll(async () => {
    if (businessId) {
      await db.delete(outbox).where(gte(outbox.createdAt, testStart));
      await db.delete(businesses).where(eq(businesses.id, businessId));
    }
  }, 30_000);

  function input(slot: Slot, idempotencyKey?: string) {
    return {
      businessId,
      resourceId,
      serviceId,
      startsAt: slot.startUtc,
      customerName: "Test Customer",
      customerPhone: "+355690000000",
      idempotencyKey,
    };
  }

  it("creates a confirmed booking and enqueues an outbox row", async () => {
    const res = await createBooking(input(slots[0]));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, res.bookingId));
    expect(row.status).toBe("confirmed");
    expect(row.endsAt.getTime() - row.startsAt.getTime()).toBe(30 * 60_000);

    const out = await db
      .select()
      .from(outbox)
      .where(gte(outbox.createdAt, testStart));
    expect(out.some((o) => o.type === "booking_confirmed")).toBe(true);
  });

  it("is idempotent for a repeated key", async () => {
    const key = `idem-${crypto.randomUUID()}`;
    const first = await createBooking(input(slots[1], key));
    const second = await createBooking(input(slots[1], key));
    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.bookingId).toBe(first.bookingId);
    }
  });

  it("rejects a slot that was already taken (re-validate)", async () => {
    const ok = await createBooking(input(slots[2]));
    expect(ok.ok).toBe(true);
    const again = await createBooking(input(slots[2]));
    expect(again.ok).toBe(false);
    if (!again.ok) expect(again.code).toBe("slot-unavailable");
  });

  it("allows adjacent zero-buffer slots (half-open)", async () => {
    const a = await createBooking(input(slots[3]));
    const b = await createBooking(input(slots[4]));
    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);
  });

  it("frees a cancelled slot for rebooking", async () => {
    const first = await createBooking(input(slots[5]));
    expect(first.ok).toBe(true);
    if (!first.ok) return;
    await db
      .update(bookings)
      .set({ status: "cancelled" })
      .where(eq(bookings.id, first.bookingId));
    const second = await createBooking(input(slots[5]));
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.bookingId).not.toBe(first.bookingId);
  });

  it("lets the EXCLUDE constraint win a true concurrent race (23P01)", async () => {
    // Two overlapping inserts on two real connections; exactly one survives.
    const raw = postgres(process.env.DATABASE_URL ?? "", { max: 2, prepare: false });
    try {
      const base = new Date("2027-01-04T09:00:00Z"); // a Monday, in-hours, untouched
      const mk = (offsetMin: number) =>
        raw`
          INSERT INTO bookings
            (business_id, resource_id, service_id, customer_name, customer_phone,
             starts_at, ends_at, status, before_buffer_min, after_buffer_min, manage_token)
          VALUES
            (${businessId}, ${resourceId}, ${serviceId}, 'Race', '+355690000000',
             ${new Date(base.getTime() + offsetMin * 60_000)},
             ${new Date(base.getTime() + (offsetMin + 30) * 60_000)},
             'confirmed', 0, 0, ${crypto.randomUUID()})
          RETURNING id`;

      const [a, b] = await Promise.allSettled([mk(0), mk(15)]); // overlap 09:15–09:30
      const fulfilled = [a, b].filter((r) => r.status === "fulfilled");
      const rejected = [a, b].filter(
        (r): r is PromiseRejectedResult => r.status === "rejected",
      );
      expect(fulfilled.length).toBe(1);
      expect(rejected.length).toBe(1);
      expect((rejected[0].reason as PgErrorLike).code).toBe("23P01");
    } finally {
      await raw.end();
    }
  });
});
