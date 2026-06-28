"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/buttons/button";
import { SectionCard } from "@/components/ui/display/section-card";
import { Field } from "@/components/ui/form/field";
import { PasswordInput } from "@/components/ui/form/password-input";
import { useToast, ToastVariant } from "@/lib/ui/use-toast";
import { ChangePasswordInput } from "@/lib/schemas/auth";
import { changePasswordAction } from "@/lib/auth/actions";

export function ChangePasswordForm(): React.JSX.Element {
  const show = useToast((s) => s.show);
  const [pending, startTransition] = React.useTransition();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(ChangePasswordInput),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = handleSubmit((values) => {
    startTransition(async () => {
      const res = await changePasswordAction(values);
      if (!res.ok) {
        show(res.error ?? "Couldn't change password.", ToastVariant.ERROR);
        return;
      }
      show("Password updated");
      reset({ password: "", confirmPassword: "" });
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate>
      <SectionCard title="Password" contentClassName="flex flex-col gap-4">
        <Field
          id="acc-password"
          label="New password"
          hint="At least 8 characters with an uppercase letter and a number."
          error={errors.password?.message}
        >
          <PasswordInput autoComplete="new-password" {...register("password")} />
        </Field>
        <Field
          id="acc-password-confirm"
          label="Confirm new password"
          error={errors.confirmPassword?.message}
        >
          <PasswordInput
            autoComplete="new-password"
            {...register("confirmPassword")}
          />
        </Field>
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={pending}>
            Update password
          </Button>
        </div>
      </SectionCard>
    </form>
  );
}
