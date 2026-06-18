import "server-only";
import { asc, count, eq, gt, gte, inArray, isNull, lt, or } from "drizzle-orm";
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
import { LocationSchema } from "@/lib/schemas/business";
import { DEFAULT_BOOKING_RULES } from "./constants";
import type { BookingRules, BusyInterval, WorkingWindow } from "./types";
import type {
  PublicBusiness,
  PublicManageView,
  PublicResource,
  PublicService,
} from "./public-dto";

const LocationOrNull = LocationSchema.nullable();

// Statuses that occupy a slot (mirror the EXCLUDE constraint's WHERE).
const LIVE_STATUSES = ["held", "confirmed"] as const;

export interface ResourceContext {
  business: Business;
  resource: Resource;
  service: Service;
  rules: BookingRules;
}

// Business + service + rules without a specific resource — the shared context
// for the multi-resource ("any available") union and assignment paths, where the
// resource is chosen across all active resources rather than given.
export interface ServiceContext {
  business: Business;
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
  if (!chosen) {
    // create_business seeds a business-default row, so reaching here means the
    // invariant was bypassed (business inserted outside the RPC) — not normal.
    console.warn(
      `booking_rules missing for business ${businessId} (service ${serviceId}) — ` +
        `using DEFAULT_BOOKING_RULES (invariant violation)`,
    );
    return DEFAULT_BOOKING_RULES;
  }
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

// Like loadResourceContext but resource-agnostic: validates business + active
// service and resolves rules. Null when the business or active service is
// missing / cross-tenant.
export async function loadServiceContext(
  businessId: string,
  serviceId: string,
): Promise<ServiceContext | null> {
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);
  if (!business) return null;

  const scope = businessScope(businessId);
  const [service] = await db
    .select()
    .from(services)
    .where(
      scope.where("services", eq(services.id, serviceId), eq(services.active, true)),
    )
    .limit(1);
  if (!service) return null;

  const rules = await resolveRules(businessId, serviceId);
  return { business, service, rules };
}

// Active resource rows for a business (server-internal — never crossed to the
// client). Drives union availability and "any" assignment candidates. Ordered by
// id so any stable tie-break is deterministic.
export async function loadActiveResources(
  businessId: string,
): Promise<Resource[]> {
  const scope = businessScope(businessId);
  return db
    .select()
    .from(resources)
    .where(scope.where("resources", eq(resources.active, true)))
    .orderBy(asc(resources.id));
}

// A single resource by id, tenant-scoped. NOT filtered by `active` — the "any"
// assignment replay and manage view need a resource that may since have been
// deactivated. Null when missing / cross-tenant.
export async function getResourceById(
  businessId: string,
  resourceId: string,
): Promise<Resource | null> {
  const scope = businessScope(businessId);
  const [row] = await db
    .select()
    .from(resources)
    .where(scope.where("resources", eq(resources.id, resourceId)))
    .limit(1);
  return row ?? null;
}

// Count of live (held/confirmed) bookings per resource whose START falls in
// [fromUtc, toUtc). Used to order "any" candidates least-booked-first for fair
// spread. Resources with zero bookings are absent from the map (caller defaults
// to 0).
export async function countLiveBookingsPerResource(
  businessId: string,
  resourceIds: string[],
  fromUtc: Date,
  toUtc: Date,
): Promise<Map<string, number>> {
  if (resourceIds.length === 0) return new Map();
  const scope = businessScope(businessId);
  const rows = await db
    .select({ resourceId: bookings.resourceId, n: count() })
    .from(bookings)
    .where(
      scope.where(
        "bookings",
        inArray(bookings.resourceId, resourceIds),
        inArray(bookings.status, [...LIVE_STATUSES]),
        gte(bookings.startsAt, fromUtc),
        lt(bookings.startsAt, toUtc),
      ),
    )
    .groupBy(bookings.resourceId);
  return new Map(rows.map((r) => [r.resourceId, Number(r.n)]));
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

// --- Public-safe DTO reads (anonymous booking surface; invariant 4) ---

function toPublicService(s: Service): PublicService {
  return {
    id: s.id,
    name: s.name,
    durationMin: s.durationMin,
    priceCents: s.priceCents,
  };
}

// Public business profile by slug, or null when no business owns that slug.
// `location` is re-validated against LocationSchema so malformed stored jsonb
// fails loud (a data-integrity bug) rather than reaching the client half-formed.
export async function getBusinessBySlug(
  slug: string,
): Promise<PublicBusiness | null> {
  const [row] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.slug, slug))
    .limit(1);
  if (!row) return null;

  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    vertical: row.vertical,
    timezone: row.timezone,
    currency: row.currency,
    description: row.description,
    logoUrl: row.logoUrl,
    phone: row.phone,
    location: LocationOrNull.parse(row.location ?? null),
  };
}

export async function listActiveServices(
  businessId: string,
): Promise<PublicService[]> {
  const scope = businessScope(businessId);
  const rows = await db
    .select()
    .from(services)
    .where(scope.where("services", eq(services.active, true)))
    .orderBy(asc(services.name));
  return rows.map(toPublicService);
}

export async function listActiveResources(
  businessId: string,
): Promise<PublicResource[]> {
  const scope = businessScope(businessId);
  const rows = await db
    .select()
    .from(resources)
    .where(scope.where("resources", eq(resources.active, true)))
    .orderBy(asc(resources.name));
  return rows.map((r) => ({ id: r.id, name: r.name }));
}

// Resolve a tokenized manage link to its booking + assigned resource + service +
// a slim business projection. Returns null when the token matches nothing. The
// service/resource are looked up by id WITHOUT the active filter — a booking on a
// since-deactivated resource must still render.
export async function loadBookingByManageToken(
  token: string,
): Promise<PublicManageView | null> {
  const [booking] = await db
    .select()
    .from(bookings)
    .where(eq(bookings.manageToken, token))
    .limit(1);
  if (!booking) return null;

  const scope = businessScope(booking.businessId);
  const [business] = await db
    .select()
    .from(businesses)
    .where(eq(businesses.id, booking.businessId))
    .limit(1);
  const [service] = await db
    .select()
    .from(services)
    .where(scope.where("services", eq(services.id, booking.serviceId)))
    .limit(1);
  const [resource] = await db
    .select()
    .from(resources)
    .where(scope.where("resources", eq(resources.id, booking.resourceId)))
    .limit(1);
  if (!business || !service || !resource) return null;

  return {
    business: {
      slug: business.slug,
      name: business.name,
      timezone: business.timezone,
      currency: business.currency,
    },
    service: toPublicService(service),
    resource: { id: resource.id, name: resource.name },
    booking: {
      id: booking.id,
      status: booking.status,
      startsAt: booking.startsAt.toISOString(),
      endsAt: booking.endsAt.toISOString(),
      customerName: booking.customerName,
      notes: booking.notes,
    },
  };
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
