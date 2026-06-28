"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import {
  REMINDER_OFFSETS_BY_TIMING,
  RemindersFormInput,
} from "@/lib/schemas/reminders";

export interface RemindersActionResult {
  ok: boolean;
  error?: string;
}

// Owner-only. Writes `reminder_enabled` + `reminder_offsets_min`. When
// disabled, we still persist the timing choice so re-enabling restores the
// operator's last selection rather than resetting to 24h.
export async function updateReminderSettingsAction(
  input: unknown,
): Promise<RemindersActionResult> {
  const parsed = RemindersFormInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };
  if (business.role !== "owner") {
    return { ok: false, error: "Only the owner can edit reminders." };
  }

  await db
    .update(businesses)
    .set({
      reminderEnabled: parsed.data.enabled,
      reminderOffsetsMin: REMINDER_OFFSETS_BY_TIMING[parsed.data.timing],
    })
    .where(eq(businesses.id, business.id));

  revalidatePath("/dashboard/settings/reminders");
  return { ok: true };
}
