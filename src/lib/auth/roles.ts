// Single-sourced from the member_role / resource_type Postgres enums. Type-only
// re-export, so this stays free of any runtime (drizzle) dependency.
export type { MemberRole, ResourceType } from "@/db/schema";
