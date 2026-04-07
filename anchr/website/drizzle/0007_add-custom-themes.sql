CREATE TABLE IF NOT EXISTS "custom_themes" (
	"background_image" text,
	"border_radius" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"font" text,
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"overlay_color" text,
	"overlay_opacity" real,
	"raw_css" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL,
	"variables" jsonb NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	CONSTRAINT "custom_themes_user_id_name_unique" UNIQUE("user_id","name")
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "page_dark_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "page_light_enabled" boolean DEFAULT true NOT NULL;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "custom_themes" ADD CONSTRAINT "custom_themes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;
