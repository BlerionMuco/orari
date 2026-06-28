import { z } from "zod";

// Dashboard service form. Distinct from the onboarding `ServiceInput` because
// the dashboard surfaces buffers + an active flag (onboarding hides both —
// services are added there with sensible defaults). `price` is whole Lek for
// `ALL`; the server maps to integer `price_cents`. Buffers are minutes that
// pad the booking on each side via `before_buffer_min` / `after_buffer_min`.
export const ServiceFormInput = z.object({
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
  beforeBufferMin: z
    .number({ message: "Enter a buffer." })
    .int("Buffer must be 0–120 minutes.")
    .min(0, "Buffer must be 0–120 minutes.")
    .max(120, "Buffer must be 0–120 minutes."),
  afterBufferMin: z
    .number({ message: "Enter a buffer." })
    .int("Buffer must be 0–120 minutes.")
    .min(0, "Buffer must be 0–120 minutes.")
    .max(120, "Buffer must be 0–120 minutes."),
  active: z.boolean(),
});

export type ServiceFormInput = z.infer<typeof ServiceFormInput>;
