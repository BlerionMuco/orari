ALTER TABLE "businesses" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "logo_url" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "phone" text;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "currency" text DEFAULT 'ALL' NOT NULL;--> statement-breakpoint
ALTER TABLE "businesses" ADD COLUMN "location" jsonb;