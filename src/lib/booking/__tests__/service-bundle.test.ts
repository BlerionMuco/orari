import { describe, it, expect } from "vitest";
import {
  buildServiceBundle,
  combineRules,
  type BundleServiceInput,
} from "../service-bundle";
import type { BookingRules } from "../types";

function svc(over: Partial<BundleServiceInput> & { id: string }): BundleServiceInput {
  return {
    name: over.id,
    durationMin: 30,
    priceCents: 1000,
    beforeBufferMin: 0,
    afterBufferMin: 0,
    ...over,
  };
}

describe("buildServiceBundle", () => {
  it("sums duration and price across services", () => {
    const bundle = buildServiceBundle([
      svc({ id: "a", durationMin: 30, priceCents: 2000 }),
      svc({ id: "b", durationMin: 45, priceCents: 1500 }),
    ]);
    expect(bundle.totalDurationMin).toBe(75);
    expect(bundle.totalPriceCents).toBe(3500);
  });

  it("takes the leading buffer from the first service, trailing from the last", () => {
    const bundle = buildServiceBundle([
      svc({ id: "a", beforeBufferMin: 10, afterBufferMin: 5 }),
      svc({ id: "b", beforeBufferMin: 99, afterBufferMin: 20 }),
    ]);
    // Inner buffers (a.after, b.before) are ignored — back-to-back block.
    expect(bundle.beforeBufferMin).toBe(10);
    expect(bundle.afterBufferMin).toBe(20);
  });

  it("buffer selection follows order, not magnitude", () => {
    const forward = buildServiceBundle([
      svc({ id: "a", beforeBufferMin: 10, afterBufferMin: 5 }),
      svc({ id: "b", beforeBufferMin: 0, afterBufferMin: 30 }),
    ]);
    const reversed = buildServiceBundle([
      svc({ id: "b", beforeBufferMin: 0, afterBufferMin: 30 }),
      svc({ id: "a", beforeBufferMin: 10, afterBufferMin: 5 }),
    ]);
    expect([forward.beforeBufferMin, forward.afterBufferMin]).toEqual([10, 30]);
    expect([reversed.beforeBufferMin, reversed.afterBufferMin]).toEqual([0, 5]);
  });

  it("emits items in execution order with 0-based positions", () => {
    const bundle = buildServiceBundle([svc({ id: "a" }), svc({ id: "b" }), svc({ id: "c" })]);
    expect(bundle.items.map((i) => i.serviceId)).toEqual(["a", "b", "c"]);
    expect(bundle.items.map((i) => i.position)).toEqual([0, 1, 2]);
    // Invariant: item 0 is the primary service.
    expect(bundle.items[0].serviceId).toBe("a");
  });

  it("handles a single-service basket (degenerate block)", () => {
    const bundle = buildServiceBundle([
      svc({ id: "a", durationMin: 40, priceCents: 2500, beforeBufferMin: 5, afterBufferMin: 15 }),
    ]);
    expect(bundle.totalDurationMin).toBe(40);
    expect(bundle.beforeBufferMin).toBe(5);
    expect(bundle.afterBufferMin).toBe(15);
    expect(bundle.items).toHaveLength(1);
  });

  it("throws on an empty basket", () => {
    expect(() => buildServiceBundle([])).toThrow();
  });
});

describe("combineRules", () => {
  const r = (
    leadTimeMin: number,
    advanceWindowDays: number,
    slotGranularityMin: number,
  ): BookingRules => ({ leadTimeMin, advanceWindowDays, slotGranularityMin });

  it("picks the most restrictive across the basket", () => {
    const combined = combineRules([r(120, 60, 15), r(240, 30, 20)]);
    // max lead, min advance, max granularity.
    expect(combined).toEqual({
      leadTimeMin: 240,
      advanceWindowDays: 30,
      slotGranularityMin: 20,
    });
  });

  it("is identity for a single rule set", () => {
    expect(combineRules([r(90, 45, 10)])).toEqual(r(90, 45, 10));
  });

  it("throws on no rules", () => {
    expect(() => combineRules([])).toThrow();
  });
});
