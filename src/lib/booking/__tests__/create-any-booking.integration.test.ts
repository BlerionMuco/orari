// DB-touching integration tests for the multi-resource ("Any available") engine
// paths. Skipped unless RUN_DB_TESTS is set. Point DATABASE_URL at a THROWAWAY
// Postgres, migrate it, then:
//   RUN_DB_TESTS=1 pnpm vitest run create-any-booking.integration
//
// Each describe seeds an isolated temp business and tears it down (cascade).
import { describe, it, expect, beforeAll, afterAll } from "vitest";
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
  BookingStatus,
} from "@/db/schema";
import { createAnyBooking } from "@/lib/booking/create-any-booking";
import { BookingFailureCode } from "@/lib/booking/booking-codes";
import {
  getAvailableSlots,
  getUnionAvailability,
} from "@/lib/booking/get-available-slots";
import {
  addDaysToIsoDate,
  localIsoDate,
  localWeekday,
} from "@/lib/booking/time";

const RUN = Boolean(process.env.RUN_DB_TESTS);
const TZ = "Europe/Tirane";

interface OutboxPayload {
  bookingId?: string;
}

describe.skipIf(!RUN)("createAnyBooking (integration)", () => {
  let businessId = "";
  let resourceAId = "";
  let resourceBId = "";
  let serviceId = "";
  let target = "";
  const testStart = new Date();

  beforeAll(async () => {
    const [business] = await db
      .insert(businesses)
      .values({
        slug: `test-any-${crypto.randomUUID().slice(0, 8)}`,
        name: "Any Co",
        vertical: "barber",
        timezone: TZ,
      })
      .returning();
    businessId = business.id;

    const [a, b] = await db
      .insert(resources)
      .values([
        { businessId, type: "staff", name: "Barber A" },
        { businessId, type: "staff", name: "Barber B" },
      ])
      .returning();
    resourceAId = a.id;
    resourceBId = b.id;

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

    // Both barbers: every weekday 09:00–17:00 (identical, overlapping hours).
    await db.insert(workingHours).values(
      [resourceAId, resourceBId].flatMap((resourceId) =>
        [0, 1, 2, 3, 4, 5, 6].map((weekday) => ({
          resourceId,
          weekday,
          startMinute: 540,
          endMinute: 1020,
        })),
      ),
    );

    await db.insert(bookingRules).values({
      businessId,
      serviceId: null,
      leadTimeMin: 0,
      advanceWindowDays: 365,
      slotGranularityMin: 30,
    });

    target = addDaysToIsoDate(localIsoDate(new Date(), TZ), 40);
  }, 30_000);

  afterAll(async () => {
    if (businessId) {
      await db.delete(outbox).where(gte(outbox.createdAt, testStart));
      await db.delete(businesses).where(eq(businesses.id, businessId));
    }
  }, 30_000);

  function anyInput(startsAt: Date, idempotencyKey?: string) {
    return {
      businessId,
      serviceIds: [serviceId],
      startsAt,
      customerName: "Test Customer",
      customerPhone: "+355690000000",
      idempotencyKey,
    };
  }

  async function unionStartAt(index: number): Promise<Date> {
    const { slots } = await getUnionAvailability({
      businessId,
      serviceIds: [serviceId],
      rangeStartDate: target,
      rangeEndDate: target,
    });
    expect(slots.length).toBeGreaterThan(index);
    return slots[index].startUtc;
  }

  it("assigns a concrete free resource and echoes its name", async () => {
    const res = await createAnyBooking(anyInput(await unionStartAt(0)));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    expect([resourceAId, resourceBId]).toContain(res.resource.id);
    expect(res.resource.name.length).toBeGreaterThan(0);

    const [row] = await db
      .select()
      .from(bookings)
      .where(eq(bookings.id, res.bookingId));
    expect(row.resourceId).toBe(res.resource.id);
    expect(row.status).toBe(BookingStatus.CONFIRMED);
  }, 20_000);

  it("spreads two same-time bookings across both resources, then slot-taken", async () => {
    // Sequential (deterministic): the 2nd sees the 1st as busy and picks the
    // other barber; the 3rd finds none free → slot-taken.
    const startsAt = await unionStartAt(1);
    const first = await createAnyBooking(anyInput(startsAt));
    const second = await createAnyBooking(anyInput(startsAt));
    const third = await createAnyBooking(anyInput(startsAt));

    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.resource.id).not.toBe(first.resource.id);
      expect(new Set([first.resource.id, second.resource.id])).toEqual(
        new Set([resourceAId, resourceBId]),
      );
    }
    expect(third.ok).toBe(false);
    if (!third.ok) expect(third.code).toBe(BookingFailureCode.SLOT_TAKEN);
  }, 20_000);

  it("is idempotent for a repeated key — one booking, never a second barber", async () => {
    const key = `idem-${crypto.randomUUID()}`;
    const startsAt = await unionStartAt(2);
    const first = await createAnyBooking(anyInput(startsAt, key));
    const second = await createAnyBooking(anyInput(startsAt, key));

    expect(first.ok && second.ok).toBe(true);
    if (first.ok && second.ok) {
      expect(second.bookingId).toBe(first.bookingId);
      expect(second.resource.id).toBe(first.resource.id);
    }

    const rows = await db
      .select()
      .from(bookings)
      .where(eq(bookings.idempotencyKey, key));
    expect(rows.length).toBe(1);
  }, 20_000);

  it("enqueues a booking_confirmed outbox row (invariant 6)", async () => {
    const res = await createAnyBooking(anyInput(await unionStartAt(3)));
    expect(res.ok).toBe(true);
    if (!res.ok) return;

    const out = await db
      .select()
      .from(outbox)
      .where(gte(outbox.createdAt, testStart));
    const match = out.find(
      (o) =>
        o.type === "booking_confirmed" &&
        (o.payload as OutboxPayload).bookingId === res.bookingId,
    );
    expect(match).toBeTruthy();
  }, 20_000);
});

