-- Prevent double-booking per resource via an EXCLUDE constraint on tstzrange.
-- Drizzle/Prisma cannot express this natively. Requires btree_gist (0001).
-- Only held + confirmed compete for a slot; cancelled / no_show / completed do
-- not. Half-open '[)' bounds so an ending time can equal the next start.

ALTER TABLE "public"."bookings"
  ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist (
    "resource_id" WITH =,
    tstzrange("starts_at", "ends_at", '[)') WITH &&
  )
  WHERE ("status" IN ('held', 'confirmed'));
