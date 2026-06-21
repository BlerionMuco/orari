-- Hand-written: atomic onboarding. One SECURITY DEFINER function creates the
-- business + owner membership + default booking_rules + services + resources
-- (owner + team, with pending invites) + a shared weekly working-hours schedule
-- applied to every resource — all in one transaction. Mirrors the internals of
-- create_business / add_team_member (0004/0007). drizzle-kit wraps each migration
-- in a transaction, so there is no explicit BEGIN/COMMIT here.
CREATE OR REPLACE FUNCTION "public"."create_business_onboarding"(
  "p_name" text,
  "p_slug" text,
  "p_vertical" "public"."vertical",
  "p_timezone" text,
  "p_owner_is_resource" boolean,
  "p_team" jsonb,
  "p_services" jsonb,
  "p_hours" jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_business_id uuid;
  v_rid uuid;
  v_resource_ids uuid[] := '{}';
  v_member record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  -- Business. A slug collision is re-raised as a custom SQLSTATE the server
  -- action maps to a friendly "link taken" (slug is the only realistic unique
  -- conflict here).
  BEGIN
    INSERT INTO "public"."businesses" ("slug", "name", "vertical", "timezone")
    VALUES ("p_slug", "p_name", "p_vertical", "p_timezone")
    RETURNING "id" INTO v_business_id;
  EXCEPTION WHEN unique_violation THEN
    RAISE EXCEPTION 'slug taken' USING errcode = 'OR001';
  END;

  -- Owner membership.
  INSERT INTO "public"."memberships" ("user_id", "business_id", "role")
  VALUES (v_uid, v_business_id, 'owner');

  -- Default booking_rules (service_id NULL); column defaults supply 120/60/15.
  INSERT INTO "public"."booking_rules" ("business_id")
  VALUES (v_business_id)
  ON CONFLICT DO NOTHING;

  -- Services (snake_case keys match the unquoted recordset columns).
  INSERT INTO "public"."services"
    ("business_id", "name", "duration_min", "price_cents",
     "before_buffer_min", "after_buffer_min")
  SELECT v_business_id, s."name", s."duration_min", s."price_cents",
         s."before_buffer_min", s."after_buffer_min"
  FROM jsonb_to_recordset("p_services") AS s(
    "name" text, "duration_min" int, "price_cents" int,
    "before_buffer_min" int, "after_buffer_min" int
  );

  -- Owner resource (linked to the user) when they take appointments.
  IF "p_owner_is_resource" THEN
    INSERT INTO "public"."resources" ("business_id", "type", "name", "user_id")
    SELECT v_business_id, 'staff', COALESCE(p."full_name", p."email", 'Me'), v_uid
    FROM "public"."profiles" p WHERE p."id" = v_uid
    RETURNING "id" INTO v_rid;
    v_resource_ids := array_append(v_resource_ids, v_rid);
  END IF;

  -- Team resources (+ a 14-day pending invite when an email is given), mirroring
  -- add_team_member. user_id stays NULL until the invite is accepted.
  FOR v_member IN
    SELECT * FROM jsonb_to_recordset("p_team") AS t("name" text, "email" text)
  LOOP
    INSERT INTO "public"."resources" ("business_id", "type", "name")
    VALUES (v_business_id, 'staff', v_member."name")
    RETURNING "id" INTO v_rid;
    v_resource_ids := array_append(v_resource_ids, v_rid);

    IF v_member."email" IS NOT NULL AND length(trim(v_member."email")) > 0 THEN
      INSERT INTO "public"."invites"
        ("business_id", "email", "role", "token", "status", "expires_at", "resource_id")
      VALUES (
        v_business_id, lower(trim(v_member."email")), 'staff',
        encode(extensions.gen_random_bytes(24), 'hex'),
        'pending', now() + interval '14 days', v_rid
      );
    END IF;
  END LOOP;

  -- Never create an unbookable business (Zod blocks this client-side too).
  IF coalesce(array_length(v_resource_ids, 1), 0) = 0 THEN
    RAISE EXCEPTION 'onboarding requires at least one resource'
      USING errcode = '23514';
  END IF;

  -- Shared schedule: every open day applied to every resource.
  INSERT INTO "public"."working_hours"
    ("resource_id", "weekday", "start_minute", "end_minute")
  SELECT r."id", h."weekday", h."start_minute", h."end_minute"
  FROM unnest(v_resource_ids) AS r("id")
  CROSS JOIN jsonb_to_recordset("p_hours") AS h(
    "weekday" int, "start_minute" int, "end_minute" int
  );

  RETURN v_business_id;
END;
$$;--> statement-breakpoint

REVOKE ALL ON FUNCTION "public"."create_business_onboarding"(
  text, text, "public"."vertical", text, boolean, jsonb, jsonb, jsonb
) FROM PUBLIC;--> statement-breakpoint

GRANT EXECUTE ON FUNCTION "public"."create_business_onboarding"(
  text, text, "public"."vertical", text, boolean, jsonb, jsonb, jsonb
) TO authenticated;
