import * as React from "react";
import { Lock, MailCheck } from "lucide-react";
import type { FieldErrors, UseFormRegister } from "react-hook-form";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { Button } from "@/components/ui/buttons/button";
import { FormError } from "@/components/ui/feedback/form-error";
import { AuthHeader } from "@/components/auth/auth-header";
import { BackToSignIn } from "@/components/auth/back-to-sign-in";
import type { ForgotPasswordInput } from "@/lib/schemas/auth";

export interface ForgotPasswordFormProps {
  register: UseFormRegister<ForgotPasswordInput>;
  errors: FieldErrors<ForgotPasswordInput>;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  sent: boolean;
  submittedEmail?: string;
  formError?: string;
}

export function ForgotPasswordForm({
  register,
  errors,
  isSubmitting,
  onSubmit,
  sent,
  submittedEmail,
  formError,
}: ForgotPasswordFormProps): React.JSX.Element {
  if (sent) {
    return (
      <div>
        <AuthHeader
          icon={
            <MailCheck className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />
          }
          title="Check your email"
          subtitle={
            submittedEmail ? (
              <>
                We sent a reset link to{" "}
                <span className="font-semibold text-text">{submittedEmail}</span>{" "}
                if an account exists.
              </>
            ) : (
              "We sent a reset link if an account exists for that email."
            )
          }
        />
        <Button asChild block>
          <a href="/sign-in">Back to sign in</a>
        </Button>
      </div>
    );
  }

  return (
    <div>
      <AuthHeader
        icon={
          <Lock className="h-5.75 w-5.75" strokeWidth={1.8} aria-hidden="true" />
        }
        title="Forgot your password?"
        subtitle="Enter the email linked to your account and we'll send you a link to reset it."
      />
      <FormError message={formError} />
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-5.5">
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
          </Field>
        </div>
        <Button type="submit" block loading={isSubmitting}>
          Send reset link
        </Button>
      </form>
      <BackToSignIn />
    </div>
  );
}
