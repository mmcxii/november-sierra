import { boolean, integer, jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

/**
 * Tracks pending external cleanup after a user account is deleted.
 * Rows are inserted at deletion time and removed once all external
 * services (Stripe, Vercel, UploadThing, Clerk) are confirmed clean.
 * While a row exists, the username is reserved to prevent re-registration.
 */
export const accountDeletionLogsTable = pgTable("account_deletion_logs", {
  attempts: integer("attempts").default(0).notNull(),
  clerkCleaned: boolean("clerk_cleaned").default(false).notNull(),
  clerkUserId: text("clerk_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customDomain: text("custom_domain"),
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  lastAttemptAt: timestamp("last_attempt_at"),
  stripeCleaned: boolean("stripe_cleaned").default(false).notNull(),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  uploadthingCleaned: boolean("uploadthing_cleaned").default(false).notNull(),
  uploadthingFileKeys: jsonb("uploadthing_file_keys").$type<string[]>(),
  username: text("username").notNull(),
  vercelCleaned: boolean("vercel_cleaned").default(false).notNull(),
});
