import * as React from "react";
import { Mail } from "lucide-react";
import { Controller, type Control, type FieldErrors } from "react-hook-form";
import { OtpInput } from "@/components/ui/form/otp-input";
import { Button } from "@/components/ui/buttons/button";
import { FormError } from "@/components/ui/feedback/form-error";
import { AuthHeader } from "@/components/auth/auth-header";
import { BackToSignIn } from "@/components/auth/back-to-sign-in";
import type { VerifyOtpInput } from "@/lib/schemas/auth";

export interface VerifyOtpFormProps {
  control: Control<VerifyOtpInput>;
  errors: FieldErrors<VerifyOtpInput>;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  email?: string;
  onResend: () => void;
  resendIn: number;
  formError?: string;
}

export function VerifyOtpForm({
  control,
  errors,
  isSubmitting,
  onSubmit,
  email,
  onResend,
  resendIn,
  formError,
}: VerifyOtpFormProps): React.JSX.Element {
  const subtitle = email ? (
    <>
      We sent a 6-digit code to{" "}
      <span className="font-semibold text-text">{email}</span>. Enter it below to
      verify your account.
    </>
  ) : (
    "We sent a 6-digit code to your email. Enter it below to verify your account."
  );

  return (
    <div>
      <AuthHeader
        icon={<Mail className="h-6 w-6" strokeWidth={1.8} aria-hidden="true" />}
        title="Check your email"
        subtitle={subtitle}
      />
      <FormError message={formError} />
      <form onSubmit={onSubmit} noValidate>
        <Controller
          control={control}
          name="code"
          render={({ field }) => (
            <div className="mb-6 flex flex-col gap-2">
              <OtpInput
                id="code"
                value={field.value}
                onChange={field.onChange}
                autoFocus
                error={Boolean(errors.code)}
                aria-describedby={errors.code ? "code-error" : undefined}
              />
              {errors.code ? (
                <p id="code-error" className="text-[13px] text-danger-text">
                  {errors.code.message}
                </p>
              ) : null}
            </div>
          )}
        />
        <Button type="submit" block loading={isSubmitting}>
          Verify email
        </Button>
      </form>
      <p className="mt-5 text-center text-[13.5px] text-text-muted">
        Didn&apos;t receive it?{" "}
        {resendIn > 0 ? (
          <span className="font-medium text-text-disabled">
            Resend in {resendIn}s
          </span>
        ) : (
          <button
            type="button"
            onClick={onResend}
            className="cursor-pointer rounded-md font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus"
          >
            Resend code
          </button>
        )}
      </p>
      <BackToSignIn />
    </div>
  );
}
