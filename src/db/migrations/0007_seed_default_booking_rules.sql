-- Hand-written: re-defines create_business to also seed the business-default
-- booking_rules row, plus a one-time backfill for businesses created before this
-- migration. drizzle-kit wraps each migration in a transaction, so there is no
-- explicit BEGIN/COMMIT here.

-- create_business: unchanged body from 0004 (same signature, SECURITY DEFINER,
-- pinned search_path, owner membership + optional owner resource) with one added
-- INSERT that seeds the default rules row in the same transaction.
CREATE OR REPLACE FUNCTION "public"."create_business"(
  "p_name" text,
  "p_slug" text,
  "p_vertical" "public"."vertical",
  "p_timezone" text DEFAULT 'Europe/Tirane',
  "p_owner_is_resource" boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_business_id uuid;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO "public"."businesses" ("slug", "name", "vertical", "timezone")
  VALUES ("p_slug", "p_name", "p_vertical", "p_timezone")
  RETURNING "id" INTO v_business_id;

  INSERT INTO "public"."memberships" ("user_id", "business_id", "role")
  VALUES (v_uid, v_business_id, 'owner');

  -- Seed the business-default booking_rules row (service_id NULL). Column
  -- defaults supply lead/advance/granularity (120/60/15), matching
  -- DEFAULT_BOOKING_RULES. Idempotent via the partial unique
  -- (business_id) WHERE service_id IS NULL.
  INSERT INTO "public"."booking_rules" ("business_id")
  VALUES (v_business_id)
  ON CONFLICT DO NOTHING;

  IF "p_owner_is_resource" THEN
    INSERT INTO "public"."resources" ("business_id", "type", "name", "user_id")
    SELECT v_business_id, 'staff', COALESCE(p."full_name", p."email", 'Me'), v_uid
    FROM "public"."profiles" p WHERE p."id" = v_uid;
  END IF;

  RETURN v_business_id;
END;
$$;
--> statement-breakpoint

-- Backfill businesses created before this migration so the engine never falls
-- back to DEFAULT_BOOKING_RULES in normal operation.
INSERT INTO "public"."booking_rules" ("business_id")
SELECT b."id" FROM "public"."businesses" b
WHERE NOT EXISTS (
  SELECT 1 FROM "public"."booking_rules" r
  WHERE r."business_id" = b."id" AND r."service_id" IS NULL
)
ON CONFLICT DO NOTHING;
