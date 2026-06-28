import { z } from "zod";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const HH_MM = /^\d{2}:\d{2}$/;

// Block-time form. Times are business-local wall clocks (HH:MM); the action
// converts them to UTC via the booking engine's `localPartsToUtc` so DST is
// handled in one place. `resourceId === null` = business-wide closure (owner
// only — the action enforces it).
export const BlockTimeFormInput = z
  .object({
    resourceId: z.string().uuid().nullable(),
    date: z.string().regex(ISO_DATE, "Pick a date"),
    startTime: z.string().regex(HH_MM, "Pick a start time"),
    endTime: z.string().regex(HH_MM, "Pick an end time"),
    reason: z.string().max(200).optional(),
  })
  .refine((v) => v.endTime > v.startTime, {
    message: "End time must be after start time.",
    path: ["endTime"],
  });

export type BlockTimeFormInput = z.infer<typeof BlockTimeFormInput>;
