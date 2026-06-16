"use server";

import { redirect } from "next/navigation";
import { createSupabaseServer } from "@/lib/supabase/server";
import { OnboardingInput } from "@/lib/schemas/onboarding";

export interface OnboardingResult {
  error?: string;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return base.length > 0 ? base : "shop";
}

export async function createBusinessAction(
  input: OnboardingInput,
): Promise<OnboardingResult> {
  const parsed = OnboardingInput.safeParse(input);
  if (!parsed.success) {
    return { error: "Please check the form and try again." };
  }
  const data = parsed.data;
  const supabase = await createSupabaseServer();

  function createBusiness(slug: string) {
    return supabase.rpc("create_business", {
      p_name: data.name,
      p_slug: slug,
      p_vertical: data.vertical,
      p_timezone: data.timezone,
      p_owner_is_resource: data.ownerIsResource,
    });
  }

  let result = await createBusiness(slugify(data.name));
  // Retry once with a unique suffix if the slug is taken (unique_violation).
  if (result.error?.code === "23505") {
    result = await createBusiness(
      `${slugify(data.name)}-${crypto.randomUUID().slice(0, 4)}`,
    );
  }
  if (result.error) return { error: result.error.message };

  const businessId = typeof result.data === "string" ? result.data : null;
  if (!businessId) return { error: "Could not create your business." };

  for (const member of data.team) {
    const email = member.email && member.email.length > 0 ? member.email : null;
    const { error } = await supabase.rpc("add_team_member", {
      p_business_id: businessId,
      p_name: member.name,
      p_email: email,
    });
    if (error) return { error: error.message };
  }

  redirect("/dashboard");
}
