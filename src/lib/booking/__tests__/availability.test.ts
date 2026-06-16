import { describe, it, expect } from "vitest";
import {
  generateSlotsForResource,
  overlapsHalfOpen,
  validateSlot,
} from "../availability";
import { localPartsToUtc } from "../time";
import type { BookingRules, BusyInterval, ResourceSlotInput } from "../types";

const TZ = "Europe/Tirane";
// 2025-07-15 is a Tuesday (weekday 2), summer offset +02:00.
const TUE = 2;

const RULES: BookingRules = {
  slotGranularityMin: 30,
  leadTimeMin: 0,
  advanceWindowDays: 365,
};

function localUtc(isoDate: string, minute: number): Date {
  const { utc } = localPartsToUtc(isoDate, minute, TZ);
  return utc;
}

function busyLocal(isoDate: string, startMin: number, endMin: number): BusyInterval {
  return { start: localUtc(isoDate, startMin), end: localUtc(isoDate, endMin) };
}

function base(overrides: Partial<ResourceSlotInput> = {}): ResourceSlotInput {
  return {
    resourceId: "r1",
    isoDates: ["2025-07-15"],
    timeZone: TZ,
    durationMin: 30,
    beforeBufferMin: 0,
    afterBufferMin: 0,
    rules: RULES,
    workingWindows: [{ weekday: TUE, startMinute: 540, endMinute: 600 }], // 09:00–10:00
    busy: [],
    now: new Date("2025-07-01T00:00:00Z"),
    ...overrides,
  };
}

const labels = (input: ResourceSlotInput): string[] =>
  generateSlotsForResource(input).map((s) => s.localTimeLabel);

describe("overlapsHalfOpen", () => {
  it("treats touching endpoints as non-overlapping", () => {
    const a0 = new Date("2025-07-15T09:00:00Z");
    const a1 = new Date("2025-07-15T10:00:00Z");
    const b0 = new Date("2025-07-15T10:00:00Z");
    const b1 = new Date("2025-07-15T11:00:00Z");
    expect(overlapsHalfOpen(a0, a1, b0, b1)).toBe(false);
    expect(overlapsHalfOpen(a0, a1, new Date("2025-07-15T09:59:00Z"), b1)).toBe(true);
  });
});

describe("hours only", () => {
  it("steps candidates that fit the window", () => {
    expect(labels(base())).toEqual(["09:00", "09:30"]);
  });

  it("drops a trailing partial slot when granularity doesn't divide the window", () => {
    // 60-min window, 30-min service, 45-min stride → only 09:00 fits.
    expect(labels(base({ rules: { ...RULES, slotGranularityMin: 45 } }))).toEqual([
      "09:00",
    ]);
  });

  it("returns nothing when the service is longer than the window", () => {
    expect(labels(base({ durationMin: 90 }))).toEqual([]);
  });

  it("allows the boundary slot start == windowEnd − duration", () => {
    expect(
      labels(base({ durationMin: 60, rules: { ...RULES, slotGranularityMin: 15 } })),
    ).toEqual(["09:00"]);
  });

  it("returns empty when no window matches the weekday", () => {
    expect(labels(base({ isoDates: ["2025-07-16"] }))).toEqual([]); // Wednesday
  });
});

describe("lead time", () => {
  it("drops starts before now + lead, keeping the boundary", () => {
    // now 07:30Z + 120min = 09:30 local cutoff; 09:00 dropped, 09:30 kept.
    expect(
      labels(
        base({
          now: new Date("2025-07-15T05:30:00Z"),
          rules: { ...RULES, leadTimeMin: 120 },
        }),
      ),
    ).toEqual(["09:30"]);
  });
});

describe("advance window", () => {
  it("drops days beyond today + advanceWindowDays", () => {
    const slots = generateSlotsForResource(
      base({
        isoDates: ["2025-07-15", "2025-07-16"],
        workingWindows: [
          { weekday: TUE, startMinute: 540, endMinute: 600 },
          { weekday: 3, startMinute: 540, endMinute: 600 }, // Wed
        ],
        now: new Date("2025-07-15T00:00:00Z"),
        rules: { ...RULES, advanceWindowDays: 0 },
      }),
    );
    expect(slots.every((s) => s.isoDate === "2025-07-15")).toBe(true);
    expect(slots.length).toBeGreaterThan(0);
  });
});

describe("time-off / busy subtraction", () => {
  it("removes a slot overlapping a busy interval, keeps the adjacent one", () => {
    const busy = [busyLocal("2025-07-15", 540, 570)]; // 09:00–09:30 blocked
    expect(labels(base({ busy }))).toEqual(["09:30"]);
  });
});

describe("buffers (candidate reserves its own)", () => {
  it("blocks candidates whose buffered range hits an existing booking", () => {
    // Window 09:00–12:00, 30-min service, 15-min after-buffer, 15-min stride.
    // Existing booking 10:00–10:30 local (no buffer).
    const input = base({
      workingWindows: [{ weekday: TUE, startMinute: 540, endMinute: 720 }],
      durationMin: 30,
      afterBufferMin: 15,
      rules: { ...RULES, slotGranularityMin: 15 },
      busy: [busyLocal("2025-07-15", 600, 630)],
    });
    const got = new Set(labels(input));
    expect(got.has("09:00")).toBe(true); // [09:00,09:45) clears 10:00
    expect(got.has("09:30")).toBe(false); // [09:30,10:15) hits the booking
    expect(got.has("10:00")).toBe(false); // [10:00,10:45) hits the booking
    expect(got.has("10:30")).toBe(true); // [10:30,11:15) starts at booking end
  });
});

