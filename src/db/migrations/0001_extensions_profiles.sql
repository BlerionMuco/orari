-- Extensions, the auth.users FK on profiles, the profile-mirror trigger, and the
-- tenant-resolution helper. Everything Drizzle can't express (cross-schema FK,
-- triggers, SECURITY DEFINER functions) lives in raw SQL.

CREATE EXTENSION IF NOT EXISTS btree_gist;--> statement-breakpoint
CREATE EXTENSION IF NOT EXISTS pgcrypto;--> statement-breakpoint

-- profiles.id mirrors auth.users.id 1:1. Drizzle created the table; the FK to the
-- auth schema is added here.
ALTER TABLE "public"."profiles"
  ADD CONSTRAINT "profiles_id_auth_users_fk"
  FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;--> statement-breakpoint

-- Mirror a new auth user into public.profiles. SECURITY DEFINER + empty search_path
-- (all names fully qualified) to prevent search_path hijacking.
CREATE OR REPLACE FUNCTION "public"."handle_new_user"()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO "public"."profiles" ("id", "email", "full_name")
  VALUES (
    new."id",
    new."email",
    COALESCE(new."raw_user_meta_data" ->> 'name', new."raw_user_meta_data" ->> 'full_name')
  )
  ON CONFLICT ("id") DO NOTHING;
  RETURN new;
END;
$$;--> statement-breakpoint

DROP TRIGGER IF EXISTS "on_auth_user_created" ON "auth"."users";--> statement-breakpoint
CREATE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();--> statement-breakpoint

-- Returns the business_ids the calling user belongs to. SECURITY DEFINER so RLS
-- policies that call it don't recurse on memberships.
CREATE OR REPLACE FUNCTION "public"."current_user_business_ids"()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT "business_id" FROM "public"."memberships" WHERE "user_id" = (SELECT auth.uid());
$$;
