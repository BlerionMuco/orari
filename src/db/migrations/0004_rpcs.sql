-- SECURITY DEFINER RPCs for the writes RLS can't allow (first business/membership
-- for a user who belongs to nothing yet). Each pins an empty search_path, fully
-- qualifies every name, and authorizes internally — RLS does not apply to definer
-- internals, so these checks ARE the boundary.

-- create_business: insert the business + the caller's owner membership, and
-- optionally a staff resource for the owner. Returns the new business id.
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

  IF "p_owner_is_resource" THEN
    INSERT INTO "public"."resources" ("business_id", "type", "name", "user_id")
    SELECT v_business_id, 'staff', COALESCE(p."full_name", p."email", 'Me'), v_uid
    FROM "public"."profiles" p WHERE p."id" = v_uid;
  END IF;

  RETURN v_business_id;
END;
$$;--> statement-breakpoint

-- add_team_member: owner-only. Insert a staff resource; if an email is given,
-- mint a pending invite tied to that resource. Returns the new resource id.
CREATE OR REPLACE FUNCTION "public"."add_team_member"(
  "p_business_id" uuid,
  "p_name" text,
  "p_email" text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_resource_id uuid;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM "public"."memberships" m
    WHERE m."business_id" = "p_business_id"
      AND m."user_id" = v_uid AND m."role" = 'owner'
  ) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  INSERT INTO "public"."resources" ("business_id", "type", "name")
  VALUES ("p_business_id", 'staff', "p_name")
  RETURNING "id" INTO v_resource_id;

  IF "p_email" IS NOT NULL AND length(trim("p_email")) > 0 THEN
    INSERT INTO "public"."invites"
      ("business_id", "email", "role", "token", "status", "expires_at", "resource_id")
    VALUES (
      "p_business_id", lower(trim("p_email")), 'staff',
      encode(extensions.gen_random_bytes(24), 'hex'),
      'pending', now() + interval '14 days', v_resource_id
    );
  END IF;

  RETURN v_resource_id;
END;
$$;--> statement-breakpoint

-- accept_invite: validate the token, create the staff membership, and attach the
-- accepting user to the resource — all in one transaction. Idempotent on a
-- double-click via the unique (user_id, business_id) and the status flip.
CREATE OR REPLACE FUNCTION "public"."accept_invite"("p_token" text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_uid uuid := (SELECT auth.uid());
  v_inv "public"."invites"%ROWTYPE;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  SELECT * INTO v_inv FROM "public"."invites"
  WHERE "token" = "p_token" FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'invalid invite';
  END IF;
  IF v_inv."status" <> 'pending' THEN
    RAISE EXCEPTION 'invite already used';
  END IF;
  IF v_inv."expires_at" < now() THEN
    UPDATE "public"."invites" SET "status" = 'expired' WHERE "id" = v_inv."id";
    RAISE EXCEPTION 'invite expired';
  END IF;

  INSERT INTO "public"."memberships" ("user_id", "business_id", "role")
  VALUES (v_uid, v_inv."business_id", v_inv."role")
  ON CONFLICT ("user_id", "business_id") DO NOTHING;

  IF v_inv."resource_id" IS NOT NULL THEN
    UPDATE "public"."resources" SET "user_id" = v_uid
    WHERE "id" = v_inv."resource_id" AND "user_id" IS NULL;
  ELSE
    INSERT INTO "public"."resources" ("business_id", "type", "name", "user_id")
    SELECT v_inv."business_id", 'staff', COALESCE(p."full_name", p."email", 'Staff'), v_uid
    FROM "public"."profiles" p WHERE p."id" = v_uid;
  END IF;

  UPDATE "public"."invites" SET "status" = 'accepted' WHERE "id" = v_inv."id";
  RETURN v_inv."business_id";
END;
$$;
