"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/db/client";
import { bookingRules } from "@/db/schema";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { BookingRulesFormInput } from "@/lib/schemas/booking-rules";

export interface BookingRulesActionResult {
  ok: boolean;
  error?: string;
}

// Owner-only. Upserts the business-default rule (service_id IS NULL). The form
// edits lead time in hours; the row stores minutes. Per-service overrides are
// edited from the service detail page (out of scope for this action).
export async function updateBusinessDefaultRulesAction(
  input: unknown,
): Promise<BookingRulesActionResult> {
  const parsed = BookingRulesFormInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };
  if (business.role !== "owner") {
    return { ok: false, error: "Only the owner can edit booking rules." };
  }

  const values = {
    leadTimeMin: parsed.data.leadTimeHours * 60,
    advanceWindowDays: parsed.data.advanceWindowDays,
    slotGranularityMin: parsed.data.slotGranularityMin,
  };

  // Try update first — if no default row exists yet (legacy business pre-0007
  // seed), insert one. The default row is uniquely indexed on (business_id)
  // WHERE service_id IS NULL, so an insert can't duplicate it.
  const updated = await db
    .update(bookingRules)
    .set(values)
    .where(
      and(
        eq(bookingRules.businessId, business.id),
        isNull(bookingRules.serviceId),
      ),
    )
    .returning({ id: bookingRules.id });

  if (updated.length === 0) {
    await db.insert(bookingRules).values({
      businessId: business.id,
      ...values,
    });
  }

  revalidatePath("/dashboard/settings/booking-rules");
  return { ok: true };
}
