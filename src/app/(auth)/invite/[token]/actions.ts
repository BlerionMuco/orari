"use server";

import "server-only";
import { revalidatePath } from "next/cache";
import { createSupabaseServer } from "@/lib/supabase/server";
import { getCurrentUser } from "@/lib/auth/session";

export interface AcceptInviteResult {
  ok: boolean;
  error?: string;
}

// Thin wrapper over the existing `accept_invite` SECURITY DEFINER RPC. The
// RPC does the heavy lifting (membership row, resource attach, status flip)
// in one transaction. We only handle the surface: require auth, translate
// Postgres error messages into user-readable strings, and revalidate the
// dashboard so the new business appears immediately after redirect.
export async function acceptInviteAction(
  token: string,
): Promise<AcceptInviteResult> {
  if (!token || typeof token !== "string") {
    return { ok: false, error: "Invalid invite link." };
  }

  const user = await getCurrentUser();
  if (!user) return { ok: false, error: "Sign in first." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.rpc("accept_invite", { p_token: token });

  if (error) {
    const msg = error.message ?? "";
    if (msg.includes("invalid invite")) {
      return { ok: false, error: "This invite link isn't valid." };
    }
    if (msg.includes("invite expired")) {
      return { ok: false, error: "This invite has expired." };
    }
    if (msg.includes("invite already used")) {
      return { ok: false, error: "This invite has already been used." };
    }
    if (msg.includes("not authenticated")) {
      return { ok: false, error: "Sign in first." };
    }
    return { ok: false, error: "Couldn't accept the invite. Try again." };
  }

  revalidatePath("/dashboard");
  return { ok: true };
}
