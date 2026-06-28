import "server-only";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { bookingRules } from "@/db/schema";
import { DEFAULT_BOOKING_RULES } from "@/lib/booking/constants";

export interface BusinessDefaultRules {
  leadTimeMin: number;
  advanceWindowDays: number;
  slotGranularityMin: number;
}

// Read the business-default booking_rules row (service_id IS NULL). Falls back
// to DEFAULT_BOOKING_RULES if the row is missing — same fallback the engine
// uses, so the form never crashes on a half-set-up business.
export async function getBusinessDefaultRules(
  businessId: string,
): Promise<BusinessDefaultRules> {
  const [row] = await db
    .select({
      leadTimeMin: bookingRules.leadTimeMin,
      advanceWindowDays: bookingRules.advanceWindowDays,
      slotGranularityMin: bookingRules.slotGranularityMin,
    })
    .from(bookingRules)
    .where(
      and(eq(bookingRules.businessId, businessId), isNull(bookingRules.serviceId)),
    )
    .limit(1);

  return row ?? DEFAULT_BOOKING_RULES;
}
