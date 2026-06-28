import { z } from "zod";

// The three offset choices the UI exposes. Stored as int[] of minutes-before
// the booking start. "Both" = [1440, 60].
export const ReminderTiming = {
  ONE_DAY: "one_day",
  ONE_HOUR: "one_hour",
  BOTH: "both",
} as const;
export type ReminderTiming = (typeof ReminderTiming)[keyof typeof ReminderTiming];

export const REMINDER_OFFSETS_BY_TIMING: Record<ReminderTiming, number[]> = {
  [ReminderTiming.ONE_DAY]: [1440],
  [ReminderTiming.ONE_HOUR]: [60],
  [ReminderTiming.BOTH]: [1440, 60],
};

// Inverse: read int[] back into the UI choice. Unrecognized arrays fall back
// to ONE_DAY rather than crashing the form (a future timing can be added
// without making old data unrenderable).
export function timingFromOffsets(offsets: number[]): ReminderTiming {
  const sorted = [...offsets].sort((a, b) => a - b);
  const has60 = sorted.includes(60);
  const has1440 = sorted.includes(1440);
  if (has60 && has1440) return ReminderTiming.BOTH;
  if (has60) return ReminderTiming.ONE_HOUR;
  return ReminderTiming.ONE_DAY;
}

export const RemindersFormInput = z.object({
  enabled: z.boolean(),
  timing: z.enum([
    ReminderTiming.ONE_DAY,
    ReminderTiming.ONE_HOUR,
    ReminderTiming.BOTH,
  ]),
});
export type RemindersFormInput = z.infer<typeof RemindersFormInput>;