describe.skipIf(!RUN)("getUnionAvailability (integration)", () => {
  let businessId = "";
  let resourceAId = "";
  let resourceBId = "";
  let serviceId = "";
  let target = "";

  beforeAll(async () => {
    const [business] = await db
      .insert(businesses)
      .values({
        slug: `test-union-${crypto.randomUUID().slice(0, 8)}`,
        name: "Union Co",
        vertical: "barber",
        timezone: TZ,
      })
      .returning();
    businessId = business.id;

    const [a, b] = await db
      .insert(resources)
      .values([
        { businessId, type: "staff", name: "Morning A" },
        { businessId, type: "staff", name: "Late B" },
      ])
      .returning();
    resourceAId = a.id;
    resourceBId = b.id;

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

    // DIFFERENT hours per resource on the SAME target weekday: A 09:00–10:00,
    // B 10:00–11:00. The union must reflect both, not collapse to one calendar.
    target = addDaysToIsoDate(localIsoDate(new Date(), TZ), 40);
    const weekday = localWeekday(target, TZ);
    await db.insert(workingHours).values([
      { resourceId: resourceAId, weekday, startMinute: 540, endMinute: 600 },
      { resourceId: resourceBId, weekday, startMinute: 600, endMinute: 660 },
    ]);

    await db.insert(bookingRules).values({
      businessId,
      serviceId: null,
      leadTimeMin: 0,
      advanceWindowDays: 365,
      slotGranularityMin: 30,
    });
  }, 30_000);

  afterAll(async () => {
    if (businessId) {
      await db.delete(businesses).where(eq(businesses.id, businessId));
    }
  }, 30_000);

  it("reflects each resource's own hours (not a merged calendar)", async () => {
    const { slots } = await getUnionAvailability({
      businessId,
      serviceIds: [serviceId],
      rangeStartDate: target,
      rangeEndDate: target,
    });
    const labels = slots.map((s) => s.localTimeLabel);
    // 09:00/09:30 come only from A; 10:00/10:30 only from B.
    expect(labels).toContain("09:00");
    expect(labels).toContain("10:00");

    const aOnly = await getAvailableSlots({
      businessId,
      resourceId: resourceAId,
      serviceIds: [serviceId],
      rangeStartDate: target,
      rangeEndDate: target,
    });
    expect(aOnly.slots.map((s) => s.localTimeLabel)).not.toContain("10:00");
  });

  it("excludes inactive resources from the union", async () => {
    await db
      .update(resources)
      .set({ active: false })
      .where(eq(resources.id, resourceBId));
    const { slots } = await getUnionAvailability({
      businessId,
      serviceIds: [serviceId],
      rangeStartDate: target,
      rangeEndDate: target,
    });
    expect(slots.map((s) => s.localTimeLabel)).not.toContain("10:00");
  });
});
