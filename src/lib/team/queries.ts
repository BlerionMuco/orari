import "server-only";
import { and, asc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  invites,
  resources,
  InviteStatus,
  type Resource,
} from "@/db/schema";
import type { BusinessScope } from "@/lib/db/scoped";

export interface TeamMember {
  id: string;
  name: string;
  active: boolean;
  loginLinked: boolean; // true if a profile is attached to the resource
}

// Active + inactive resources for the team table. Login status is derived
// from `resources.user_id IS NOT NULL` — true after the staff member has
// accepted their invite.
export async function listTeam(scope: BusinessScope): Promise<TeamMember[]> {
  const rows: Pick<Resource, "id" | "name" | "active" | "userId">[] = await db
    .select({
      id: resources.id,
      name: resources.name,
      active: resources.active,
      userId: resources.userId,
    })
    .from(resources)
    .where(scope.where("resources"))
    .orderBy(asc(resources.name));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    active: r.active,
    loginLinked: r.userId !== null,
  }));
}

export interface PendingInvite {
  id: string;
  email: string;
  expiresAt: Date;
  resourceId: string | null;
}

// Pending (un-accepted, un-revoked) invites for the team page. `invites`
// isn't part of TENANT_TABLES in scoped.ts so we filter by business_id
// directly. Past-expiry rows still display until they're flipped to "expired"
// (the resend action rotates the token + bumps `expires_at`).
export async function listPendingInvites(
  scope: BusinessScope,
): Promise<PendingInvite[]> {
  const rows = await db
    .select({
      id: invites.id,
      email: invites.email,
      expiresAt: invites.expiresAt,
      resourceId: invites.resourceId,
    })
    .from(invites)
    .where(
      and(
        eq(invites.businessId, scope.businessId),
        eq(invites.status, InviteStatus.PENDING),
      ),
    )
    .orderBy(asc(invites.createdAt));
  return rows;
}

export { InviteStatus };
