// DB-touching integration tests for cancellation. Skipped unless RUN_DB_TESTS.
//   RUN_DB_TESTS=1 pnpm vitest run cancel-booking.integration
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businesses,
  resources,
  services,
  workingHours,
  bookingRules,
  bookings,
} from "@/db/schema";
import { createBooking } from "@/lib/booking/create-booking";
import { cancelBooking } from "@/lib/booking/cancel-booking";
import { getAvailableSlots } from "@/lib/booking/get-available-slots";
import { addDaysToIsoDate, localIsoDate } from "@/lib/booking/time";

const RUN = Boolean(process.env.RUN_DB_TESTS);
const TZ = "Europe/Tirane";

describe.skipIf(!RUN)("cancelBooking (integration)", () => {
  let businessId = "";
  let resourceId = "";
  let serviceId = "";
  let target = "";

  beforeAll(async () => {
    const [business] = await db
      .insert(businesses)
      .values({
        slug: `test-cancel-${crypto.randomUUID().slice(0, 8)}`,
        name: "Cancel Co",
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

    target = addDaysToIsoDate(localIsoDate(new Date(), TZ), 40);
  }, 30_000);

  afterAll(async () => {
    if (businessId) {
      await db.delete(businesses).where(eq(businesses.id, businessId));
    }
  }, 30_000);

  async function firstSlotStart(): Promise<Date> {
    const { slots } = await getAvailableSlots({
      businessId,
      resourceId,
      serviceId,
      rangeStartDate: target,
      rangeEndDate: target,
    });
    expect(slots.length).toBeGreaterThan(0);
    return slots[0].startUtc;
  }

  function input(startsAt: Date) {
    return {
      businessId,
      resourceId,
      serviceId,
      startsAt,
      customerName: "Test Customer",
      customerPhone: "+355690000000",
    };
  }

  it("cancels a future confirmed booking and frees the slot", async () => {
    const startsAt = await firstSlotStart();
    const created = await createBooking(input(startsAt));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    // Slot is now occupied.
    const taken = await createBooking(input(startsAt));
    expect(taken.ok).toBe(false);

    const cancelled = await cancelBooking(created.manageToken);
    expect(cancelled).toEqual({ ok: true, status: "cancelled" });

    // Freed: rebookable, with a new booking id.
    const rebooked = await createBooking(input(startsAt));
    expect(rebooked.ok).toBe(true);
    if (rebooked.ok) expect(rebooked.bookingId).not.toBe(created.bookingId);
  }, 20_000);

  it("is idempotent on a second cancel", async () => {
    const created = await createBooking(input(await firstSlotStart()));
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const once = await cancelBooking(created.manageToken);
    const twice = await cancelBooking(created.manageToken);
    expect(once.ok).toBe(true);
    expect(twice).toEqual({ ok: true, status: "already-cancelled" });
  }, 20_000);

  it("rejects cancelling a past booking", async () => {
    const token = crypto.randomUUID();
    await db.insert(bookings).values({
      businessId,
      resourceId,
      serviceId,
      customerName: "Past",
      customerPhone: "+355690000000",
      startsAt: new Date("2020-01-06T09:00:00Z"),
      endsAt: new Date("2020-01-06T09:30:00Z"),
      status: "confirmed",
      manageToken: token,
    });
    const res = await cancelBooking(token);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("too-late");
  });

  it("rejects cancelling a completed booking", async () => {
    const token = crypto.randomUUID();
    await db.insert(bookings).values({
      businessId,
      resourceId,
      serviceId,
      customerName: "Done",
      customerPhone: "+355690000000",
      startsAt: new Date("2099-01-06T09:00:00Z"),
      endsAt: new Date("2099-01-06T09:30:00Z"),
      status: "completed",
      manageToken: token,
    });
    const res = await cancelBooking(token);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("not-cancellable");
  });

  it("returns not-found for an unknown token", async () => {
    const res = await cancelBooking(`missing-${crypto.randomUUID()}`);
    expect(res.ok).toBe(false);
    if (!res.ok) expect(res.code).toBe("not-found");
  });
});
