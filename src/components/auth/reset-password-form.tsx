import * as React from "react";
import { TriangleAlert } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Field } from "@/components/ui/form/field";
import { PasswordInput } from "@/components/ui/form/password-input";
import { Button } from "@/components/ui/buttons/button";
import { FormError } from "@/components/ui/feedback/form-error";
import { AuthHeader } from "@/components/auth/auth-header";
import { BackToSignIn } from "@/components/auth/back-to-sign-in";
import { PasswordRequirements } from "@/components/auth/password-requirements";
import type { ResetPasswordInput } from "@/lib/schemas/auth";

export type ResetPasswordStatus = "checking" | "ready" | "no-session";

export interface ResetPasswordFormProps {
  register: UseFormRegister<ResetPasswordInput>;
  errors: FieldErrors<ResetPasswordInput>;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  passwordValue: string;
  formError?: string;
  status: ResetPasswordStatus;
}

export function ResetPasswordForm({
  register,
  errors,
  isSubmitting,
  onSubmit,
  passwordValue,
  formError,
  status,
}: ResetPasswordFormProps): React.JSX.Element {
  if (status === "no-session") {
    return (
      <div>
        <AuthHeader
          icon={
            <TriangleAlert
              className="h-6 w-6"
              strokeWidth={1.8}
              aria-hidden="true"
            />
          }
          title="Reset link expired"
          subtitle="This password reset link has expired or is no longer valid. Request a new one to continue."
        />
        <FormError message={formError} />
        <Button asChild block>
          <a href="/forgot-password">Request a new link</a>
        </Button>
        <BackToSignIn />
      </div>
    );
  }

  const checking = status === "checking";

  return (
    <div>
      <AuthHeader
        title="Choose a new password"
        subtitle="Your new password must be different from any you've used before."
      />
      <FormError message={formError} />
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <Field
            id="password"
            label="New password"
            error={errors.password?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={checking}
              {...register("password")}
            />
          </Field>
        </div>
        <div className="mb-[18px]">
          <Field
            id="confirmPassword"
            label="Confirm password"
            error={errors.confirmPassword?.message}
          >
            <PasswordInput
              autoComplete="new-password"
              placeholder="••••••••"
              disabled={checking}
              {...register("confirmPassword")}
            />
          </Field>
        </div>
        <div className="mb-[22px]">
          <PasswordRequirements value={passwordValue} />
        </div>
        <Button type="submit" block loading={isSubmitting} disabled={checking}>
          {checking ? "Verifying reset link…" : "Reset password"}
        </Button>
      </form>
      <BackToSignIn />
    </div>
  );
}
