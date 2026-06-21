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

// Wizard steps — named constants (no magic step strings). The order array drives
// navigation; the final step (GO_LIVE) submits.
export const Step = {
  BUSINESS: "business",
  SERVICES: "services",
  HOURS: "hours",
  TEAM: "team",
  GO_LIVE: "go-live",
} as const;
export type Step = (typeof Step)[keyof typeof Step];

export const STEP_ORDER: Step[] = [
  Step.BUSINESS,
  Step.SERVICES,
  Step.HOURS,
  Step.TEAM,
  Step.GO_LIVE,
];

// Live slug-availability states for the GO_LIVE field (drives border + message).
export const SlugStatus = {
  IDLE: "idle",
  CHECKING: "checking",
  AVAILABLE: "available",
  TAKEN: "taken",
  INVALID: "invalid",
  RESERVED: "reserved",
} as const;
export type SlugStatus = (typeof SlugStatus)[keyof typeof SlugStatus];

// Business-local weekday model. 0 = Sun .. 6 = Sat — the convention the
// availability engine reads (JS getDay / time.ts localWeekday).
export const WEEKDAYS = [
  { value: 0, label: "Sun" },
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
] as const;

export const TeamMemberInput = z.object({
  name: z.string().min(1, "Enter a name.").max(120, "Name is too long."),
  // Optional: empty string means "create the resource, no login invite yet".
  email: z
    .union([z.string().email("Enter a valid email."), z.literal("")])
    .optional(),
});

export type TeamMemberInput = z.infer<typeof TeamMemberInput>;

// One service the business offers. `price` is whole Lek (currency ALL, exponent
// 0), mapped 1:1 to `price_cents` server-side. Buffers default 0 (edited later).
export const ServiceInput = z.object({
  name: z.string().min(1, "Enter a service name.").max(120, "Name is too long."),
  durationMin: z
    .number({ message: "Enter a duration." })
    .int("Duration must be a whole number from 5 to 480 minutes.")
    .min(5, "Duration must be a whole number from 5 to 480 minutes.")
    .max(480, "Duration must be a whole number from 5 to 480 minutes."),
  price: z
    .number({ message: "Enter a price." })
    .int("Price must be a whole number of Lek (0 or more).")
    .min(0, "Price must be a whole number of Lek (0 or more)."),
});

export type ServiceInput = z.infer<typeof ServiceInput>;

// One weekday's schedule. start/end always carry a valid "HH:MM" (placeholder
// kept even when closed) so a closed weekend never fails the format check; the
// end-after-start rule is gated on `open`. Zero-padded "HH:MM" sorts correctly
// with a plain string compare, so no minute math is needed here.
export const DayHoursInput = z
  .object({
    weekday: z.number().int().min(0).max(6),
    open: z.boolean(),
    start: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time."),
    end: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time."),
  })
  .refine((d) => !d.open || d.end > d.start, {
    message: "End time must be after the start time.",
    path: ["end"],
  });

export type DayHoursInput = z.infer<typeof DayHoursInput>;

// Exactly 7 entries, Sun..Sat in order.
export const WorkingHoursInput = z.array(DayHoursInput).length(7);

export const SlugInput = z
  .string()
  .min(3, "Use 3–40 lowercase letters, numbers and single hyphens.")
  .max(40, "Use 3–40 lowercase letters, numbers and single hyphens.")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "Use 3–40 lowercase letters, numbers and single hyphens.",
  );

export const OnboardingInput = z
  .object({
    name: z
      .string()
      .min(1, "Enter your business name.")
      .max(120, "Name is too long."),
    vertical: z.enum(VERTICALS),
    timezone: z.string().min(1, "Pick a timezone."),
    ownerIsResource: z.boolean(),
    team: z.array(TeamMemberInput),
    services: z.array(ServiceInput).min(1, "Add at least one service."),
    hours: WorkingHoursInput,
    slug: SlugInput,
  })
  .superRefine((v, ctx) => {
    // At least one bookable resource — else the business can take no bookings.
    if (!v.ownerIsResource && v.team.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["team"],
        message:
          "Add yourself as bookable or add at least one team member.",
      });
    }
    // Reject duplicate team emails up front (clean field error instead of a
    // rolled-back insert). Owner-vs-team email collision is checked server-side
    // (the client can't know the owner's email).
    const emails = v.team
      .map((t) => t.email?.trim().toLowerCase())
      .filter((e): e is string => Boolean(e));
    const dup = emails.find((e, i) => emails.indexOf(e) !== i);
    if (dup) {
      ctx.addIssue({
        code: "custom",
        path: ["team"],
        message: `Two team members share the email "${dup}". Each email must be unique.`,
      });
    }
    // At least one open day with valid hours.
    if (!v.hours.some((d) => d.open)) {
      ctx.addIssue({
        code: "custom",
        path: ["hours"],
        message: "Open on at least one day.",
      });
    }
  });

export type OnboardingInput = z.infer<typeof OnboardingInput>;
