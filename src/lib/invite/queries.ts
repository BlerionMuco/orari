import "server-only";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import {
  businesses,
  invites,
  resources,
  InviteStatus,
  type InviteStatus as InviteStatusType,
} from "@/db/schema";

export const InviteResolveKind = {
  NOT_FOUND: "not_found",
  EXPIRED: "expired",
  ACCEPTED: "accepted",
  REVOKED: "revoked",
  PENDING: "pending",
} as const;
export type InviteResolveKind =
  (typeof InviteResolveKind)[keyof typeof InviteResolveKind];

export interface InviteResolveResult {
  kind: InviteResolveKind;
  businessName?: string;
  role?: string;
  resourceName?: string | null;
  email?: string;
}

// Server-only token lookup. Joins businesses + (optional) resources so the
// accept card can show "<Business> invited you as a barber on <Resource>".
// The expiry check mirrors the accept_invite RPC — if the row is past
// `expires_at` we treat it as expired even when its status column still says
// "pending" (the RPC flips it on the next call).
export async function getInviteByToken(
  token: string,
  now: Date = new Date(),
): Promise<InviteResolveResult> {
  if (!token || token.length < 8) return { kind: InviteResolveKind.NOT_FOUND };

  const [row] = await db
    .select({
      status: invites.status,
      expiresAt: invites.expiresAt,
      email: invites.email,
      role: invites.role,
      businessName: businesses.name,
      resourceName: resources.name,
    })
    .from(invites)
    .leftJoin(businesses, eq(businesses.id, invites.businessId))
    .leftJoin(resources, eq(resources.id, invites.resourceId))
    .where(eq(invites.token, token))
    .limit(1);

  if (!row) return { kind: InviteResolveKind.NOT_FOUND };

  const status = row.status as InviteStatusType;
  if (status === InviteStatus.ACCEPTED) {
    return { kind: InviteResolveKind.ACCEPTED };
  }
  if (status === InviteStatus.REVOKED) {
    return { kind: InviteResolveKind.REVOKED };
  }
  if (status === InviteStatus.EXPIRED || row.expiresAt < now) {
    return { kind: InviteResolveKind.EXPIRED };
  }

  return {
    kind: InviteResolveKind.PENDING,
    businessName: row.businessName ?? undefined,
    role: row.role,
    resourceName: row.resourceName,
    email: row.email,
  };
}
