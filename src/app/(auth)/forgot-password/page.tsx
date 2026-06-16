"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ForgotPasswordInput } from "@/lib/schemas/auth";
import { ForgotPasswordForm } from "@/components/auth/forgot-password-form";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function ForgotPasswordPage(): React.JSX.Element {
  const [sent, setSent] = React.useState<boolean>(false);
  const [submittedEmail, setSubmittedEmail] = React.useState<string>("");
  const [formError, setFormError] = React.useState<string>("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordInput>({
    resolver: zodResolver(ForgotPasswordInput),
    defaultValues: { email: "" },
  });

  async function submit(values: ForgotPasswordInput): Promise<void> {
    setFormError("");
    const supabase = createSupabaseBrowser();
    // Recovery link routes through /auth/callback to exchange the PKCE code for a
    // session before the reset form loads.
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    // Supabase does not reveal whether the email exists, so the success screen
    // is safe to show. Only surface genuine failures (e.g. rate limiting).
    if (error) {
      setFormError(error.message);
      return;
    }
    setSubmittedEmail(values.email);
    setSent(true);
  }

  return (
    <ForgotPasswordForm
      register={register}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(submit)}
      sent={sent}
      submittedEmail={submittedEmail}
      formError={formError}
    />
  );
}
