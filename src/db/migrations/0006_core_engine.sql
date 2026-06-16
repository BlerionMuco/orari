-- Hand-written: the reserved_range trigger, the partial EXCLUDE swap, and the
-- time_off.business_id NOT NULL (after a backfill) can't be expressed by Drizzle.
-- 0005 already added time_off.business_id (nullable) + its FK and dropped the
-- resource_id NOT NULL; this file backfills and finalizes. drizzle-kit wraps each
-- migration in a transaction, so there is no explicit BEGIN/COMMIT here.

-- btree_gist already exists (installed in 0001, used by 0002). Idempotent guard
-- so this file is self-contained.
CREATE EXTENSION IF NOT EXISTS btree_gist;
--> statement-breakpoint

-- time_off: a NULL resource_id row is a business-wide closure, so every row
-- needs its own business_id. Backfill from the resource, then enforce NOT NULL.
UPDATE "time_off" t
SET    "business_id" = r."business_id"
FROM   "resources" r
WHERE  t."resource_id" = r."id" AND t."business_id" IS NULL;
--> statement-breakpoint
ALTER TABLE "time_off" ALTER COLUMN "business_id" SET NOT NULL;
--> statement-breakpoint

-- bookings.reserved_range: buffer-inclusive range maintained by a trigger. A
-- STORED generated column is rejected here because `timestamptz ± interval` is
-- STABLE, not IMMUTABLE. The trigger recomputes on insert AND on reschedule.
ALTER TABLE "bookings" ADD COLUMN "reserved_range" tstzrange;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION "public"."set_reserved_range"() RETURNS trigger
  LANGUAGE plpgsql
AS $$
BEGIN
  NEW."reserved_range" := tstzrange(
    NEW."starts_at" - make_interval(mins => NEW."before_buffer_min"),
    NEW."ends_at"   + make_interval(mins => NEW."after_buffer_min"),
    '[)'
  );
  RETURN NEW;
END $$;
--> statement-breakpoint
CREATE TRIGGER "bookings_reserved_range"
  BEFORE INSERT OR UPDATE OF "starts_at", "ends_at", "before_buffer_min", "after_buffer_min"
  ON "bookings" FOR EACH ROW EXECUTE FUNCTION "public"."set_reserved_range"();
--> statement-breakpoint
UPDATE "bookings"
SET    "reserved_range" = tstzrange(
         "starts_at" - make_interval(mins => "before_buffer_min"),
         "ends_at"   + make_interval(mins => "after_buffer_min"),
         '[)'
       );
--> statement-breakpoint
ALTER TABLE "bookings" ALTER COLUMN "reserved_range" SET NOT NULL;
--> statement-breakpoint

-- Swap the overlap guard onto the buffer-inclusive reserved_range. 0002 was
-- already per-resource; this only changes WHICH range is guarded, so the DB now
-- also enforces buffer separation. Statuses stay held + confirmed (cancelled /
-- no_show / completed free the slot).
ALTER TABLE "bookings" DROP CONSTRAINT "bookings_no_overlap";
--> statement-breakpoint
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_no_overlap"
  EXCLUDE USING gist ("resource_id" WITH =, "reserved_range" WITH &&)
  WHERE ("status" IN ('held', 'confirmed'));
