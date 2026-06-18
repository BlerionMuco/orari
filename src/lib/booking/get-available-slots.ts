import "server-only";
import { MINUTES_PER_DAY } from "./constants";
import { eachLocalDate, localPartsToUtc } from "./time";
import { generateSlotsForResource } from "./availability";
import {
  loadActiveResources,
  loadBusyIntervals,
  loadResourceContext,
  loadServiceContext,
  loadWorkingWindows,
} from "./queries";
import type { Slot } from "./types";

export interface GetAvailableSlotsArgs {
  businessId: string;
  resourceId: string;
  serviceId: string;
  rangeStartDate: string; // business-local "YYYY-MM-DD", inclusive
  rangeEndDate: string; // business-local "YYYY-MM-DD", inclusive
  now?: Date; // injected UTC "now"; defaults to wall-clock now
}

export interface AvailableSlotsResult {
  timezone: string;
  slots: Slot[];
}

// Orchestrates the pure engine: load + tenant-validate context, fetch working
// windows and busy intervals, then run `generateSlotsForResource`. Returns an
// empty result (no throw) when the resource/service is missing or inactive.
export async function getAvailableSlots(
  args: GetAvailableSlotsArgs,
): Promise<AvailableSlotsResult> {
  const ctx = await loadResourceContext(
    args.businessId,
    args.resourceId,
    args.serviceId,
  );
  if (!ctx) return { timezone: "UTC", slots: [] };

  const { business, resource, service, rules } = ctx;
  const timeZone = business.timezone;
  const now = args.now ?? new Date();

  const isoDates = eachLocalDate(args.rangeStartDate, args.rangeEndDate);

  // UTC bounds for the busy query: local midnight of the first day through local
  // midnight after the last day, padded generously (buffers + a day to cover
  // overnight windows) so an edge booking's buffer can't be missed.
  const rangeStartUtc = localPartsToUtc(args.rangeStartDate, 0, timeZone).utc;
  const rangeEndUtc = localPartsToUtc(
    args.rangeEndDate,
    MINUTES_PER_DAY,
    timeZone,
  ).utc;
  const padMs =
    (service.beforeBufferMin + service.afterBufferMin + MINUTES_PER_DAY) *
    60_000;
  const busyStart = new Date(rangeStartUtc.getTime() - padMs);
  const busyEnd = new Date(rangeEndUtc.getTime() + padMs);

  const [workingWindows, busy] = await Promise.all([
    loadWorkingWindows(resource.id),
    loadBusyIntervals(business.id, resource.id, busyStart, busyEnd),
  ]);

  const slots = generateSlotsForResource({
    resourceId: resource.id,
    isoDates,
    timeZone,
    durationMin: service.durationMin,
    beforeBufferMin: service.beforeBufferMin,
    afterBufferMin: service.afterBufferMin,
    rules,
    workingWindows,
    busy,
    now,
  });

  return { timezone: timeZone, slots };
}

export interface GetUnionAvailabilityArgs {
  businessId: string;
  serviceId: string;
  rangeStartDate: string; // business-local "YYYY-MM-DD", inclusive
  rangeEndDate: string; // business-local "YYYY-MM-DD", inclusive
  now?: Date;
}

// "Any available": the union of every active resource's open slots for a
// service, deduped by start instant. Crucially this runs the SAME per-resource
// loads as the single-resource path for EACH resource — its own working hours,
// time-off and bookings — so a barber who's off on Monday contributes no Monday
// slots. It must NOT collapse to one business-wide calendar. The deduped slot's
// `resourceId` is incidental (a concrete resource is chosen server-side at
// booking time); the public response drops it.
export async function getUnionAvailability(
  args: GetUnionAvailabilityArgs,
): Promise<AvailableSlotsResult> {
  const ctx = await loadServiceContext(args.businessId, args.serviceId);
  if (!ctx) return { timezone: "UTC", slots: [] };

  const { business, service, rules } = ctx;
  const timeZone = business.timezone;
  const now = args.now ?? new Date();

  const resources = await loadActiveResources(args.businessId);
  if (resources.length === 0) return { timezone: timeZone, slots: [] };

  const isoDates = eachLocalDate(args.rangeStartDate, args.rangeEndDate);

  const rangeStartUtc = localPartsToUtc(args.rangeStartDate, 0, timeZone).utc;
  const rangeEndUtc = localPartsToUtc(
    args.rangeEndDate,
    MINUTES_PER_DAY,
    timeZone,
  ).utc;
  const padMs =
    (service.beforeBufferMin + service.afterBufferMin + MINUTES_PER_DAY) *
    60_000;
  const busyStart = new Date(rangeStartUtc.getTime() - padMs);
  const busyEnd = new Date(rangeEndUtc.getTime() + padMs);

  // Per-resource generation, then union by start instant (first wins).
  const perResource = await Promise.all(
    resources.map(async (resource) => {
      const [workingWindows, busy] = await Promise.all([
        loadWorkingWindows(resource.id),
        loadBusyIntervals(business.id, resource.id, busyStart, busyEnd),
      ]);
      return generateSlotsForResource({
        resourceId: resource.id,
        isoDates,
        timeZone,
        durationMin: service.durationMin,
        beforeBufferMin: service.beforeBufferMin,
        afterBufferMin: service.afterBufferMin,
        rules,
        workingWindows,
        busy,
        now,
      });
    }),
  );

  const byInstant = new Map<number, Slot>();
  for (const slot of perResource.flat()) {
    const key = slot.startUtc.getTime();
    if (!byInstant.has(key)) byInstant.set(key, slot);
  }

  const slots = [...byInstant.values()].sort(
    (a, b) => a.startUtc.getTime() - b.startUtc.getTime(),
  );

  return { timezone: timeZone, slots };
}
