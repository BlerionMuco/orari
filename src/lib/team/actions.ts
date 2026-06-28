"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { invites, resources, InviteStatus } from "@/db/schema";
import { businessScope } from "@/lib/db/scoped";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { createSupabaseServer } from "@/lib/supabase/server";
import { TeamMemberFormInput } from "@/lib/schemas/team";

const ResourceActiveInput = z.object({
  resourceId: z.string().uuid(),
  active: z.boolean(),
});
const InviteIdInput = z.object({ inviteId: z.string().uuid() });

// `invitePath` is the relative URL the operator should hand to the new staffer
// — V1 has no email pipeline (M6 / notifications phase), so the dashboard
// surfaces the link directly. The client prepends the origin and copies it to
// the clipboard. Absent when no email was attached at create time.
export interface TeamActionResult {
  ok: boolean;
  error?: string;
  invitePath?: string;
}

async function ownerContext(): Promise<
  | { ok: true; businessId: string; scope: ReturnType<typeof businessScope> }
  | { ok: false; error: string }
> {
  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };
  if (business.role !== "owner") {
    return { ok: false, error: "Only the owner can manage the team." };
  }
  return {
    ok: true,
    businessId: business.id,
    scope: businessScope(business.id),
  };
}

function invalidate(): void {
  revalidatePath("/dashboard/settings/team");
  revalidatePath("/dashboard/settings/hours");
  revalidatePath("/dashboard");
  revalidatePath("/dashboard/calendar");
}

// Wraps the existing add_team_member SECURITY DEFINER RPC. Email is optional;
// with an email, the RPC also mints a pending invite the staffer can claim.
export async function inviteTeamMemberAction(
  input: z.infer<typeof TeamMemberFormInput>,
): Promise<TeamActionResult> {
  const parsed = TeamMemberFormInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const supabase = await createSupabaseServer();
  const email = parsed.data.email?.trim();
  const hasEmail = !!email && email.length > 0;
  const { error } = await supabase.rpc("add_team_member", {
    p_business_id: ctx.businessId,
    p_name: parsed.data.name.trim(),
    p_email: hasEmail ? email : null,
  });
  if (error) {
    return { ok: false, error: "Couldn't add the team member. Try again." };
  }

  // V1 ships no email pipeline, so when an email was attached the RPC just
  // minted a pending invite — pull its token back so the client can offer the
  // operator the link to hand over. Newest pending invite in this business.
  let invitePath: string | undefined;
  if (hasEmail) {
    const [row] = await db
      .select({ token: invites.token })
      .from(invites)
      .where(
        and(
          eq(invites.businessId, ctx.businessId),
          eq(invites.status, InviteStatus.PENDING),
        ),
      )
      .orderBy(desc(invites.createdAt))
      .limit(1);
    if (row) invitePath = `/invite/${row.token}`;
  }

  invalidate();
  return { ok: true, invitePath };
}

// Revoke: flip the pending invite to `revoked`. The accept_invite RPC rejects
// any non-`pending` status, so a revoked token is dead even if the link leaks.
export async function revokeInviteAction(
  input: z.infer<typeof InviteIdInput>,
): Promise<TeamActionResult> {
  const parsed = InviteIdInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const updated = await db
    .update(invites)
    .set({ status: InviteStatus.REVOKED })
    .where(
      and(
        eq(invites.id, parsed.data.inviteId),
        eq(invites.businessId, ctx.businessId),
        eq(invites.status, InviteStatus.PENDING),
      ),
    )
    .returning({ id: invites.id });

  if (updated.length === 0) return { ok: false, error: "Invite not found." };
  invalidate();
  return { ok: true };
}

// Resend: rotate the token and bump the 14-day expiry. Old links die instantly
// (the rotation is the kill switch). With email out of scope in V1 the actual
// re-delivery is the operator's job; this still produces a fresh, usable link.
export async function resendInviteAction(
  input: z.infer<typeof InviteIdInput>,
): Promise<TeamActionResult> {
  const parsed = InviteIdInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const fresh = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
  const newExpiry = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);

  const updated = await db
    .update(invites)
    .set({
      token: fresh,
      expiresAt: newExpiry,
      status: InviteStatus.PENDING,
    })
    .where(
      and(
        eq(invites.id, parsed.data.inviteId),
        eq(invites.businessId, ctx.businessId),
      ),
    )
    .returning({ id: invites.id });

  if (updated.length === 0) return { ok: false, error: "Invite not found." };
  invalidate();
  return { ok: true, invitePath: `/invite/${fresh}` };
}

export async function setResourceActiveAction(
  input: z.infer<typeof ResourceActiveInput>,
): Promise<TeamActionResult> {
  const parsed = ResourceActiveInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Bad input." };

  const ctx = await ownerContext();
  if (!ctx.ok) return { ok: false, error: ctx.error };

  const updated = await db
    .update(resources)
    .set({ active: parsed.data.active })
    .where(ctx.scope.where("resources", eq(resources.id, parsed.data.resourceId)))
    .returning({ id: resources.id });

  if (updated.length === 0) return { ok: false, error: "Resource not found." };
  invalidate();
  return { ok: true };
}
