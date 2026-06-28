-- 0011 added `trial_ends_at` without a default and only backfilled existing
-- rows. The comment claimed "new rows are handled by the create flow," but
-- the create_business RPC was never updated — every business created after
-- 0011 landed with NULL `trial_ends_at`, which makes the Billing card render
-- "Subscription · Trial · No active subscription." Setting a column default
-- fixes new inserts without touching the RPC and applies whether the row is
-- created by the RPC, a seed, or a direct admin write.

ALTER TABLE "public"."businesses"
  ALTER COLUMN "trial_ends_at" SET DEFAULT (now() + interval '30 days');--> statement-breakpoint

-- Backfill any rows that slipped through between 0011 and 0012.
UPDATE "public"."businesses"
  SET "trial_ends_at" = "created_at" + interval '30 days'
  WHERE "trial_ends_at" IS NULL;