describe("zero-buffer adjacency (half-open proof)", () => {
  it("allows back-to-back slots touching a booking at buffer 0", () => {
    // Booking 09:30–10:00; with no buffers, 09:00 and 10:00 are bookable.
    const input = base({
      workingWindows: [{ weekday: TUE, startMinute: 540, endMinute: 660 }], // 09:00–11:00
      busy: [busyLocal("2025-07-15", 570, 600)], // 09:30–10:00
    });
    const got = new Set(labels(input));
    expect(got.has("09:00")).toBe(true); // ends exactly at booking start
    expect(got.has("09:30")).toBe(false); // is the booking
    expect(got.has("10:00")).toBe(true); // starts exactly at booking end
  });
});

describe("split shifts", () => {
  it("honors a lunch gap between two windows on the same weekday", () => {
    const input = base({
      durationMin: 60,
      rules: { ...RULES, slotGranularityMin: 60 },
      workingWindows: [
        { weekday: TUE, startMinute: 540, endMinute: 720 }, // 09:00–12:00
        { weekday: TUE, startMinute: 780, endMinute: 1020 }, // 13:00–17:00
      ],
    });
    const got = new Set(labels(input));
    expect(got.has("11:00")).toBe(true);
    expect(got.has("12:00")).toBe(false); // lunch
    expect(got.has("13:00")).toBe(true);
  });
});

describe("overnight window crossing midnight", () => {
  it("generates slots that spill into the next local day", () => {
    const slots = generateSlotsForResource(
      base({
        durationMin: 60,
        rules: { ...RULES, slotGranularityMin: 60 },
        workingWindows: [{ weekday: TUE, startMinute: 1320, endMinute: 1560 }], // 22:00–02:00
      }),
    );
    expect(slots.map((s) => s.localTimeLabel)).toEqual([
      "22:00",
      "23:00",
      "00:00",
      "01:00",
    ]);
    // All anchored to the working day; the spilled starts wrap their local minute.
    expect(slots.every((s) => s.isoDate === "2025-07-15")).toBe(true);
    expect(slots.map((s) => s.startMinuteLocal)).toEqual([1320, 1380, 0, 60]);
  });
});

describe("DST spring-forward day", () => {
  it("skips the non-existent 02:00–03:00 local hour", () => {
    // 2025-03-30 is a Sunday (weekday 0); clocks jump 02:00 → 03:00.
    const input = base({
      isoDates: ["2025-03-30"],
      durationMin: 30,
      rules: { ...RULES, slotGranularityMin: 30 },
      workingWindows: [{ weekday: 0, startMinute: 60, endMinute: 240 }], // 01:00–04:00
      now: new Date("2025-03-01T00:00:00Z"),
    });
    expect(labels(input)).toEqual(["01:00", "01:30", "03:00", "03:30"]);
  });
});

describe("validateSlot (set membership)", () => {
  const offGridInput: Omit<ResourceSlotInput, "now"> & { now: Date } = base({
    workingWindows: [{ weekday: TUE, startMinute: 547, endMinute: 720 }], // opens 09:07
    rules: { ...RULES, slotGranularityMin: 15 },
  });

  it("accepts a real generated start", () => {
    const slots = generateSlotsForResource(offGridInput);
    const real = slots[0].startUtc;
    expect(
      validateSlot({
        resourceId: "r1",
        startUtc: real,
        timeZone: TZ,
        durationMin: offGridInput.durationMin,
        beforeBufferMin: 0,
        afterBufferMin: 0,
        rules: offGridInput.rules,
        workingWindows: offGridInput.workingWindows,
        busy: [],
        now: offGridInput.now,
      }).ok,
    ).toBe(true);
  });

  it("rejects an off-grid start the generator would never emit", () => {
    const offGrid = localUtc("2025-07-15", 540); // 09:00, but window opens 09:07
    const result = validateSlot({
      resourceId: "r1",
      startUtc: offGrid,
      timeZone: TZ,
      durationMin: offGridInput.durationMin,
      beforeBufferMin: 0,
      afterBufferMin: 0,
      rules: offGridInput.rules,
      workingWindows: offGridInput.workingWindows,
      busy: [],
      now: offGridInput.now,
    });
    expect(result.ok).toBe(false);
    expect(result.reason).toBe("not-a-generated-slot");
  });

  it("accepts an overnight slot anchored to the previous working day", () => {
    // 22:00–02:00 window on Tuesday; the 00:00 slot's instant is on Wednesday,
    // but validateSlot must still find it by regenerating the prior day.
    const overnight = base({
      durationMin: 60,
      rules: { ...RULES, slotGranularityMin: 60 },
      workingWindows: [{ weekday: TUE, startMinute: 1320, endMinute: 1560 }],
    });
    const midnight = generateSlotsForResource(overnight).find(
      (s) => s.localTimeLabel === "00:00",
    );
    expect(midnight).toBeDefined();
    if (!midnight) return;
    const result = validateSlot({
      resourceId: "r1",
      startUtc: midnight.startUtc,
      timeZone: TZ,
      durationMin: 60,
      beforeBufferMin: 0,
      afterBufferMin: 0,
      rules: { ...RULES, slotGranularityMin: 60 },
      workingWindows: overnight.workingWindows,
      busy: [],
      now: overnight.now,
    });
    expect(result.ok).toBe(true);
  });
});
