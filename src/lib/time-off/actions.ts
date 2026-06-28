"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resources, timeOff } from "@/db/schema";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { BlockTimeFormInput } from "@/lib/schemas/block-time";
import { localPartsToUtc } from "@/lib/booking/time";

export interface CreateBlockTimeResult {
  ok: boolean;
  error?: string;
}

function parseHmmToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

// Block a window of time on a resource (staff/owner) or business-wide (owner
// only). Times are interpreted as business-local; conversion to UTC happens
// here via the booking engine's `localPartsToUtc` so DST is handled in one
// place. The booking engine reads time_off as a busy interval — once written,
// the window disappears from public availability.
export async function createBlockTimeAction(
  input: unknown,
): Promise<CreateBlockTimeResult> {
  const parsed = BlockTimeFormInput.safeParse(input);
  if (!parsed.success) {
    const first = parsed.error.issues[0];
    return { ok: false, error: first?.message ?? "Check the form fields." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };

  // Business-wide closures are owner-only.
  if (parsed.data.resourceId === null && business.role !== "owner") {
    return { ok: false, error: "Only the owner can close the whole shop." };
  }

  // Staff can only block their own resource — verify by looking up the
  // resource's `user_id` rather than trusting the client.
  if (parsed.data.resourceId !== null) {
    const [row] = await db
      .select({ id: resources.id, userId: resources.userId })
      .from(resources)
      .where(
        and(
          eq(resources.id, parsed.data.resourceId),
          eq(resources.businessId, business.id),
        ),
      )
      .limit(1);
    if (!row) return { ok: false, error: "Resource not found." };
    if (business.role !== "owner" && row.userId !== user.id) {
      return { ok: false, error: "You can only block your own time." };
    }
  }

  const startMin = parseHmmToMinutes(parsed.data.startTime);
  const endMin = parseHmmToMinutes(parsed.data.endTime);

  const start = localPartsToUtc(
    parsed.data.date,
    startMin,
    business.timezone,
  );
  const end = localPartsToUtc(parsed.data.date, endMin, business.timezone);

  if (!start.existed || !end.existed) {
    return {
      ok: false,
      error: "That time doesn't exist on the chosen date (DST shift).",
    };
  }

  await db.insert(timeOff).values({
    businessId: business.id,
    resourceId: parsed.data.resourceId,
    startsAt: start.utc,
    endsAt: end.utc,
    reason: parsed.data.reason?.trim() || null,
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
  return { ok: true };
}
