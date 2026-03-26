import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  proExpiresAt: timestamp("pro_expires_at"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

function getDb() {
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl == null) {
    throw new Error("DATABASE_URL is required for E2E DB helpers");
  }
  return drizzle(neon(databaseUrl));
}

/**
 * Set a user's tier directly in the database. Useful for testing
 * downgrade/upgrade flows without going through Stripe.
 */
export async function setUserTier(username: string, tier: "free" | "pro") {
  const db = getDb();
  await db.update(usersTable).set({ proExpiresAt: null, tier }).where(eq(usersTable.username, username));
}
