ALTER TABLE "users" ALTER COLUMN "theme" SET DEFAULT 'dark-depths';--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "slug" text NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_slug_unique" UNIQUE("user_id","slug");