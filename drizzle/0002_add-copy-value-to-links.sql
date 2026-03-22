CREATE TABLE "clicks" (
	"browser" text,
	"city" text,
	"country" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"device" text,
	"id" text PRIMARY KEY NOT NULL,
	"link_id" text NOT NULL,
	"os" text,
	"referrer" text,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "link_groups" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_quick_links" boolean DEFAULT false NOT NULL,
	"position" integer NOT NULL,
	"title" text NOT NULL,
	"user_id" text NOT NULL,
	"visible" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referral_codes" (
	"active" boolean DEFAULT true NOT NULL,
	"code" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"creator_id" text,
	"current_redemptions" integer DEFAULT 0 NOT NULL,
	"duration_days" integer,
	"expires_at" timestamp,
	"id" text PRIMARY KEY NOT NULL,
	"max_redemptions" integer,
	"note" text,
	"type" text NOT NULL,
	CONSTRAINT "referral_codes_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "referral_redemptions" (
	"code_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"user_id" text NOT NULL,
	CONSTRAINT "referral_redemptions_code_user_unique" UNIQUE("code_id","user_id")
);
--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "copy_value" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "group_id" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "icon" text;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "is_featured" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "links" ADD COLUMN "platform" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_avatar" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_domain" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "custom_domain_verified" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "hide_branding" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "page_dark_theme" text DEFAULT 'dark-depths' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "page_light_theme" text DEFAULT 'stateroom' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "pro_expires_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "referred_by" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_customer_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "stripe_subscription_id" text;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "tier" text DEFAULT 'free' NOT NULL;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_link_id_links_id_fk" FOREIGN KEY ("link_id") REFERENCES "public"."links"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "clicks" ADD CONSTRAINT "clicks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link_groups" ADD CONSTRAINT "link_groups_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_codes" ADD CONSTRAINT "referral_codes_creator_id_users_id_fk" FOREIGN KEY ("creator_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_code_id_referral_codes_id_fk" FOREIGN KEY ("code_id") REFERENCES "public"."referral_codes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "referral_redemptions" ADD CONSTRAINT "referral_redemptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "links" ADD CONSTRAINT "links_group_id_link_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."link_groups"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "theme";--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_custom_domain_unique" UNIQUE("custom_domain");--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_stripe_customer_id_unique" UNIQUE("stripe_customer_id");