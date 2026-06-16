"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignUpInput } from "@/lib/schemas/auth";
import { SignUpForm } from "@/components/auth/sign-up-form";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function SignUpPage(): React.JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string>("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpInput>({
    resolver: zodResolver(SignUpInput),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      acceptTerms: false,
    },
  });

  async function submit(values: SignUpInput): Promise<void> {
    setFormError("");
    const supabase = createSupabaseBrowser();
    // No emailRedirectTo — we verify with a 6-digit OTP code, not a magic link.
    const { error } = await supabase.auth.signUp({
      email: values.email,
      password: values.password,
      options: { data: { name: values.name } },
    });
    if (error) {
      setFormError(error.message);
      return;
    }
    router.push(`/verify?email=${encodeURIComponent(values.email)}`);
  }

  return (
    <SignUpForm
      register={register}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(submit)}
      formError={formError}
    />
  );
}
