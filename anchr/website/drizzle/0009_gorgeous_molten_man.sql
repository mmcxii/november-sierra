CREATE TABLE "account_deletion_logs" (
	"attempts" integer DEFAULT 0 NOT NULL,
	"clerk_cleaned" boolean DEFAULT false NOT NULL,
	"clerk_user_id" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"custom_domain" text,
	"id" text PRIMARY KEY NOT NULL,
	"last_attempt_at" timestamp,
	"stripe_cleaned" boolean DEFAULT false NOT NULL,
	"stripe_customer_id" text,
	"stripe_subscription_id" text,
	"uploadthing_cleaned" boolean DEFAULT false NOT NULL,
	"uploadthing_file_keys" jsonb,
	"username" text NOT NULL,
	"vercel_cleaned" boolean DEFAULT false NOT NULL
);
