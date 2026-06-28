import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resources, workingHours } from "@/db/schema";
import type { BusinessScope } from "@/lib/db/scoped";
import {
  defaultWeeklyHours,
  minutesToHhmm,
} from "@/lib/onboarding/hours";
import type { DayHoursInput } from "@/lib/schemas/onboarding";

// Resolve a resource id to {id, name}, tenant-scoped. Wraps the same lookup
// the calendar uses but doesn't require an `active = true` filter — the
// dashboard edits inactive resources too.
export async function getEditableResource(
  scope: BusinessScope,
  resourceId: string,
): Promise<{ id: string; name: string } | null> {
  const [row] = await db
    .select({ id: resources.id, name: resources.name })
    .from(resources)
    .where(scope.where("resources", eq(resources.id, resourceId)))
    .limit(1);
  return row ?? null;
}

// Hydrate the 7-day form from the resource's stored windows. Missing days
// fall back to a closed seed so the form always has all 7 rows. Multiple
// open windows per weekday (split shifts) are folded to the first row for V1
// — split-shift editing isn't in the dashboard yet.
export async function getWorkingHours(
  scope: BusinessScope,
  resourceId: string,
): Promise<DayHoursInput[]> {
  const rows = await db
    .select({
      weekday: workingHours.weekday,
      startMinute: workingHours.startMinute,
      endMinute: workingHours.endMinute,
    })
    .from(workingHours)
    .innerJoin(resources, eq(resources.id, workingHours.resourceId))
    .where(
      scope.where(
        "resources",
        eq(resources.id, resourceId),
        eq(workingHours.resourceId, resourceId),
      ),
    )
    .orderBy(asc(workingHours.weekday), asc(workingHours.startMinute));

  const byWeekday = new Map<number, { startMinute: number; endMinute: number }>();
  for (const r of rows) {
    if (!byWeekday.has(r.weekday)) {
      byWeekday.set(r.weekday, { startMinute: r.startMinute, endMinute: r.endMinute });
    }
  }
  return defaultWeeklyHours().map((seed) => {
    const stored = byWeekday.get(seed.weekday);
    if (!stored) return { ...seed, open: false };
    return {
      weekday: seed.weekday,
      open: true,
      start: minutesToHhmm(stored.startMinute),
      end: minutesToHhmm(stored.endMinute),
    };
  });
}
