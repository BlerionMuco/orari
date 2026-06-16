import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import { getAvailableSlots } from "@/lib/booking/get-available-slots";
import { MAX_AVAILABILITY_RANGE_DAYS } from "@/lib/booking/constants";
import { addDaysToIsoDate } from "@/lib/booking/time";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const QuerySchema = z
  .object({
    orgSlug: z.string().min(1).optional(),
    businessId: z.string().uuid().optional(),
    resourceId: z.string().uuid(),
    serviceId: z.string().uuid(),
    from: z.string().regex(ISO_DATE),
    to: z.string().regex(ISO_DATE),
  })
  .refine((q) => Boolean(q.orgSlug || q.businessId), {
    message: "orgSlug or businessId is required",
  });

interface SlotResponse {
  startUtc: string;
  endUtc: string;
  isoDate: string;
  localTimeLabel: string;
}

// Public, unauthenticated availability read. Tenancy is enforced inside
// getAvailableSlots (businessScope). The range is clamped so an anonymous
// request can't ask for a multi-year span and burn CPU.
export async function GET(request: NextRequest): Promise<NextResponse> {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const parsed = QuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_params" }, { status: 400 });
  }
  const q = parsed.data;

  let businessId = q.businessId;
  if (!businessId && q.orgSlug) {
    const [row] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(eq(businesses.slug, q.orgSlug))
      .limit(1);
    if (!row) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    businessId = row.id;
  }
  if (!businessId) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }

  // Clamp the span: never start after end, never exceed the CPU cap. The booking
  // rules' advance window is enforced inside the engine.
  const from = q.from;
  let to = q.to < from ? from : q.to;
  const maxTo = addDaysToIsoDate(from, MAX_AVAILABILITY_RANGE_DAYS);
  if (to > maxTo) to = maxTo;

  const result = await getAvailableSlots({
    businessId,
    resourceId: q.resourceId,
    serviceId: q.serviceId,
    rangeStartDate: from,
    rangeEndDate: to,
  });

  const slots: SlotResponse[] = result.slots.map((s) => ({
    startUtc: s.startUtc.toISOString(),
    endUtc: s.endUtc.toISOString(),
    isoDate: s.isoDate,
    localTimeLabel: s.localTimeLabel,
  }));

  return NextResponse.json(
    { timezone: result.timezone, slots },
    { headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60" } },
  );
}
