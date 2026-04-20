import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { and, eq, isNull, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

// ─── Inline schema (standalone script, no path aliases) ──────────────────────

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  proExpiresAt: timestamp("pro_expires_at"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  tier: text("tier").default("free").notNull(),
  updatedAt: timestamp("updated_at"),
});

// ─── Main ────────────────────────────────────────────────────────────────────

// Keep in sync with SIGNUP_GRANT_DAYS in anchr/website/src/lib/tier.server.ts.
// Duplicated here so the standalone script stays free of path-alias imports.
const SIGNUP_GRANT_DAYS = 30;

/**
 * One-shot backfill for ANC-189 (grant 1 month of Pro to every new signup).
 *
 * Going forward the Clerk `user.created` webhook handles the grant per-signup,
 * but this script extends the policy to users who signed up before it existed
 * so launch day is equitable for everyone.
 *
 * Scope: users with `tier = 'free'` and no active Stripe subscription. We do
 * not touch paying subscribers or users with an existing referral/import grant
 * — stacking 30 days onto an already-Pro user would push out Stripe-billed
 * end dates in misleading ways, and the backfill is specifically about
 * reaching free-tier users who never got to try Pro.
 *
 * Run once on deploy:
 *     DATABASE_URL=... pnpm db:backfill-signup-grant
 */
async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl == null) {
    console.error("DATABASE_URL is required");
    process.exit(1);
  }

  const client = neon(databaseUrl);
  const db = drizzle(client);

  const result = await db
    .update(usersTable)
    .set({
      proExpiresAt: sql`NOW() + make_interval(days => ${SIGNUP_GRANT_DAYS})`,
      tier: "pro",
      updatedAt: new Date(),
    })
    .where(and(eq(usersTable.tier, "free"), isNull(usersTable.stripeSubscriptionId)))
    .returning({ id: usersTable.id });

  console.log(`Granted ${SIGNUP_GRANT_DAYS} days of Pro to ${result.length} existing free users.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
