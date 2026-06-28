-- M4: subscription scaffold + reminder preferences on businesses.
-- Two unrelated additions are bundled because both land columns on the same
-- table and the Foundation/Notifications roadmap items are paired in V1.
--
-- 1) Subscription scaffold: trial timer + status enum. Paddle/Lemon Squeezy
--    integration is out of scope; the billing screen reads these and shows a
--    "trial ends X days from now" card.
-- 2) Reminders: `reminder_enabled` + an int[] of minute offsets before the
--    booking start (single column instead of a 1-row table to keep V1 cheap).
--    Inngest reminder dispatch reads these per business.

CREATE TYPE "public"."subscription_status" AS ENUM (
  'trial', 'active', 'past_due', 'cancelled'
);--> statement-breakpoint

ALTER TABLE "public"."businesses"
  ADD COLUMN "subscription_status" "public"."subscription_status"
    NOT NULL DEFAULT 'trial',
  ADD COLUMN "trial_ends_at" timestamptz,
  ADD COLUMN "reminder_enabled" boolean NOT NULL DEFAULT true,
  ADD COLUMN "reminder_offsets_min" integer[] NOT NULL DEFAULT '{1440}';--> statement-breakpoint

-- Backfill 30-day trial window for any pre-existing rows so the Billing screen
-- has a real timestamp to render. New rows are handled by the create flow.
UPDATE "public"."businesses"
  SET "trial_ends_at" = "created_at" + interval '30 days'
  WHERE "trial_ends_at" IS NULL;
