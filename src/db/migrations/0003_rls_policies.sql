-- Row Level Security. Tenant isolation runs through memberships via the
-- current_user_business_ids() helper. auth.uid() wrapped in (select ...) per
-- Supabase perf guidance. First-write paths (businesses, memberships) have NO
-- insert policy on purpose — they go only through the SECURITY DEFINER RPCs.

ALTER TABLE "public"."profiles"      ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."businesses"    ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."memberships"   ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."resources"     ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."services"      ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."bookings"      ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."invites"       ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."working_hours" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
ALTER TABLE "public"."time_off"      ENABLE ROW LEVEL SECURITY;--> statement-breakpoint

-- profiles: a user sees and edits only their own row.
CREATE POLICY "profiles_self_select" ON "public"."profiles"
  FOR SELECT USING ("id" = (select auth.uid()));--> statement-breakpoint
CREATE POLICY "profiles_self_update" ON "public"."profiles"
  FOR UPDATE USING ("id" = (select auth.uid()))
  WITH CHECK ("id" = (select auth.uid()));--> statement-breakpoint

-- businesses: members read; owners write. (No INSERT path — create_business RPC.)
CREATE POLICY "businesses_member_select" ON "public"."businesses"
  FOR SELECT USING ("id" IN (SELECT "public"."current_user_business_ids"()));--> statement-breakpoint
CREATE POLICY "businesses_owner_write" ON "public"."businesses"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "businesses"."id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "businesses"."id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint

-- memberships: a user reads only their own membership rows. Writes happen via RPC.
CREATE POLICY "memberships_self_select" ON "public"."memberships"
  FOR SELECT USING ("user_id" = (select auth.uid()));--> statement-breakpoint

-- resources: members read all in the business; owners full CRUD; staff UPDATE
-- only the resource row they own.
CREATE POLICY "resources_member_select" ON "public"."resources"
  FOR SELECT USING ("business_id" IN (SELECT "public"."current_user_business_ids"()));--> statement-breakpoint
CREATE POLICY "resources_owner_all" ON "public"."resources"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "resources"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "resources"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint
CREATE POLICY "resources_staff_update_own" ON "public"."resources"
  FOR UPDATE USING ("user_id" = (select auth.uid()))
  WITH CHECK ("user_id" = (select auth.uid()));--> statement-breakpoint

-- services: members read; owners CRUD.
CREATE POLICY "services_member_select" ON "public"."services"
  FOR SELECT USING ("business_id" IN (SELECT "public"."current_user_business_ids"()));--> statement-breakpoint
CREATE POLICY "services_owner_all" ON "public"."services"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "services"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "services"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint

-- bookings: members read all in business; owners CRUD; staff CRUD only bookings
-- for the resource they own.
CREATE POLICY "bookings_member_select" ON "public"."bookings"
  FOR SELECT USING ("business_id" IN (SELECT "public"."current_user_business_ids"()));--> statement-breakpoint
CREATE POLICY "bookings_owner_all" ON "public"."bookings"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "bookings"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "bookings"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint
CREATE POLICY "bookings_staff_own_resource" ON "public"."bookings"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "bookings"."resource_id" AND r."user_id" = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "bookings"."resource_id" AND r."user_id" = (select auth.uid()))
  );--> statement-breakpoint

-- invites: owner-only (read + write).
CREATE POLICY "invites_owner_all" ON "public"."invites"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "invites"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "invites"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint

-- working_hours: scoped via the owning resource. Members read; owners CRUD;
-- staff CRUD only their own resource's hours.
CREATE POLICY "working_hours_member_select" ON "public"."working_hours"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "working_hours"."resource_id"
              AND r."business_id" IN (SELECT "public"."current_user_business_ids"()))
  );--> statement-breakpoint
CREATE POLICY "working_hours_owner_all" ON "public"."working_hours"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            JOIN "public"."memberships" m ON m."business_id" = r."business_id"
            WHERE r."id" = "working_hours"."resource_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."resources" r
            JOIN "public"."memberships" m ON m."business_id" = r."business_id"
            WHERE r."id" = "working_hours"."resource_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint
CREATE POLICY "working_hours_staff_own" ON "public"."working_hours"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "working_hours"."resource_id" AND r."user_id" = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "working_hours"."resource_id" AND r."user_id" = (select auth.uid()))
  );--> statement-breakpoint

-- time_off: mirrors working_hours.
CREATE POLICY "time_off_member_select" ON "public"."time_off"
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "time_off"."resource_id"
              AND r."business_id" IN (SELECT "public"."current_user_business_ids"()))
  );--> statement-breakpoint
CREATE POLICY "time_off_owner_all" ON "public"."time_off"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            JOIN "public"."memberships" m ON m."business_id" = r."business_id"
            WHERE r."id" = "time_off"."resource_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."resources" r
            JOIN "public"."memberships" m ON m."business_id" = r."business_id"
            WHERE r."id" = "time_off"."resource_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint
CREATE POLICY "time_off_staff_own" ON "public"."time_off"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "time_off"."resource_id" AND r."user_id" = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."resources" r
            WHERE r."id" = "time_off"."resource_id" AND r."user_id" = (select auth.uid()))
  );
