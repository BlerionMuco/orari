"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resources, workingHours } from "@/db/schema";
import { businessScope } from "@/lib/db/scoped";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { HoursFormInput } from "@/lib/schemas/hours";
import { expandSchedule } from "@/lib/onboarding/hours";

export interface HoursActionResult {
  ok: boolean;
  error?: string;
}

// Owner can edit any resource in the business; staff can edit only their own
// resource. Returns the validated resource id or an error.
async function authorizeResourceEdit(
  resourceId: string,
): Promise<
  | { ok: true; scope: ReturnType<typeof businessScope> }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };
  const scope = businessScope(business.id);

  const [row] = await db
    .select({ id: resources.id, userId: resources.userId })
    .from(resources)
    .where(scope.where("resources", eq(resources.id, resourceId)))
    .limit(1);
  if (!row) return { ok: false, error: "Resource not found." };

  if (business.role === "staff" && row.userId !== user.id) {
    return { ok: false, error: "You can only edit your own hours." };
  }
  return { ok: true, scope };
}

// Replace the resource's working hours wholesale: delete the existing rows
// and insert the open ones in one transaction. The pure validators from
// onboarding/hours.ts shape the open-only payload.
export async function replaceWorkingHoursAction(
  input: HoursFormInput,
): Promise<HoursActionResult> {
  const parsed = HoursFormInput.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Fix the highlighted days — end time must be after the start.",
    };
  }

  const auth = await authorizeResourceEdit(parsed.data.resourceId);
  if (!auth.ok) return { ok: false, error: auth.error };

  const open = expandSchedule(parsed.data.hours);
  await db.transaction(async (tx) => {
    await tx
      .delete(workingHours)
      .where(eq(workingHours.resourceId, parsed.data.resourceId));
    if (open.length > 0) {
      await tx.insert(workingHours).values(
        open.map((o) => ({
          resourceId: parsed.data.resourceId,
          weekday: o.weekday,
          startMinute: o.startMinute,
          endMinute: o.endMinute,
        })),
      );
    }
  });

  revalidatePath("/dashboard/settings/hours");
  return { ok: true };
}
