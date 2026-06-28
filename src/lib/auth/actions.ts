"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { createSupabaseServer } from "@/lib/supabase/server";
import {
  ChangePasswordInput,
  UpdateProfileInput,
} from "@/lib/schemas/auth";

export async function signOut(): Promise<void> {
  const supabase = await createSupabaseServer();
  await supabase.auth.signOut();
  redirect("/sign-in");
}

export interface AccountActionResult {
  ok: boolean;
  error?: string;
}

// Updates `profiles.full_name`. Email and password live in Supabase auth and
// are handled by separate flows (changeEmailAction, changePasswordAction).
export async function updateProfileAction(
  input: unknown,
): Promise<AccountActionResult> {
  const parsed = UpdateProfileInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const supabase = await createSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, error: "Not signed in." };

  await db
    .update(profiles)
    .set({ fullName: parsed.data.fullName.trim() })
    .where(eq(profiles.id, user.id));

  revalidatePath("/dashboard/settings/account");
  revalidatePath("/dashboard");
  return { ok: true };
}

// Calls Supabase to send a confirmation link to the new address. The actual
// email change only takes effect after the user clicks through.
export async function changeEmailAction(
  email: string,
): Promise<AccountActionResult> {
  const trimmed = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(trimmed)) {
    return { ok: false, error: "Enter a valid email address." };
  }

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({ email: trimmed });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}

// Operator is already authenticated, so Supabase doesn't require their old
// password. The new password is re-validated server-side to enforce the same
// rules the form shows.
export async function changePasswordAction(
  input: unknown,
): Promise<AccountActionResult> {
  const parsed = ChangePasswordInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Check the form fields." };

  const supabase = await createSupabaseServer();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) {
    return { ok: false, error: error.message };
  }
  return { ok: true };
}
