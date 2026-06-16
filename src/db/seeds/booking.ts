// Manual seed for verifying the booking engine. Onboarding doesn't create
// services / working_hours yet, so this fills them for the existing business +
// resource. Run with: pnpm tsx src/db/seeds/booking.ts
//
// dotenv must load before the db client (which validates env at import), so the
// db/schema imports are dynamic, after config().
import { config } from "dotenv";

config({ path: ".env.local" });
config();

async function main(): Promise<void> {
  const { eq } = await import("drizzle-orm");
  const { db } = await import("../client");
  const {
    businesses,
    resources,
    services,
    workingHours,
    timeOff,
    bookingRules,
  } = await import("../schema");

  const [business] = await db.select().from(businesses).limit(1);
  if (!business) throw new Error("No business found — run onboarding first.");

  const [resource] = await db
    .select()
    .from(resources)
    .where(eq(resources.businessId, business.id))
    .limit(1);
  if (!resource) throw new Error("No resource found for the business.");

  const [service] = await db
    .insert(services)
    .values({
      businessId: business.id,
      name: "Haircut",
      durationMin: 30,
      priceCents: 2000,
      beforeBufferMin: 0,
      afterBufferMin: 10,
    })
    .returning();

  // Mon–Fri 09:00–17:00, with Tuesday a split shift (lunch 12:00–13:00).
  const hours: Array<{
    resourceId: string;
    weekday: number;
    startMinute: number;
    endMinute: number;
  }> = [];
  for (const weekday of [1, 2, 3, 4, 5]) {
    if (weekday === 2) {
      hours.push(
        { resourceId: resource.id, weekday, startMinute: 540, endMinute: 720 },
        { resourceId: resource.id, weekday, startMinute: 780, endMinute: 1020 },
      );
    } else {
      hours.push({
        resourceId: resource.id,
        weekday,
        startMinute: 540,
        endMinute: 1020,
      });
    }
  }
  await db.insert(workingHours).values(hours);

  // A business-wide closure (holiday) — resource_id NULL.
  await db.insert(timeOff).values({
    businessId: business.id,
    resourceId: null,
    startsAt: new Date("2026-07-20T00:00:00Z"),
    endsAt: new Date("2026-07-21T00:00:00Z"),
    reason: "Public holiday",
  });

  // Business-default booking rules.
  await db.insert(bookingRules).values({
    businessId: business.id,
    serviceId: null,
    leadTimeMin: 120,
    advanceWindowDays: 60,
    slotGranularityMin: 15,
  });

  console.log("Seeded booking engine fixtures:", {
    business: business.slug,
    resourceId: resource.id,
    serviceId: service.id,
  });
  process.exit(0);
}

main().catch((err: unknown) => {
  console.error(err);
  process.exit(1);
});
