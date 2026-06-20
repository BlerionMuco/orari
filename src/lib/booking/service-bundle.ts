// Pure aggregation of a multi-service basket into the single contiguous block
// the engine actually books. No DB, no IO — unit-testable in isolation.
//
// Order is execution order: the block runs its services in array order, so the
// block's LEADING buffer is the first service's before-buffer and its TRAILING
// buffer is the last service's after-buffer. Inner buffers between back-to-back
// services are intentionally ignored (no turnaround between stacked services),
// and total duration is the plain sum of service durations. This keeps the
// booking a single [start, end) block whose reserved_range the DB trigger and
// EXCLUDE constraint already guard — multi-service needs no constraint change.

import type { BookingRules } from "./types";

export interface BundleServiceInput {
  id: string;
  name: string;
  durationMin: number;
  priceCents: number;
  beforeBufferMin: number;
  afterBufferMin: number;
}

// One service's snapshot within the booking, in execution order.
export interface BundleItem {
  serviceId: string;
  name: string;
  durationMin: number;
  priceCents: number;
  beforeBufferMin: number;
  afterBufferMin: number;
  position: number; // 0-based; position 0 = the primary service
}

export interface ServiceBundle {
  totalDurationMin: number;
  beforeBufferMin: number; // first service's before-buffer (block leading)
  afterBufferMin: number; // last service's after-buffer (block trailing)
  totalPriceCents: number;
  items: BundleItem[]; // execution order; items[0] is the primary service
}

// Build the block aggregate from services already ordered as the customer chose.
// Throws on an empty basket — callers validate non-emptiness upstream (Zod
// `.min(1)` + loader resolution), so reaching here empty is a programmer error.
export function buildServiceBundle(
  services: BundleServiceInput[],
): ServiceBundle {
  if (services.length === 0) {
    throw new Error("buildServiceBundle: at least one service is required");
  }

  const items: BundleItem[] = services.map((s, i) => ({
    serviceId: s.id,
    name: s.name,
    durationMin: s.durationMin,
    priceCents: s.priceCents,
    beforeBufferMin: s.beforeBufferMin,
    afterBufferMin: s.afterBufferMin,
    position: i,
  }));

  return {
    totalDurationMin: services.reduce((a, s) => a + s.durationMin, 0),
    totalPriceCents: services.reduce((a, s) => a + s.priceCents, 0),
    beforeBufferMin: services[0].beforeBufferMin,
    afterBufferMin: services[services.length - 1].afterBufferMin,
    items,
  };
}

// Combine the per-service resolved rules into the MOST RESTRICTIVE set for the
// basket, so every selected service's policy is honoured at once:
//   - leadTimeMin       → max (the largest minimum-notice wins),
//   - advanceWindowDays → min (the smallest bookable horizon wins),
//   - slotGranularityMin→ max (coarsest start-step; every emitted start is then
//                              valid for all services).
// Pure so the combination logic is unit-tested without a DB.
export function combineRules(rules: BookingRules[]): BookingRules {
  if (rules.length === 0) {
    throw new Error("combineRules: at least one rule set is required");
  }
  return {
    leadTimeMin: Math.max(...rules.map((r) => r.leadTimeMin)),
    advanceWindowDays: Math.min(...rules.map((r) => r.advanceWindowDays)),
    slotGranularityMin: Math.max(...rules.map((r) => r.slotGranularityMin)),
  };
}
