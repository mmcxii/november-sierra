ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_npub" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_profile_fetched_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "nostr_relays" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "use_nostr_profile" boolean DEFAULT false NOT NULL;
