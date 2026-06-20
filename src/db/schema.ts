import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  jsonb,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import type { Location } from "@/lib/schemas/business";
import { VERTICALS } from "@/lib/schemas/onboarding";

// Single source: the pgEnum is built from VERTICALS (which also derives the
// `Vertical` type + labels), so the DB enum and app types can't drift.
export const verticalEnum = pgEnum("vertical", VERTICALS);

export const bookingStatusEnum = pgEnum("booking_status", [
  "held",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

// Named access to the booking statuses. The TYPE is derived from the pgEnum so it
// can't drift; `satisfies` keeps the values valid and the parity test in
// __tests__ enforces exhaustiveness. Use BookingStatus.CONFIRMED in code instead
// of the bare "confirmed" literal.
export type BookingStatus = (typeof bookingStatusEnum.enumValues)[number];
export const BookingStatus = {
  HELD: "held",
  CONFIRMED: "confirmed",
  CANCELLED: "cancelled",
  COMPLETED: "completed",
  NO_SHOW: "no_show",
} as const satisfies Record<string, BookingStatus>;

export const memberRoleEnum = pgEnum("member_role", ["owner", "staff"]);
// Types derived from the pgEnums so app code shares one source (no hand-kept
// union). Named const objects are added where a feature actually needs named
// access (e.g. BookingStatus); these are type-only until then.
export type MemberRole = (typeof memberRoleEnum.enumValues)[number];

export const resourceTypeEnum = pgEnum("resource_type", ["staff", "asset"]);
export type ResourceType = (typeof resourceTypeEnum.enumValues)[number];

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);
export type InviteStatus = (typeof inviteStatusEnum.enumValues)[number];

// Mirror of the Supabase-managed auth.users row. The FK to auth.users(id) and
// the AFTER INSERT trigger that populates this table live in raw SQL — Drizzle
// cannot reference the `auth` schema. Intra-`public` FKs below stay in Drizzle.
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(),
  email: text("email"),
  fullName: text("full_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

// The tenant. `business_id` is the security boundary on every table below.
export const businesses = pgTable(
  "businesses",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    slug: text("slug").notNull(),
    name: text("name").notNull(),
    vertical: verticalEnum("vertical").notNull(),
    timezone: text("timezone").notNull().default("Europe/Tirane"),
    // Public-profile fields — surfaced on the booking page, edited later in the
    // dashboard (not collected at onboarding). All nullable except `currency`.
    description: text("description"),
    logoUrl: text("logo_url"),
    phone: text("phone"),
    // ISO-4217 code; drives `formatPrice`. Intentionally independent of
    // `location.countryCode` — a business may bill in EUR while located in AL.
    currency: text("currency").notNull().default("ALL"),
    // One typed place per business; validated by LocationSchema on every read.
    location: jsonb("location").$type<Location>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("businesses_slug_idx").on(t.slug)],
);

// Links a person (profile) to a business with a role. M:N from day one; one
// business per owner is an app rule, not a schema constraint. First-insert
// happens only via the create_business / accept_invite SECURITY DEFINER RPCs.
export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    role: memberRoleEnum("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_user_business_idx").on(t.userId, t.businessId),
    index("memberships_business_idx").on(t.businessId),
  ],
);

// A bookable unit — a staff member or (later) an asset. `userId` is nullable so
// a resource is bookable before its login invite is accepted.
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    type: resourceTypeEnum("type").notNull().default("staff"),
    name: text("name").notNull(),
    userId: uuid("user_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    active: boolean("active").notNull().default(true),
  },
  (t) => [
    index("resources_business_idx").on(t.businessId),
    index("resources_user_idx").on(t.userId),
  ],
);

export const invites = pgTable(
  "invites",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    email: text("email").notNull(),
    role: memberRoleEnum("role").notNull().default("staff"),
    token: text("token").notNull(),
    status: inviteStatusEnum("status").notNull().default("pending"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "set null",
    }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [uniqueIndex("invites_token_idx").on(t.token)],
);

// Consumed later by the availability engine. Belongs to a resource.
export const workingHours = pgTable(
  "working_hours",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    weekday: integer("weekday").notNull(), // 0 (Sun) .. 6 (Sat)
    startMinute: integer("start_minute").notNull(),
    endMinute: integer("end_minute").notNull(),
  },
  (t) => [index("working_hours_resource_idx").on(t.resourceId)],
);

// A vacation / one-off closure. `resourceId` NULL = business-wide closure
// (holiday, maintenance), which is why `businessId` is carried directly. The
// NOT NULL on `businessId` is enforced at the DB level in migration 0006 after a
// backfill (the ORM types it nullable to keep the additive 0005 migration safe).
export const timeOff = pgTable(
  "time_off",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id").references(() => businesses.id, {
      onDelete: "cascade",
    }),
    resourceId: uuid("resource_id").references(() => resources.id, {
      onDelete: "cascade",
    }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
  },
  (t) => [
    index("time_off_resource_idx").on(t.resourceId),
    index("time_off_business_idx").on(t.businessId),
  ],
);

