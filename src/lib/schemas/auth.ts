import { z } from "zod";

export const SignInInput = z.object({
  email: z.string().email("Enter a valid email address."),
  password: z.string().min(8, "Password must be at least 8 characters."),
  // No .default() — that splits zod's input/output types and breaks the RHF
  // resolver. The form supplies `false` via defaultValues instead.
  remember: z.boolean(),
});

export type SignInInput = z.infer<typeof SignInInput>;

export const SignUpInput = z
  .object({
    name: z.string().min(1, "Enter your name.").max(120, "Name is too long."),
    email: z.string().email("Enter a valid email address."),
    password: z.string().min(8, "Password must be at least 8 characters."),
    acceptTerms: z.boolean(),
  })
  .refine((data) => data.acceptTerms, {
    message: "Please accept the terms to continue.",
    path: ["acceptTerms"],
  });

export type SignUpInput = z.infer<typeof SignUpInput>;

export const VerifyOtpInput = z.object({
  code: z
    .string()
    .length(6, "Enter the 6-digit code.")
    .regex(/^\d{6}$/, "The code must be 6 digits."),
});

export type VerifyOtpInput = z.infer<typeof VerifyOtpInput>;

export const ForgotPasswordInput = z.object({
  email: z.string().email("Enter a valid email address."),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordInput>;

// Mirrors the live requirements checklist on the reset screen.
export const PASSWORD_RULES = {
  minLength: (value: string): boolean => value.length >= 8,
  uppercase: (value: string): boolean => /[A-Z]/.test(value),
  number: (value: string): boolean => /[0-9]/.test(value),
};

export const ResetPasswordInput = z
  .object({
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .regex(/[A-Z]/, "Add at least one uppercase letter.")
      .regex(/[0-9]/, "Add at least one number."),
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match.",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof ResetPasswordInput>;
