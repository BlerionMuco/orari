import { z } from "zod";

// Mirrors the `vertical` Postgres enum in src/db/schema.ts.
export const VERTICALS = [
  "barber",
  "clinic",
  "tutor",
  "spa",
  "fitness",
  "other",
] as const;

export const VERTICAL_LABELS: Record<(typeof VERTICALS)[number], string> = {
  barber: "Barber / Salon",
  clinic: "Clinic",
  tutor: "Tutor",
  spa: "Spa",
  fitness: "Fitness",
  other: "Other",
};

export const TeamMemberInput = z.object({
  name: z.string().min(1, "Enter a name.").max(120, "Name is too long."),
  // Optional: empty string means "create the resource, no login invite yet".
  email: z
    .union([z.string().email("Enter a valid email."), z.literal("")])
    .optional(),
});

export type TeamMemberInput = z.infer<typeof TeamMemberInput>;

export const OnboardingInput = z.object({
  name: z.string().min(1, "Enter your business name.").max(120, "Name is too long."),
  vertical: z.enum(VERTICALS),
  timezone: z.string().min(1, "Pick a timezone."),
  ownerIsResource: z.boolean(),
  team: z.array(TeamMemberInput),
});

export type OnboardingInput = z.infer<typeof OnboardingInput>;