export const services = pgTable(
  "services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    durationMin: integer("duration_min").notNull(),
    priceCents: integer("price_cents").notNull().default(0),
    // Padding reserved before/after each booking of this service. Snapshotted
    // onto the booking at creation so the engine and constraint can't drift.
    beforeBufferMin: integer("before_buffer_min").notNull().default(0),
    afterBufferMin: integer("after_buffer_min").notNull().default(0),
    active: boolean("active").notNull().default(true),
  },
  (t) => [index("services_business_idx").on(t.businessId)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "restrict" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    customerName: text("customer_name").notNull(),
    customerPhone: text("customer_phone").notNull(),
    customerEmail: text("customer_email"),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    status: bookingStatusEnum("status").notNull().default("confirmed"),
    // Buffers snapshotted from the service at creation; drive `reserved_range`.
    beforeBufferMin: integer("before_buffer_min").notNull().default(0),
    afterBufferMin: integer("after_buffer_min").notNull().default(0),
    // Tokenized manage link (view / cancel / reschedule without an account).
    manageToken: text("manage_token").notNull(),
    // De-dupes double-submits; unique, nullable (Postgres treats NULLs distinct).
    idempotencyKey: text("idempotency_key"),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    // reserved_range (tstzrange, buffer-inclusive) is trigger-maintained in 0006
    // and guarded by the bookings_no_overlap EXCLUDE constraint; intentionally
    // not modeled here — the engine recomputes busy intervals from the buffers.
  },
  (t) => [
    index("bookings_resource_starts_idx").on(t.resourceId, t.startsAt),
    uniqueIndex("bookings_manage_token_idx").on(t.manageToken),
    uniqueIndex("bookings_idempotency_key_idx").on(t.idempotencyKey),
  ],
);

// One row per service in a (possibly multi-service) booking. The booking stays a
// single contiguous time block — its starts_at/ends_at/buffers drive
// `reserved_range` and the no-overlap constraint; this table records WHICH
// services that block covers, in execution order. Columns are snapshotted at
// creation (like the booking's buffers) so price/duration are immutable even if
// the service is edited later. Invariant: the position-0 row's service_id equals
// bookings.service_id (the primary service). `business_id` is denormalized from
// the validated tenant context — never the client — because RLS trusts it.
export const bookingServices = pgTable(
  "booking_services",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    bookingId: uuid("booking_id")
      .notNull()
      .references(() => bookings.id, { onDelete: "cascade" }),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id")
      .notNull()
      .references(() => services.id, { onDelete: "restrict" }),
    name: text("name").notNull(),
    durationMin: integer("duration_min").notNull(),
    priceCents: integer("price_cents").notNull(),
    beforeBufferMin: integer("before_buffer_min").notNull().default(0),
    afterBufferMin: integer("after_buffer_min").notNull().default(0),
    position: integer("position").notNull(), // 0-based; 0 = primary service
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    index("booking_services_booking_idx").on(t.bookingId),
    // Forbids the same service twice in one booking (distinct-services rule).
    uniqueIndex("booking_services_booking_service_idx").on(
      t.bookingId,
      t.serviceId,
    ),
    index("booking_services_business_idx").on(t.businessId),
  ],
);

// Booking rules, scoped by business with an optional per-service override
// (NULL service_id = the business default). The engine resolves the
// service-specific row first, then the business default, then code defaults.
export const bookingRules = pgTable(
  "booking_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    businessId: uuid("business_id")
      .notNull()
      .references(() => businesses.id, { onDelete: "cascade" }),
    serviceId: uuid("service_id").references(() => services.id, {
      onDelete: "cascade",
    }),
    leadTimeMin: integer("lead_time_min").notNull().default(120),
    advanceWindowDays: integer("advance_window_days").notNull().default(60),
    slotGranularityMin: integer("slot_granularity_min").notNull().default(15),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    // One business-default row (service_id NULL); one row per service override.
    uniqueIndex("booking_rules_business_default_idx")
      .on(t.businessId)
      .where(sql`service_id IS NULL`),
    uniqueIndex("booking_rules_business_service_idx").on(
      t.businessId,
      t.serviceId,
    ),
  ],
);

// Transactional outbox: post-commit side effects (confirmation email, reminder
// scheduling) are written here in the booking's own transaction, then a drainer
// processes them — so a rollback can't orphan a sent email and a failed send
// can't roll back the booking.
export const outbox = pgTable(
  "outbox",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    type: text("type").notNull(),
    payload: jsonb("payload").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    index("outbox_unprocessed_idx")
      .on(t.processedAt)
      .where(sql`processed_at IS NULL`),
  ],
);

export type Profile = typeof profiles.$inferSelect;
export type Business = typeof businesses.$inferSelect;
export type Membership = typeof memberships.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export type Invite = typeof invites.$inferSelect;
export type WorkingHours = typeof workingHours.$inferSelect;
export type TimeOff = typeof timeOff.$inferSelect;
export type Service = typeof services.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type BookingService = typeof bookingServices.$inferSelect;
export type BookingRule = typeof bookingRules.$inferSelect;
export type OutboxRow = typeof outbox.$inferSelect;
