import "server-only";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { services, type Service } from "@/db/schema";
import type { BusinessScope } from "@/lib/db/scoped";

// Every row (active + inactive) for the dashboard list. Ordered by name so the
// list reads alphabetically; the active toggle drives which rows the public
// booking surface sees (filtered separately by listActiveServices).
export async function listServices(scope: BusinessScope): Promise<Service[]> {
  return db
    .select()
    .from(services)
    .where(scope.where("services"))
    .orderBy(asc(services.name));
}

export async function getServiceById(
  scope: BusinessScope,
  serviceId: string,
): Promise<Service | null> {
  const [row] = await db
    .select()
    .from(services)
    .where(scope.where("services", eq(services.id, serviceId)))
    .limit(1);
  return row ?? null;
}
