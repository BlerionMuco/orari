import "server-only";
import { and, eq, type SQL } from "drizzle-orm";
import { bookings, resources, services } from "@/db/schema";

// Tenant tables that carry business_id directly. Add a table here to expose its
// business filter through the scope.
const TENANT_TABLES = { resources, services, bookings } as const;
export type TenantTable = keyof typeof TENANT_TABLES;

export interface BusinessScope {
  readonly businessId: string;
  /**
   * The business_id filter for a tenant table, AND-combined with any extra
   * conditions. Route every tenant query's WHERE through this.
   */
  where(table: TenantTable, ...extra: Array<SQL | undefined>): SQL;
}

// Bind a business_id into tenant-table filters. On the server, Drizzle connects
// with a privileged role and BYPASSES RLS — so this filter, not RLS, is the
// tenant boundary. Prefer scope.where(...) over hand-written eq(t.businessId, …)
// at each call site, so a forgotten filter (a cross-tenant leak) can't happen.
export function businessScope(businessId: string): BusinessScope {
  return {
    businessId,
    where(table, ...extra) {
      const conditions: SQL[] = [
        eq(TENANT_TABLES[table].businessId, businessId),
      ];
      for (const condition of extra) {
        if (condition) conditions.push(condition);
      }
      return conditions.length === 1
        ? conditions[0]
        : (and(...conditions) as SQL);
    },
  };
}
