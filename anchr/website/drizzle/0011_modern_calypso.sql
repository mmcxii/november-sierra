ALTER TABLE "referral_codes" ADD COLUMN "reason" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "preferences" jsonb DEFAULT '{}'::jsonb NOT NULL;