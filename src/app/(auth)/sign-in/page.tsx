"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { SignInInput } from "@/lib/schemas/auth";
import { SignInForm } from "@/components/auth/sign-in-form";
import { createSupabaseBrowser } from "@/lib/supabase/browser";

export default function SignInPage(): React.JSX.Element {
  const router = useRouter();
  const [formError, setFormError] = React.useState<string>("");
  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInInput>({
    resolver: zodResolver(SignInInput),
    defaultValues: { email: "", password: "", remember: false },
  });

  async function submit(values: SignInInput): Promise<void> {
    setFormError("");
    const supabase = createSupabaseBrowser();
    const { error } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });
    // `remember` has no first-class toggle in @supabase/ssr — the session is
    // cookie-backed and persists either way. Kept in the form for future use.
    if (error) {
      setFormError(error.message);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <SignInForm
      register={register}
      control={control}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={handleSubmit(submit)}
      formError={formError}
    />
  );
}
