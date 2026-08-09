CREATE TABLE "groups" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"end_date" date NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"invite_code" text NOT NULL,
	"name" text NOT NULL,
	"owner_member_id" text,
	"start_date" date NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "groups_invite_code_unique" UNIQUE("invite_code")
);
--> statement-breakpoint
CREATE TABLE "members" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"display_name" text NOT NULL,
	"group_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"is_owner" boolean DEFAULT false NOT NULL,
	"joined_at" timestamp DEFAULT now() NOT NULL,
	"last_reminder_date" date,
	"mode" text NOT NULL,
	"reminder_enabled" boolean DEFAULT false NOT NULL,
	"reminder_time" text DEFAULT '20:00' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"time_zone" text NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "day_completions" (
	"created_at" timestamp DEFAULT now() NOT NULL,
	"date" date NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_checks" (
	"checked_at" timestamp DEFAULT now() NOT NULL,
	"day_completion_id" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"task_id" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "push_subscriptions" (
	"auth" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"endpoint" text NOT NULL,
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"p256dh" text NOT NULL
);
--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "day_completions" ADD CONSTRAINT "day_completions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "task_checks" ADD CONSTRAINT "task_checks_day_completion_id_day_completions_id_fk" FOREIGN KEY ("day_completion_id") REFERENCES "public"."day_completions"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "push_subscriptions" ADD CONSTRAINT "push_subscriptions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX "day_completions_member_date_idx" ON "day_completions" USING btree ("member_id","date");
--> statement-breakpoint
CREATE UNIQUE INDEX "task_checks_day_task_idx" ON "task_checks" USING btree ("day_completion_id","task_id");
--> statement-breakpoint
CREATE UNIQUE INDEX "push_subscriptions_endpoint_idx" ON "push_subscriptions" USING btree ("endpoint");
