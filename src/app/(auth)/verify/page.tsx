"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { VerifyOtpInput } from "@/lib/schemas/auth";
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

const RESEND_SECONDS = 30;

function VerifyContent(): React.JSX.Element {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? undefined;
  const [resendIn, setResendIn] = React.useState<number>(RESEND_SECONDS);
  const [formError, setFormError] = React.useState<string>("");

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpInput>({
    resolver: zodResolver(VerifyOtpInput),
    defaultValues: { code: "" },
  });

  React.useEffect(() => {
    if (resendIn <= 0) return;
    const timer = setTimeout(() => setResendIn(resendIn - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendIn]);

  async function submit(values: VerifyOtpInput): Promise<void> {
    setFormError("");
    if (!email) {
      setFormError("Missing email — restart sign-up.");
      return;
    }
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.verifyOtp({
      email,
      token: values.code,
      type: "signup",
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  async function handleResend(): Promise<void> {
    if (!email) {
      setFormError("Missing email — restart sign-up.");
      return;
    }
    setFormError("");
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.resend({ type: "signup", email });
    if (error) {
      setFormError(error.message);
      return;
    }
    setResendIn(RESEND_SECONDS);
  }

  return (
    <VerifyOtpForm
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(submit)}
      email={email}
      onResend={handleResend}
      resendIn={resendIn}
      formError={formError}
    />
  );
}

export default function VerifyPage(): React.JSX.Element {
  // useSearchParams requires a Suspense boundary in the App Router.
  return (
    <React.Suspense fallback={null}>
      <VerifyContent />
    </React.Suspense>
  );
}
