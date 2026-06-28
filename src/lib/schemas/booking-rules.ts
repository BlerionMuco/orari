import { z } from "zod";

// Valid slot granularities. Engine assumes the granularity divides 60 cleanly
// so a customer-facing slot list aligns to whole hours.
export const SLOT_GRANULARITY_OPTIONS = [5, 10, 15, 20, 30, 60] as const;
export type SlotGranularity = (typeof SLOT_GRANULARITY_OPTIONS)[number];

// Lead time is stored in minutes; the form edits hours and the action converts.
// Cap at 14 days so a typo doesn't make the business unbookable.
const LEAD_TIME_HOURS_MAX = 24 * 14;
const ADVANCE_WINDOW_DAYS_MIN = 1;
const ADVANCE_WINDOW_DAYS_MAX = 365;

// Literal union keeps RHF's input/output types aligned (a refine() would split
// them and the resolver would complain).
const SlotGranularitySchema = z.union([
  z.literal(5),
  z.literal(10),
  z.literal(15),
  z.literal(20),
  z.literal(30),
  z.literal(60),
]);

export const BookingRulesFormInput = z.object({
  leadTimeHours: z
    .number()
    .int()
    .min(0)
    .max(LEAD_TIME_HOURS_MAX),
  advanceWindowDays: z
    .number()
    .int()
    .min(ADVANCE_WINDOW_DAYS_MIN)
    .max(ADVANCE_WINDOW_DAYS_MAX),
  slotGranularityMin: SlotGranularitySchema,
});
export type BookingRulesFormInput = z.infer<typeof BookingRulesFormInput>;
