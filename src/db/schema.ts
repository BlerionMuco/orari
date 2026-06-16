import {
  pgTable,
  text,
  uuid,
  timestamp,
  integer,
  boolean,
  pgEnum,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const verticalEnum = pgEnum("vertical", [
  "barber",
  "clinic",
  "tutor",
  "spa",
  "fitness",
  "other",
]);

export const bookingStatusEnum = pgEnum("booking_status", [
  "held",
  "confirmed",
  "cancelled",
  "completed",
  "no_show",
]);

export const memberRoleEnum = pgEnum("member_role", ["owner", "staff"]);

export const resourceTypeEnum = pgEnum("resource_type", ["staff", "asset"]);

export const inviteStatusEnum = pgEnum("invite_status", [
  "pending",
  "accepted",
  "expired",
  "revoked",
]);

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

export const timeOff = pgTable(
  "time_off",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id")
      .notNull()
      .references(() => resources.id, { onDelete: "cascade" }),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    reason: text("reason"),
  },
  (t) => [index("time_off_resource_idx").on(t.resourceId)],
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
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("bookings_resource_starts_idx").on(t.resourceId, t.startsAt)],
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
