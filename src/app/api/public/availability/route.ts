import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import {
  getAvailableSlots,
  getUnionAvailability,
} from "@/lib/booking/get-available-slots";
import {
  MAX_AVAILABILITY_RANGE_DAYS,
  PUBLIC_AVAILABILITY_WINDOW_DAYS,
} from "@/lib/booking/constants";
import { addDaysToIsoDate, localIsoDate } from "@/lib/booking/time";
import type {
  AvailabilitySlot,
  AvailabilityResponse,
} from "@/lib/booking/types";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const QuerySchema = z
  .object({
    orgSlug: z.string().min(1).optional(),
    businessId: z.string().uuid().optional(),
    // Optional: present → single-resource availability; absent → union of all
    // active resources ("Any available").
    resourceId: z.string().uuid().optional(),
    // Comma-separated service ids — the basket in execution order. Order is
    // meaningful (it drives the block's leading/trailing buffers) so it is NOT
    // sorted; duplicates are dropped (first occurrence wins) and the count is
    // capped at 10. Must match the order later sent to create.
    serviceIds: z
      .string()
      .min(1)
      .transform((s) => [
        ...new Set(s.split(",").map((x) => x.trim()).filter(Boolean)),
      ])
      .pipe(z.array(z.string().uuid()).min(1).max(10)),
    // Both bounds are server-owned by default (invariant 3, no client date math).
    // Clients normally send neither `from`/`to` and instead a `days` COUNT; the
    // server anchors `from` to business-local today and derives `to`. `from`/`to`
    // stay accepted for internal/testing callers.
    from: z.string().regex(ISO_DATE).optional(),
    to: z.string().regex(ISO_DATE).optional(),
    days: z.coerce.number().int().min(1).max(MAX_AVAILABILITY_RANGE_DAYS).optional(),
  })
  .refine((q) => Boolean(q.orgSlug || q.businessId), {
    message: "orgSlug or businessId is required",
  });

// Public, unauthenticated availability read. Tenancy is enforced inside the
// engine (businessScope). The range is clamped so an anonymous request can't ask
// for a multi-year span and burn CPU.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const q = parsed.data;

  // Resolve {id, timezone} from either businessId or slug. Timezone is needed to
  // default an omitted `from` to business-local today. Kept lightweight (no
  // location parse) — this path is cached and hot.
  const where = q.businessId
    ? eq(businesses.id, q.businessId)
    : eq(businesses.slug, q.orgSlug ?? "");
  const [business] = await db
    .select({ id: businesses.id, timezone: businesses.timezone })
    .from(businesses)
    .where(where)
    .limit(1);
  if (!business) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Server owns the bounds: anchor `from` to business-local today, derive `to`
  // from the requested day count (default window) when not pinned, then clamp
  // (never start after end, never exceed the CPU cap). The advance window is
  // enforced inside the engine.
  const from = q.from ?? localIsoDate(new Date(), business.timezone);
  const windowDays = q.days ?? PUBLIC_AVAILABILITY_WINDOW_DAYS;
  const requestedTo = q.to ?? addDaysToIsoDate(from, windowDays - 1);
  let to = requestedTo < from ? from : requestedTo;
  const maxTo = addDaysToIsoDate(from, MAX_AVAILABILITY_RANGE_DAYS);
  if (to > maxTo) to = maxTo;

  const result = q.resourceId
    ? await getAvailableSlots({
        businessId: business.id,
        resourceId: q.resourceId,
        serviceIds: q.serviceIds,
        rangeStartDate: from,
        rangeEndDate: to,
      })
    : await getUnionAvailability({
        businessId: business.id,
        serviceIds: q.serviceIds,
        rangeStartDate: from,
        rangeEndDate: to,
      });

  const slots: AvailabilitySlot[] = result.slots.map((s) => ({
    startUtc: s.startUtc.toISOString(),
    endUtc: s.endUtc.toISOString(),
    isoDate: s.isoDate,
    localTimeLabel: s.localTimeLabel,
  }));

  const body: AvailabilityResponse = {
    timezone: result.timezone,
    rangeStartDate: from,
    rangeEndDate: to,
    slots,
  };
  return NextResponse.json(body, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" },
  });
}
