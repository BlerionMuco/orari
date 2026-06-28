import { z } from "zod";
import { DayHoursInput, WorkingHoursInput } from "@/lib/schemas/onboarding";

// Same 7-day shape as onboarding — same end>start rule and "HH:MM" format —
// re-exported here so the dashboard editor and the onboarding wizard share a
// single source of validation.
export { DayHoursInput };

// Editor input: which resource we're saving for + the seven day rows.
export const HoursFormInput = z.object({
  resourceId: z.string().uuid(),
  hours: WorkingHoursInput,
});

export type HoursFormInput = z.infer<typeof HoursFormInput>;
