"use server";

import { createSupabaseServer } from "@/lib/supabase/server";
import { OnboardingInput } from "@/lib/schemas/onboarding";
import { isReservedSlug, isValidSlugFormat } from "@/lib/onboarding/slug";
import { expandSchedule } from "@/lib/onboarding/hours";
import { getBusinessBySlug } from "@/lib/booking/queries";

export type SlugUnavailableReason = "format" | "reserved" | "taken";

export interface SlugCheckResult {
  available: boolean;
  reason?: SlugUnavailableReason;
}

// Live availability check for the go-live step. Cheap format/reserved checks
// first, then a single slug lookup. Free ⇔ no business owns the slug.
export async function checkSlugAvailableAction(
  slug: string,
): Promise<SlugCheckResult> {
  if (!isValidSlugFormat(slug)) return { available: false, reason: "format" };
  if (isReservedSlug(slug)) return { available: false, reason: "reserved" };
  const existing = await getBusinessBySlug(slug);
  return existing ? { available: false, reason: "taken" } : { available: true };
}

export type OnboardingResult =
  | { ok: true; slug: string }
  | { ok: false; error: string; code?: "slug-taken"; field?: "team" };

// Single atomic create: one SECURITY DEFINER RPC builds the business, default
// rules, owner resource, team (+ invites), services and shared working hours in
// one transaction. Nothing is persisted unless the whole thing succeeds.
export async function createBusinessAction(
  raw: unknown,
): Promise<OnboardingResult> {
  const parsed = OnboardingInput.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, error: "Please fix the highlighted fields." };
  }
  const v = parsed.data;

  // Re-validate the slug server-side — the debounced client check is skippable.
  if (!isValidSlugFormat(v.slug) || isReservedSlug(v.slug)) {
    return {
      ok: false,
      error: "That link can't be used — pick another.",
      code: "slug-taken",
    };
  }

  const supabase = await createSupabaseServer();

  // Owner-vs-team email collision (the client can't know the owner's email).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const ownerEmail = user?.email?.trim().toLowerCase();
  if (
    ownerEmail &&
    v.team.some((t) => t.email?.trim().toLowerCase() === ownerEmail)
  ) {
    return {
      ok: false,
      error: "A team member is using your owner email. Use a different address.",
      field: "team",
    };
  }

  // camelCase → snake_case at the RPC boundary so jsonb_to_recordset columns match.
  const p_services = v.services.map((s) => ({
    name: s.name,
    duration_min: s.durationMin,
    price_cents: s.price, // currency ALL (exponent 0): whole Lek maps 1:1
    before_buffer_min: 0,
    after_buffer_min: 0,
  }));
  const p_hours = expandSchedule(v.hours).map((h) => ({
    weekday: h.weekday,
    start_minute: h.startMinute,
    end_minute: h.endMinute,
  }));
  const p_team = v.team.map((t) => ({
    name: t.name,
    email: t.email && t.email.trim().length > 0 ? t.email.trim() : null,
  }));

  const { data, error } = await supabase.rpc("create_business_onboarding", {
    p_name: v.name,
    p_slug: v.slug,
    p_vertical: v.vertical,
    p_timezone: v.timezone,
    p_owner_is_resource: v.ownerIsResource,
    p_team,
    p_services,
    p_hours,
  });

  if (error) {
    // The RPC re-raises a slug collision as the custom SQLSTATE OR001.
    if (error.code === "OR001") {
      return {
        ok: false,
        error: "That link is taken — pick another.",
        code: "slug-taken",
      };
    }
    return {
      ok: false,
      error: "Couldn't create your business. Please try again.",
    };
  }

  const businessId = typeof data === "string" ? data : null;
  if (!businessId) {
    return {
      ok: false,
      error: "Couldn't create your business. Please try again.",
    };
  }

  return { ok: true, slug: v.slug };
}
