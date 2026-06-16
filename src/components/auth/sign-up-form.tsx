import * as React from "react";
import Link from "next/link";
import {
  Controller,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import { Field } from "@/components/ui/form/field";
import { Input } from "@/components/ui/form/input";
import { PasswordInput } from "@/components/ui/form/password-input";
import { Checkbox } from "@/components/ui/form/checkbox";
import { Button } from "@/components/ui/buttons/button";
import { FormError } from "@/components/ui/feedback/form-error";
import { AuthHeader } from "@/components/auth/auth-header";
import type { SignUpInput } from "@/lib/schemas/auth";

export interface SignUpFormProps {
  register: UseFormRegister<SignUpInput>;
  control: Control<SignUpInput>;
  errors: FieldErrors<SignUpInput>;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  formError?: string;
}

const linkClass =
  "rounded-md font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus";

export function SignUpForm({
  register,
  control,
  errors,
  isSubmitting,
  onSubmit,
  formError,
}: SignUpFormProps): React.JSX.Element {
  return (
    <div>
      <AuthHeader
        title="Create your account"
        subtitle="Start booking in under a minute."
      />
      <FormError message={formError} />
      <form onSubmit={onSubmit} noValidate>
        <div className="mb-4">
          <Field id="name" label="Full name" error={errors.name?.message}>
            <Input
              type="text"
              autoComplete="name"
              placeholder="Jane Rossi"
              {...register("name")}
            />
          </Field>
        </div>
        <div className="mb-4">
          <Field id="email" label="Email" error={errors.email?.message}>
            <Input
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              {...register("email")}
            />
          </Field>
        </div>
        <div className="mb-[18px]">
          <Field id="password" label="Password" error={errors.password?.message}>
            <PasswordInput
              autoComplete="new-password"
              placeholder="At least 8 characters"
              {...register("password")}
            />
          </Field>
        </div>
        <Controller
          control={control}
          name="acceptTerms"
          render={({ field }) => (
            <div className="mb-[22px]">
              <label className="flex cursor-pointer items-start gap-[9px] text-[13px] leading-[1.45] text-text-muted">
                <Checkbox
                  className="mt-px"
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  aria-invalid={errors.acceptTerms ? true : undefined}
                />
                <span>
                  I agree to the{" "}
                  <Link href="/terms" className={linkClass}>
                    Terms
                  </Link>{" "}
                  and{" "}
                  <Link href="/privacy" className={linkClass}>
                    Privacy Policy
                  </Link>
                  .
                </span>
              </label>
              {errors.acceptTerms ? (
                <p className="mt-[7px] text-[13px] text-danger-text">
                  {errors.acceptTerms.message}
                </p>
              ) : null}
            </div>
          )}
        />
        <Button type="submit" block loading={isSubmitting}>
          Create account
        </Button>
      </form>
      <p className="mt-[22px] text-center text-[14px] text-text-muted">
        Already have an account?{" "}
        <Link href="/sign-in" className={linkClass}>
          Sign in
        </Link>
      </p>
    </div>
  );
}
