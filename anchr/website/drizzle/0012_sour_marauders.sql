CREATE TABLE "short_links" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"custom_slug" text,
	"expires_at" timestamp,
	"id" text PRIMARY KEY NOT NULL,
	"password_hash" text,
	"slug" text NOT NULL,
	"url" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "short_links_user_id_custom_slug_unique" UNIQUE("user_id","custom_slug")
);
--> statement-breakpoint
CREATE TABLE "short_slugs" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"link_id" text,
	"short_link_id" text,
	"slug" text PRIMARY KEY NOT NULL,
	"tombstoned" boolean DEFAULT false NOT NULL,
	"type" text NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "short_slugs_exactly_one_target" CHECK ("short_slugs"."tombstoned" = true OR ("short_slugs"."link_id" IS NOT NULL AND "short_slugs"."short_link_id" IS NULL) OR ("short_slugs"."link_id" IS NULL AND "short_slugs"."short_link_id" IS NOT NULL))
);
--> statement-breakpoint
ALTER TABLE "clicks" ALTER COLUMN "link_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "short_link_id" text;--> statement-breakpoint
ALTER TABLE "clicks" ADD COLUMN "source" text DEFAULT 'profile' NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "custom_short_slug" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "short_slug" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "short_domain" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "short_domain_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_slug_short_slugs_slug_fk" FOREIGN KEY ("slug") REFERENCES "public"."short_slugs"("slug") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_links" ADD CONSTRAINT "short_links_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "short_slugs" ADD CONSTRAINT "short_slugs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "short_links_user_id_created_at_idx" ON "short_links" USING btree ("user_id","created_at");--> statement-breakpoint
CREATE INDEX "short_slugs_user_id_idx" ON "short_slugs" USING btree ("user_id");--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_short_link_id_short_links_id_fk" FOREIGN KEY ("short_link_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_short_slug_short_slugs_slug_fk" FOREIGN KEY ("short_slug") REFERENCES "public"."short_slugs"("slug") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "clicks_short_link_id_created_at_idx" ON "clicks" USING btree ("short_link_id","created_at");--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_user_id_custom_short_slug_unique" UNIQUE("user_id","custom_short_slug");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_short_domain_unique" UNIQUE("short_domain");--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_exactly_one_target" CHECK (("clicks"."link_id" IS NOT NULL AND "clicks"."short_link_id" IS NULL) OR ("clicks"."link_id" IS NULL AND "clicks"."short_link_id" IS NOT NULL));--> statement-breakpoint
ALTER TABLE "short_slugs" ADD CONSTRAINT "short_slugs_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
ALTER TABLE "short_slugs" ADD CONSTRAINT "short_slugs_short_link_id_short_links_id_fk" FOREIGN KEY ("short_link_id") REFERENCES "public"."short_links"("id") ON DELETE cascade ON UPDATE no action DEFERRABLE INITIALLY DEFERRED;--> statement-breakpoint
-- Backfill: generate short slugs for all existing bio links
-- Uses safe alphabet (excludes 0, O, 1, l, I) and 5-char slugs
DO $$
DECLARE
  link_row RECORD;
  new_slug TEXT;
  safe_chars TEXT := '23456789abcdefghjkmnpqrstuvwxyz';
  slug_len INT := 5;
  max_attempts INT := 100;
  attempt INT;
BEGIN
  FOR link_row IN SELECT id, user_id FROM links WHERE short_slug IS NULL LOOP
    attempt := 0;
    LOOP
      attempt := attempt + 1;
      new_slug := '';
      FOR i IN 1..slug_len LOOP
        new_slug := new_slug || substr(safe_chars, floor(random() * length(safe_chars) + 1)::int, 1);
      END LOOP;
      BEGIN
        INSERT INTO short_slugs (slug, type, link_id, user_id, tombstoned, created_at)
        VALUES (new_slug, 'bio', link_row.id, link_row.user_id, false, now());
        UPDATE links SET short_slug = new_slug WHERE id = link_row.id;
        EXIT;
      EXCEPTION WHEN unique_violation THEN
        IF attempt >= max_attempts THEN
          slug_len := slug_len + 1;
          attempt := 0;
        END IF;
      END;
    END LOOP;
  END LOOP;
END $$;