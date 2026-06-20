CREATE TABLE "booking_services" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"booking_id" uuid NOT NULL,
	"business_id" uuid NOT NULL,
	"service_id" uuid NOT NULL,
	"name" text NOT NULL,
	"duration_min" integer NOT NULL,
	"price_cents" integer NOT NULL,
	"before_buffer_min" integer DEFAULT 0 NOT NULL,
	"after_buffer_min" integer DEFAULT 0 NOT NULL,
	"position" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_booking_id_bookings_id_fk" FOREIGN KEY ("booking_id") REFERENCES "public"."bookings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_services" ADD CONSTRAINT "booking_services_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "booking_services_booking_idx" ON "booking_services" USING btree ("booking_id");--> statement-breakpoint
CREATE UNIQUE INDEX "booking_services_booking_service_idx" ON "booking_services" USING btree ("booking_id","service_id");--> statement-breakpoint
CREATE INDEX "booking_services_business_idx" ON "booking_services" USING btree ("business_id");--> statement-breakpoint
-- RLS mirrors bookings: members read all in their business; owners full CRUD;
-- staff CRUD only rows whose parent booking is on the resource they own. ENABLE
-- (not FORCE) to match bookings — policies are inert until the table is enabled.
ALTER TABLE "public"."booking_services" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE POLICY "booking_services_member_select" ON "public"."booking_services"
  FOR SELECT USING ("business_id" IN (SELECT "public"."current_user_business_ids"()));--> statement-breakpoint
CREATE POLICY "booking_services_owner_all" ON "public"."booking_services"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "booking_services"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."memberships" m
            WHERE m."business_id" = "booking_services"."business_id"
              AND m."user_id" = (select auth.uid()) AND m."role" = 'owner')
  );--> statement-breakpoint
CREATE POLICY "booking_services_staff_own_resource" ON "public"."booking_services"
  FOR ALL USING (
    EXISTS (SELECT 1 FROM "public"."bookings" b
            JOIN "public"."resources" r ON r."id" = b."resource_id"
            WHERE b."id" = "booking_services"."booking_id"
              AND r."user_id" = (select auth.uid()))
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM "public"."bookings" b
            JOIN "public"."resources" r ON r."id" = b."resource_id"
            WHERE b."id" = "booking_services"."booking_id"
              AND r."user_id" = (select auth.uid()))
  );--> statement-breakpoint
-- Backfill: one snapshot row per existing booking from its primary service.
-- Buffers come from the booking's own snapshot (block-start buffer); name/price/
-- duration from the live service (best snapshot available for legacy rows).
-- Idempotent via ON CONFLICT so re-runs are safe; a no-op today (no booking rows).
INSERT INTO "public"."booking_services"
  ("booking_id", "business_id", "service_id", "name", "duration_min",
   "price_cents", "before_buffer_min", "after_buffer_min", "position")
SELECT b."id", b."business_id", b."service_id", s."name", s."duration_min",
       s."price_cents", b."before_buffer_min", b."after_buffer_min", 0
FROM "public"."bookings" b
JOIN "public"."services" s ON s."id" = b."service_id"
ON CONFLICT ("booking_id", "service_id") DO NOTHING;