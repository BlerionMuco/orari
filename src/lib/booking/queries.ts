import "server-only";
import { asc, eq, gt, inArray, isNull, lt, or } from "drizzle-orm";
import { db } from "@/db/client";
import {
  bookings,
  bookingRules,
  businesses,
  outbox,
  resources,
  services,
  timeOff,
  workingHours,
  type Booking,
  type Business,
  type OutboxRow,
  type Resource,
  type Service,
} from "@/db/schema";
import { businessScope } from "@/lib/db/scoped";
import { DEFAULT_BOOKING_RULES } from "./constants";
import type { BookingRules, BusyInterval, WorkingWindow } from "./types";

// Statuses that occupy a slot (mirror the EXCLUDE constraint's WHERE).
const LIVE_STATUSES = ["held", "confirmed"] as const;

export interface ResourceContext {
  business: Business;
  resource: Resource;
  service: Service;
  rules: BookingRules;
}

// The booking_rules row for (business, service) wins over the business default
// (service_id NULL); fall back to code defaults when neither exists.
export async function resolveRules(
  businessId: string,
  serviceId: string,
): Promise<BookingRules> {
  const rows = await db
    .select()
    .from(bookingRules)
    .where(eq(bookingRules.businessId, businessId));
  const forService = rows.find((r) => r.serviceId === serviceId);
  const businessDefault = rows.find((r) => r.serviceId === null);
  const chosen = forService ?? businessDefault;
  if (!chosen) return DEFAULT_BOOKING_RULES;
  return {
    slotGranularityMin: chosen.slotGranularityMin,
    leadTimeMin: chosen.leadTimeMin,
    advanceWindowDays: chosen.advanceWindowDays,
  };
}

// Load and tenant-validate the business + resource + service for a booking. Any
// missing / inactive / cross-tenant input returns null (engine yields no slots).
export async function loadResourceContext(
  businessId: string,
  resourceId: string,
  serviceId: string,
): Promise<ResourceContext | null> {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!business) return null;

  const scope = businessScope(businessId);

  const [resource] = await db
    .select()
    .from(resources)
    .where(
      scope.where("resources", eq(resources.id, resourceId), eq(resources.active, true)),
    )
    .limit(1);
  if (!resource) return null;

  const [service] = await db
    .select()
    .from(services)
    .where(
      scope.where("services", eq(services.id, serviceId), eq(services.active, true)),
    )
    .limit(1);
  if (!service) return null;

  const rules = await resolveRules(businessId, serviceId);
  return { business, resource, service, rules };
}

export async function loadWorkingWindows(
  resourceId: string,
): Promise<WorkingWindow[]> {
  const rows = await db
    .select()
    .from(workingHours)
    .where(eq(workingHours.resourceId, resourceId));
  return rows.map((r) => ({
    weekday: r.weekday,
    startMinute: r.startMinute,
    endMinute: r.endMinute,
  }));
}

// Busy intervals overlapping [rangeStartUtc, rangeEndUtc): business-wide and
// resource time-off (used as-is) plus held/confirmed bookings expanded by their
// snapshotted buffers — the same range the EXCLUDE constraint guards. Pass a
// range already padded by the max buffer so edge bookings aren't missed.
export async function loadBusyIntervals(
  businessId: string,
  resourceId: string,
  rangeStartUtc: Date,
  rangeEndUtc: Date,
): Promise<BusyInterval[]> {
  const scope = businessScope(businessId);

  const offRows = await db
    .select()
    .from(timeOff)
    .where(
      scope.where(
        "timeOff",
        or(eq(timeOff.resourceId, resourceId), isNull(timeOff.resourceId)),
        lt(timeOff.startsAt, rangeEndUtc),
        gt(timeOff.endsAt, rangeStartUtc),
      ),
    );

  const bookingRows = await db
    .select()
    .from(bookings)
    .where(
      scope.where(
        "bookings",
        eq(bookings.resourceId, resourceId),
        inArray(bookings.status, [...LIVE_STATUSES]),
        lt(bookings.startsAt, rangeEndUtc),
        gt(bookings.endsAt, rangeStartUtc),
      ),
    );

  const busy: BusyInterval[] = offRows.map((r) => ({
    start: r.startsAt,
    end: r.endsAt,
  }));
  for (const b of bookingRows) {
    busy.push({
      start: new Date(b.startsAt.getTime() - b.beforeBufferMin * 60_000),
      end: new Date(b.endsAt.getTime() + b.afterBufferMin * 60_000),
    });
  }
  return busy;
}

// Tenant-scoped: idempotency keys are client-supplied and the unique index is
// global, so the lookup MUST be filtered by business or a caller booking at one
// business could receive another business's booking.
export async function findByIdempotencyKey(
  businessId: string,
  key: string,
): Promise<Booking | null> {
  const scope = businessScope(businessId);
  const [row] = await db
    .select()
    .from(bookings)
    .where(scope.where("bookings", eq(bookings.idempotencyKey, key)))
    .limit(1);
  return row ?? null;
}

// --- Outbox (post-commit side effects) ---

export async function loadUnprocessedOutbox(limit: number): Promise<OutboxRow[]> {
  return db
    .select()
    .from(outbox)
    .where(isNull(outbox.processedAt))
    .orderBy(asc(outbox.createdAt))
    .limit(limit);
}

export async function markOutboxProcessed(id: string): Promise<void> {
  await db.update(outbox).set({ processedAt: new Date() }).where(eq(outbox.id, id));
}
