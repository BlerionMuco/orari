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
import { Label } from "@/components/ui/form/label";
import { PasswordInput } from "@/components/ui/form/password-input";
import { Checkbox } from "@/components/ui/form/checkbox";
import { Button } from "@/components/ui/buttons/button";
import { FormError } from "@/components/ui/feedback/form-error";
import { AuthHeader } from "@/components/auth/auth-header";
import type { SignInInput } from "@/lib/schemas/auth";

export interface SignInFormProps {
  register: UseFormRegister<SignInInput>;
  control: Control<SignInInput>;
  errors: FieldErrors<SignInInput>;
  isSubmitting: boolean;
  onSubmit: React.FormEventHandler<HTMLFormElement>;
  formError?: string;
}

const linkClass =
  "rounded-md font-medium text-primary transition-colors hover:text-primary-hover focus-visible:outline-hidden focus-visible:ring-[3px] focus-visible:ring-focus";

export function SignInForm({
  register,
  control,
  errors,
  isSubmitting,
  onSubmit,
  formError,
}: SignInFormProps): React.JSX.Element {
  return (
    <div>
      <AuthHeader
        title="Welcome back"
        subtitle="Sign in to manage your appointments."
      />
      <FormError message={formError} />
      <form onSubmit={onSubmit} noValidate>
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
        <div className="mb-1">
          <div className="mb-[7px] flex items-baseline justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className={`text-[12.5px] ${linkClass}`}>
              Forgot?
            </Link>
          </div>
          <PasswordInput
            id="password"
            autoComplete="current-password"
            error={Boolean(errors.password)}
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          {errors.password ? (
            <p id="password-error" className="mt-[7px] text-[13px] text-danger-text">
              {errors.password.message}
            </p>
          ) : null}
        </div>
        <Controller
          control={control}
          name="remember"
          render={({ field }) => (
            <label className="mt-4 mb-[22px] flex min-h-11 cursor-pointer items-center gap-[9px] text-[13.5px] text-text-muted">
              <Checkbox
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
              />
              Keep me signed in
            </label>
          )}
        />
        <Button type="submit" block loading={isSubmitting}>
          Sign in
        </Button>
      </form>
      <p className="mt-[22px] text-center text-[14px] text-text-muted">
        New to orari?{" "}
        <Link href="/sign-up" className={linkClass}>
          Create an account
        </Link>
      </p>
    </div>
  );
}
