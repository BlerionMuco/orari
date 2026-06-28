import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { resources, type Resource } from "@/db/schema";
import { businessScope } from "@/lib/db/scoped";

export interface TimeOffResourceOption {
  id: string;
  name: string;
}

// Active resources for the block-time picker (owner: every active resource;
// staff: scoped to their own resource server-side at the page layer). Same
// tenant scoping as the team list.
export async function listResourcesForTimeOff(
  businessId: string,
): Promise<TimeOffResourceOption[]> {
  const scope = businessScope(businessId);
  const rows: Pick<Resource, "id" | "name">[] = await db
    .select({ id: resources.id, name: resources.name })
    .from(resources)
    .where(scope.where("resources", eq(resources.active, true)))
    .orderBy(asc(resources.name));
  return rows.map((r) => ({ id: r.id, name: r.name }));
}
