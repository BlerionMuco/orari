"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ResetPasswordInput } from "@/lib/schemas/auth";
import { ResetPasswordForm } from "@/components/auth/reset-password-form";
import { createSupabaseBrowser } from "@/lib/supabase/browser";
import {
  classifyUpdatePasswordError,
  describeUpdatePasswordError,
} from "@/lib/supabase/auth-errors";

type RecoveryStatus = "checking" | "ready" | "no-session";

function messageFor(kind: "expired" | "weak-password" | "unknown"): string {
  switch (kind) {
    case "expired":
      return "Your reset link has expired or is no longer valid. Request a new one to continue.";
    case "weak-password":
      return "That password doesn't meet the requirements. Try a stronger one.";
    case "unknown":
      return "Something went wrong updating your password. Please try again.";
  }
}

export default function ResetPasswordPage(): React.JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string>("");
  const [status, setStatus] = React.useState<RecoveryStatus>("checking");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(ResetPasswordInput),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const passwordValue = useWatch({ control, name: "password" });

  // Confirm the recovery session (written by /auth/callback) has hydrated into
  // the browser client before allowing a save. Subscribe first so we don't miss
  // the hydration event, then read getSession() as the fast path. A grace timer
  // marks the link expired only if nothing confirms a session.
  React.useEffect(() => {
    const supabase = createSupabaseBrowser();
    let active = true;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session): void => {
      if (!active) return;
      if (
        session &&
        (event === "INITIAL_SESSION" ||
          event === "PASSWORD_RECOVERY" ||
          event === "SIGNED_IN" ||
          event === "TOKEN_REFRESHED" ||
          event === "USER_UPDATED")
      ) {
        setStatus("ready");
      } else if (event === "SIGNED_OUT") {
        setStatus("no-session");
      }
    });

    void supabase.auth.getSession().then(({ data, error }): void => {
      if (!active) return;
      if (data.session) setStatus("ready");
      else if (error) {
        console.error("[reset-password] getSession failed:", error.message);
      }
    });

    const graceTimer = setTimeout((): void => {
      if (!active) return;
      setStatus((prev) => (prev === "checking" ? "no-session" : prev));
    }, 2500);

    return (): void => {
      active = false;
      clearTimeout(graceTimer);
      subscription.unsubscribe();
    };
  }, []);

  async function submit(values: ResetPasswordInput): Promise<void> {
    setFormError("");
    const supabase = createSupabaseBrowser();

    const first = await supabase.auth.updateUser({ password: values.password });
    if (!first.error) {
      router.push("/sign-in");
      return;
    }

    const classified = classifyUpdatePasswordError(first.error);
    console.error(
      "[reset-password] updateUser failed:",
      describeUpdatePasswordError(first.error),
    );

    if (classified.kind === "transient") {
      // Force the client to re-read the session from cookies, then retry once.
      await supabase.auth.getSession();
      const retry = await supabase.auth.updateUser({
        password: values.password,
      });
      if (!retry.error) {
        router.push("/sign-in");
        return;
      }
      const retryClass = classifyUpdatePasswordError(retry.error);
      console.error(
        "[reset-password] updateUser retry failed:",
        describeUpdatePasswordError(retry.error),
      );
      if (retryClass.kind === "transient") setStatus("no-session");
      setFormError(
        messageFor(retryClass.kind === "transient" ? "expired" : retryClass.kind),
      );
      return;
    }

    if (classified.kind === "expired") setStatus("no-session");
    setFormError(messageFor(classified.kind));
  }

  return (
    <ResetPasswordForm
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(submit)}
      passwordValue={passwordValue}
      formError={formError}
      status={status}
    />
  );
}
