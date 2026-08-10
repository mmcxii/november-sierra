CREATE TABLE "ba_user" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"display_username" text,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"image" text,
	"name" text NOT NULL,
	"time_zone" text DEFAULT 'UTC' NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"username" text
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
CREATE TABLE "ba_verification" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"value" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ba_account" ADD CONSTRAINT "ba_account_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "ba_session" ADD CONSTRAINT "ba_session_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_account_provider_account_uniq" ON "ba_account" USING btree ("provider_id","account_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_user_username_uniq" ON "ba_user" USING btree ("username");
--> statement-breakpoint
CREATE UNIQUE INDEX "ba_user_email_uniq" ON "ba_user" USING btree ("email");
--> statement-breakpoint
ALTER TABLE "members" ADD COLUMN "user_id" text;
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "members_user_team_uniq" ON "members" USING btree ("user_id","team_id");
--> statement-breakpoint
ALTER TABLE "push_subscriptions" DROP CONSTRAINT "push_subscriptions_member_id_members_id_fk";
--> statement-breakpoint
DELETE FROM "push_subscriptions";
--> statement-breakpoint
ALTER TABLE "push_subscriptions" DROP COLUMN "member_id";
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD COLUMN "user_id" text NOT NULL;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_user_id_ba_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."ba_user"("id") ON DELETE cascade ON UPDATE no action;
