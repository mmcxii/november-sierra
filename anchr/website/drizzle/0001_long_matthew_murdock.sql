DO $$ BEGIN
  ALTER TABLE "users" ALTER COLUMN "theme" SET DEFAULT 'dark-depths';
EXCEPTION WHEN undefined_column THEN NULL;
END $$;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN IF NOT EXISTS "slug" text NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "links" ADD CONSTRAINT "links_user_id_slug_unique" UNIQUE("user_id","slug");
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;
