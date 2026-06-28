import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";

export interface ReminderSettings {
  enabled: boolean;
  offsetsMin: number[];
}

// Reads the reminder columns directly off `businesses`. Defaulted at the
// column level (enabled=true, offsets='{1440}'), so missing rows shouldn't
// happen — but we still fall back to the same defaults defensively.
export async function getReminderSettings(
  businessId: string,
): Promise<ReminderSettings> {
  const [row] = await db
    .select({
      enabled: businesses.reminderEnabled,
      offsets: businesses.reminderOffsetsMin,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (!row) return { enabled: true, offsetsMin: [1440] };
  return { enabled: row.enabled, offsetsMin: row.offsets };
}
