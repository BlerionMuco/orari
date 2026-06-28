import "server-only";
import type { User } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";
import { createSupabaseServer } from "@/lib/supabase/server";
import { db } from "@/db/client";
import { businesses, memberships, profiles } from "@/db/schema";
import type { MemberRole } from "@/lib/auth/roles";

export interface CurrentBusiness {
  id: string;
  name: string;
  slug: string;
  timezone: string;
  currency: string;
  role: MemberRole;
}

// The signed-in Supabase user, or null. Also defensively ensures a profiles row
// exists (in case the handle_new_user trigger didn't fire).
export async function getCurrentUser(): Promise<User | null> {
  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  await ensureProfile(user);
  return user;
}

// Idempotent upsert of the auth user's profile. Orphan-proofs against a missed
// trigger and covers metadata-bearing OAuth sign-ups later.
async function ensureProfile(user: User): Promise<void> {
  const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
  const fullName =
    typeof meta.name === "string"
      ? meta.name
      : typeof meta.full_name === "string"
        ? meta.full_name
        : null;
  await db
    .insert(profiles)
    .values({ id: user.id, email: user.email ?? null, fullName })
    .onConflictDoNothing();
}

// The business the user belongs to (V1: at most one). Filtered by userId — the
// Drizzle connection bypasses RLS, so the tenant scoping is this WHERE clause.
export async function getCurrentBusiness(
  userId: string,
): Promise<CurrentBusiness | null> {
  const rows = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      slug: businesses.slug,
      timezone: businesses.timezone,
      currency: businesses.currency,
      role: memberships.role,
    })
    .from(memberships)
    .innerJoin(businesses, eq(businesses.id, memberships.businessId))
    .where(eq(memberships.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}
