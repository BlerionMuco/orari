CREATE TABLE "booking_rules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"business_id" uuid NOT NULL,
	"service_id" uuid,
	"lead_time_min" integer DEFAULT 120 NOT NULL,
	"advance_window_days" integer DEFAULT 60 NOT NULL,
	"slot_granularity_min" integer DEFAULT 15 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "outbox" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"payload" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"processed_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "time_off" ALTER COLUMN "resource_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "before_buffer_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "after_buffer_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "manage_token" text NOT NULL;--> statement-breakpoint
ALTER TABLE "bookings" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "before_buffer_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "services" ADD COLUMN "after_buffer_min" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "time_off" ADD COLUMN "business_id" uuid;--> statement-breakpoint
ALTER TABLE "booking_rules" ADD CONSTRAINT "booking_rules_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "booking_rules" ADD CONSTRAINT "booking_rules_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_rules_business_default_idx" ON "booking_rules" USING btree ("business_id") WHERE service_id IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "booking_rules_business_service_idx" ON "booking_rules" USING btree ("business_id","service_id");--> statement-breakpoint
CREATE INDEX "outbox_unprocessed_idx" ON "outbox" USING btree ("processed_at") WHERE processed_at IS NULL;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_business_id_businesses_id_fk" FOREIGN KEY ("business_id") REFERENCES "public"."businesses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_manage_token_idx" ON "bookings" USING btree ("manage_token");--> statement-breakpoint
CREATE UNIQUE INDEX "bookings_idempotency_key_idx" ON "bookings" USING btree ("idempotency_key");--> statement-breakpoint
CREATE INDEX "time_off_business_idx" ON "time_off" USING btree ("business_id");