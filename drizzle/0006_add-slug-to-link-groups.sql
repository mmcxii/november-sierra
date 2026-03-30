ALTER TABLE "link_groups" ADD COLUMN IF NOT EXISTS "slug" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "link_groups" ADD CONSTRAINT "link_groups_user_id_slug_unique" UNIQUE("user_id","slug");
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
