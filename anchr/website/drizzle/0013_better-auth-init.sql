CREATE TABLE "ba_account" (
	"access_token" text,
	"access_token_expires_at" timestamp,
	"account_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"id_token" text,
	"password" text,
	"provider_id" text NOT NULL,
	"refresh_token" text,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ba_session" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"ip_address" text,
	"token" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "ba_session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "ba_two_factor" (
	"backup_codes" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"secret" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ba_user" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"two_factor_enabled" boolean DEFAULT false NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ba_verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_codes" (
	"code_hash" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"used_at" timestamp,
	"user_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recovery_lockouts" (
	"failed_attempts" integer DEFAULT 0 NOT NULL,
	"locked_until" timestamp,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"user_id" text PRIMARY KEY NOT NULL
);
--> statement-breakpoint
ALTER TABLE "short_slugs" DROP CONSTRAINT "short_slugs_exactly_one_target";--> statement-breakpoint
ALTER TABLE "ba_account" ADD CONSTRAINT "ba_account_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ba_session" ADD CONSTRAINT "ba_session_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ba_two_factor" ADD CONSTRAINT "ba_two_factor_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_codes" ADD CONSTRAINT "recovery_codes_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recovery_lockouts" ADD CONSTRAINT "recovery_lockouts_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "ba_account_provider_account_uniq" ON "ba_account" USING btree ("provider_id","account_id");--> statement-breakpoint
CREATE UNIQUE INDEX "recovery_codes_hash_uniq" ON "recovery_codes" USING btree ("code_hash");--> statement-breakpoint
ALTER TABLE "short_slugs" ADD CONSTRAINT "short_slugs_exactly_one_target" CHECK ("short_slugs"."tombstoned" = true OR ("short_slugs"."link_id" IS NOT NULL AND "short_slugs"."short_link_id" IS NULL) OR ("short_slugs"."link_id" IS NULL AND "short_slugs"."short_link_id" IS NOT NULL));