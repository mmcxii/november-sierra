ALTER TABLE "users" ADD COLUMN "nostr_npub" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nostr_profile_fetched_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "nostr_relays" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "use_nostr_profile" boolean DEFAULT false NOT NULL;