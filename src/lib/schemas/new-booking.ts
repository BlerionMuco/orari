import { z } from "zod";

// Dashboard "new booking" form. Mirrors CreateBookingInput's shape but with
// `resourceId` as `null` (instead of `undefined`) for "Any available" — RHF
// works more cleanly with nullable than with optional, and the action maps it.
export const NewBookingFormInput = z.object({
  serviceIds: z
    .array(z.string().uuid())
    .min(1)
    .max(10)
    .refine((ids) => new Set(ids).size === ids.length, {
      message: "Each service can be selected only once.",
    }),
  resourceId: z.string().uuid().nullable(),
  startsAt: z.coerce.date(),
  customerName: z.string().min(1, "Name is required").max(120),
  customerPhone: z.string().min(3, "Phone is required").max(40),
  customerEmail: z
    .union([z.string().email(), z.literal("")])
    .optional()
    .transform((v) => (v === "" || v === undefined ? undefined : v)),
  notes: z.string().max(2000).optional(),
});

export type NewBookingFormInput = z.infer<typeof NewBookingFormInput>;
