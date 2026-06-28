"use server";

import { revalidatePath } from "next/cache";
import { and, eq, ne } from "drizzle-orm";
import { db } from "@/db/client";
import { businesses } from "@/db/schema";
import { getCurrentBusiness, getCurrentUser } from "@/lib/auth/session";
import { BusinessProfileFormInput } from "@/lib/schemas/business";
import { isAllowedLogoHost } from "@/lib/business/logo-host";
import { isReservedSlug, isValidSlugFormat } from "@/lib/onboarding/slug";

export interface BusinessProfileActionResult {
  ok: boolean;
  error?: string;
  field?: "slug" | "logoUrl";
}

// Owner-only profile update. Slug uniqueness is a database invariant
// (uniqueIndex on businesses_slug_idx) so a race here surfaces as a unique
// violation that we catch and surface as a friendly "slug taken" error.
// `logoUrl` is host-checked to match next/image's allow-list before storing,
// otherwise the public booking page crashes on render.
export async function updateBusinessProfileAction(
  input: unknown,
): Promise<BusinessProfileActionResult> {
  const parsed = BusinessProfileFormInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Not signed in." };
  const business = await getCurrentBusiness(user.id);
  if (!business) return { ok: false, error: "No business." };
  if (business.role !== "owner") {
    return { ok: false, error: "Only the owner can edit the profile." };
  }

  const v = parsed.data;

  if (!isValidSlugFormat(v.slug) || isReservedSlug(v.slug)) {
    return { ok: false, error: "That link can't be used.", field: "slug" };
  }

  const logoUrl =
    v.logoUrl && v.logoUrl.length > 0 ? v.logoUrl.trim() : null;
  if (logoUrl && !isAllowedLogoHost(logoUrl)) {
    return {
      ok: false,
      error: "Logo URL must be hosted on Supabase Storage (https).",
      field: "logoUrl",
    };
  }

  // Pre-check slug to surface a friendly error before the catch-all unique
  // violation. Race still possible — DB unique index is the source of truth.
  if (v.slug !== business.slug) {
    const [conflict] = await db
      .select({ id: businesses.id })
      .from(businesses)
      .where(and(eq(businesses.slug, v.slug), ne(businesses.id, business.id)))
      .limit(1);
    if (conflict) {
      return { ok: false, error: "That link is taken.", field: "slug" };
    }
  }

  try {
    await db
      .update(businesses)
      .set({
        name: v.name.trim(),
        slug: v.slug,
        phone: v.phone && v.phone.length > 0 ? v.phone.trim() : null,
        description:
          v.description && v.description.length > 0
            ? v.description.trim()
            : null,
        logoUrl,
        currency: v.currency,
        location: v.location ?? null,
      })
      .where(eq(businesses.id, business.id));
  } catch (err) {
    // Postgres unique_violation. Drizzle re-throws as a generic Error so we
    // sniff the message for the index name.
    const msg = err instanceof Error ? err.message : "";
    if (msg.includes("businesses_slug_idx")) {
      return { ok: false, error: "That link is taken.", field: "slug" };
    }
    throw err;
  }

  revalidatePath("/dashboard/settings/profile");
  revalidatePath("/dashboard");
  return { ok: true };
}
