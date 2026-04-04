CREATE TABLE "webhook_deliveries" (
	"attempt" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"event" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"status_code" integer,
	"success" boolean NOT NULL,
	"webhook_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "webhooks" (
	"active" boolean DEFAULT true NOT NULL,
	"consecutive_failures" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"encrypted_secret" text NOT NULL,
	"events" text[] NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"url" text NOT NULL,
	"user_id" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "webhook_deliveries" ADD CONSTRAINT "webhook_deliveries_webhook_id_webhooks_id_fk" FOREIGN KEY ("webhook_id") REFERENCES "public"."webhooks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "webhook_deliveries_webhook_id_created_at_idx" ON "webhook_deliveries" USING btree ("webhook_id","created_at");--> statement-breakpoint
CREATE INDEX "webhook_deliveries_success_attempt_idx" ON "webhook_deliveries" USING btree ("success","attempt");--> statement-breakpoint
CREATE INDEX "webhooks_user_id_idx" ON "webhooks" USING btree ("user_id");