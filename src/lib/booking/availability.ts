// Pure slot generation — no DB, no IO, `now` injected. This computes bookable
// slots by the spec's layered subtraction, expressed equivalently as two
// per-candidate checks (cheaper and less bug-prone than explicit interval
// subtraction, identical result):
//
//   A candidate's buffer-inclusive reserved range R = [start - before, end + after)
//   is bookable iff:
//     (1) R fits entirely inside its working window, AND
//     (2) R does not overlap any busy interval (time-off ∪ existing bookings'
//         reserved ranges), AND
//     (3) it satisfies lead time and the advance window.
//
//   free_interval = window ∩ ¬busy, so "R ⊆ window AND R ∩ busy = ∅" is exactly
//   "R ⊆ some free interval". Existing bookings arrive already buffer-expanded
//   (queries.loadBusyIntervals), so the overlap test mirrors the DB EXCLUDE
//   constraint on `reserved_range` — including back-to-back at buffer 0.

import type {
  ResourceSlotInput,
  Slot,
  SlotValidationInput,
  SlotValidationResult,
} from "./types";
import {
  localPartsToUtc,
  localWeekday,
  localIsoDate,
  addDaysToIsoDate,
  formatLocalTimeLabel,
} from "./time";
import { MINUTES_PER_DAY } from "./constants";

function addMinutes(d: Date, minutes: number): Date {
  return new Date(d.getTime() + minutes * 60_000);
}

// Half-open overlap: [aStart, aEnd) ∩ [bStart, bEnd) ≠ ∅. Equal touch-points
// (aEnd == bStart) do NOT overlap — matching the tstzrange '[)' constraint.
export function overlapsHalfOpen(
  aStart: Date,
  aEnd: Date,
  bStart: Date,
  bEnd: Date,
): boolean {
  return aStart.getTime() < bEnd.getTime() && bStart.getTime() < aEnd.getTime();
}

export function generateSlotsForResource(input: ResourceSlotInput): Slot[] {
  const {
    resourceId,
    isoDates,
    timeZone,
    durationMin,
    beforeBufferMin,
    afterBufferMin,
    rules,
    workingWindows,
    busy,
    now,
  } = input;

  const leadCutoff = addMinutes(now, rules.leadTimeMin);
  const todayLocal = localIsoDate(now, timeZone);
  const latestDay = addDaysToIsoDate(todayLocal, rules.advanceWindowDays);

  const slots: Slot[] = [];

  for (const isoDate of isoDates) {
    // Advance window is a whole-day horizon (string compare is valid for ISO dates).
    if (isoDate > latestDay) continue;

    const weekday = localWeekday(isoDate, timeZone);
    for (const window of workingWindows) {
      if (window.weekday !== weekday) continue;

      for (
        let m = window.startMinute;
        m + durationMin + afterBufferMin <= window.endMinute;
        m += rules.slotGranularityMin
      ) {
        // The candidate's reserved range must sit inside the working window.
        if (m - beforeBufferMin < window.startMinute) continue;

        const { utc: startUtc, existed } = localPartsToUtc(isoDate, m, timeZone);
        if (!existed) continue; // spring-forward gap

        if (startUtc.getTime() < leadCutoff.getTime()) continue; // lead time

        const endUtc = addMinutes(startUtc, durationMin);
        const reservedStart = addMinutes(startUtc, -beforeBufferMin);
        const reservedEnd = addMinutes(endUtc, afterBufferMin);

        const blocked = busy.some((b) =>
          overlapsHalfOpen(reservedStart, reservedEnd, b.start, b.end),
        );
        if (blocked) continue;

        slots.push({
          resourceId,
          startUtc,
          endUtc,
          isoDate,
          localTimeLabel: formatLocalTimeLabel(startUtc, timeZone),
          startMinuteLocal: m % MINUTES_PER_DAY,
        });
      }
    }
  }

  slots.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  return slots;
}

export function generateSlots(inputs: ResourceSlotInput[]): Slot[] {
  const all = inputs.flatMap((input) => generateSlotsForResource(input));
  all.sort((a, b) => a.startUtc.getTime() - b.startUtc.getTime());
  return all;
}

// Re-validate a single proposed start by SET MEMBERSHIP: regenerate the slots
// for that resource and confirm the exact instant is one of them. This is
// stricter than predicate checks — it can't accept a start the generator would
// never emit (e.g. a window opening at 09:07 with a 15-min stride). The DB
// EXCLUDE constraint is still the final backstop for the race.
//
// An overnight window (e.g. 22:00–02:00) is anchored to its working day, so a
// 00:00 slot's instant lands on the NEXT local date. Regenerate both that date
// and the prior one so such a slot is still found.
export function validateSlot(input: SlotValidationInput): SlotValidationResult {
  const day = localIsoDate(input.startUtc, input.timeZone);
  const isoDates = [addDaysToIsoDate(day, -1), day];
  const slots = generateSlotsForResource({
    resourceId: input.resourceId,
    isoDates,
    timeZone: input.timeZone,
    durationMin: input.durationMin,
    beforeBufferMin: input.beforeBufferMin,
    afterBufferMin: input.afterBufferMin,
    rules: input.rules,
    workingWindows: input.workingWindows,
    busy: input.busy,
    now: input.now,
  });
  const target = input.startUtc.getTime();
  const ok = slots.some((s) => s.startUtc.getTime() === target);
  return ok ? { ok: true } : { ok: false, reason: "not-a-generated-slot" };
}
