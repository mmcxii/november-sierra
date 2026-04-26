/**
 * Resets the E2E fresh user's onboarding state in the database.
 *
 * Called from onboarding.spec.ts beforeAll to ensure a clean slate before
 * each retry of the serial test block. Without this, a retry would see
 * onboardingComplete=true (from the previous attempt's completeOnboarding
 * call) and the referral code already redeemed.
 *
 * Post-cutover the seeded user id is deterministic from the run id (matching
 * the seed script), so we don't need a seeded-users.json sidecar to look it
 * up.
 */
import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  id: text("id").primaryKey(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  proExpiresAt: timestamp("pro_expires_at"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

const referralCodesTable = pgTable("referral_codes", {
  currentRedemptions: integer("current_redemptions").default(0).notNull(),
  id: text("id").primaryKey(),
});

const referralRedemptionsTable = pgTable("referral_redemptions", {
  codeId: text("code_id").notNull(),
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const linksTable = pgTable("links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const RUN_ID = process.env.E2E_RUN_ID ?? "local";

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (databaseUrl == null) {
    console.warn("[e2e:reset-onboarding] Skipping — missing DATABASE_URL");
    return;
  }

  const db = drizzle(neon(databaseUrl));
  const freshUserId = `e2e_fresh_${RUN_ID}`;

  // Reset user state — also restore the original username in case it was changed
  // by the username-step test
  await db
    .update(usersTable)
    .set({ onboardingComplete: false, proExpiresAt: null, tier: "free", username: `e2efresh${RUN_ID}` })
    .where(eq(usersTable.id, freshUserId));

  // Delete any referral redemptions by this user
  await db.delete(referralRedemptionsTable).where(eq(referralRedemptionsTable.userId, freshUserId));

  // Reset the referral code's redemption counter
  const referralCodeId = `e2e-referral-${RUN_ID}`;
  await db.update(referralCodesTable).set({ currentRedemptions: 0 }).where(eq(referralCodesTable.id, referralCodeId));

  // Delete any links added during onboarding
  await db.delete(linksTable).where(eq(linksTable.userId, freshUserId));

  console.log(`[e2e:reset-onboarding] Reset fresh user ${freshUserId} (run: ${RUN_ID})`);
}

main().catch((err) => {
  console.error("[e2e:reset-onboarding] Failed:", err);
  // Non-fatal — don't block tests if reset fails
});
