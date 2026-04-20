import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { hash as argon2Hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";
import fs from "node:fs";
import path from "node:path";

const usersTable = pgTable("users", {
  displayName: text("display_name"),
  id: text("id").primaryKey(),
  onboardingComplete: boolean("onboarding_complete").default(false).notNull(),
  proExpiresAt: timestamp("pro_expires_at"),
  tier: text("tier").default("free").notNull(),
  username: text("username").unique().notNull(),
});

const referralCodesTable = pgTable("referral_codes", {
  active: boolean("active").default(true).notNull(),
  code: text("code").unique().notNull(),
  currentRedemptions: integer("current_redemptions").default(0).notNull(),
  durationDays: integer("duration_days"),
  id: text("id").primaryKey(),
  maxRedemptions: integer("max_redemptions"),
  note: text("note"),
  type: text("type").notNull(),
});

// Minimal BA schema mirror — only the columns the seeder writes.
const baUserTable = pgTable("ba_user", {
  email: text("email").notNull(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  id: text("id").primaryKey(),
  name: text("name").notNull(),
});

const baAccountTable = pgTable(
  "ba_account",
  {
    accountId: text("account_id").notNull(),
    id: text("id").primaryKey(),
    password: text("password"),
    providerId: text("provider_id").notNull(),
    userId: text("user_id").notNull(),
  },
  (t) => [uniqueIndex("ba_account_provider_account_uniq").on(t.providerId, t.accountId)],
);

const RUN_ID = process.env.E2E_RUN_ID ?? "local";

const E2E_USERS = [
  { email: `e2e-pro-${RUN_ID}@anchr.to`, onboarded: true, role: "pro", tier: "pro", username: `e2epro${RUN_ID}` },
  {
    email: `e2e-admin-${RUN_ID}@anchr.to`,
    onboarded: true,
    role: "admin",
    tier: "free",
    username: `e2eadmin${RUN_ID}`,
  },
  {
    email: `e2e-fresh-${RUN_ID}@anchr.to`,
    onboarded: false,
    role: "fresh",
    tier: "free",
    username: `e2efresh${RUN_ID}`,
  },
  {
    email: `e2e-password-${RUN_ID}+clerk_test@anchr.to`,
    onboarded: true,
    role: "passwordPro",
    tier: "pro",
    username: `e2epassword${RUN_ID}`,
  },
] as const;

type SeededUser = { clerkId: string; email: string; role: string };

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const databaseUrl = process.env.DATABASE_URL;
  const password = process.env.E2E_USER_PASSWORD;

  if (!secretKey || !databaseUrl || !password) {
    console.warn("[e2e:seed] Skipping — missing CLERK_SECRET_KEY, DATABASE_URL, or E2E_USER_PASSWORD");
    process.exit(0);
  }

  const clerk = createClerkClient({ secretKey });
  const db = drizzle(neon(databaseUrl));

  const clerkDir = path.join(import.meta.dirname, "../.clerk");
  fs.mkdirSync(clerkDir, { recursive: true });

  const seededUsers: SeededUser[] = [];

  for (const user of E2E_USERS) {
    const { data: existing } = await clerk.users.getUserList({
      emailAddress: [user.email],
      limit: 1,
    });

    let clerkId: string;

    if (existing.length > 0) {
      clerkId = existing[0].id;
      console.log(`[e2e:seed] Found existing ${user.role} user: ${clerkId}`);
    } else {
      const created = await clerk.users.createUser({
        emailAddress: [user.email],
        firstName: "E2E",
        lastName: user.role.charAt(0).toUpperCase() + user.role.slice(1),
        password,
        skipPasswordChecks: true,
        username: user.username,
      });
      clerkId = created.id;
      console.log(`[e2e:seed] Created ${user.role} user: ${clerkId}`);
    }

    await db
      .insert(usersTable)
      .values({
        displayName: `E2E ${user.role}`,
        id: clerkId,
        onboardingComplete: user.onboarded,
        tier: user.tier,
        username: user.username,
      })
      .onConflictDoUpdate({
        set: {
          displayName: `E2E ${user.role}`,
          onboardingComplete: user.onboarded,
          tier: user.tier,
        },
        target: usersTable.id,
      });

    seededUsers.push({ clerkId, email: user.email, role: user.role });
  }

  const seededUsersPath = path.join(clerkDir, "seeded-users.json");
  fs.writeFileSync(seededUsersPath, JSON.stringify(seededUsers, null, 2));
  console.log(`[e2e:seed] Wrote ${seededUsers.length} users to ${seededUsersPath} (run: ${RUN_ID})`);

  // ─── Better Auth whitelisted test user ──────────────────────────────────
  // Seeded directly via Drizzle to mirror the migration script's path. The
  // user's id is fixed so AUTH_WHITELIST_USER_IDS can pre-include it.
  const baUserId = `e2e_ba_user_${RUN_ID}`;
  const baEmail = `e2e-ba-${RUN_ID}@anchr.to`;
  const baUsername = `e2eba${RUN_ID}`;
  const baPassword = `e2e-ba-password-${RUN_ID}`;
  // OWASP params would take ~500ms; use weaker params here since the hash
  // only ever protects the ephemeral CI user against in-repo plaintext.
  const baPasswordHash = await argon2Hash(baPassword, { memoryCost: 8, outputLen: 32, parallelism: 1, timeCost: 1 });

  await db
    .insert(baUserTable)
    .values({ email: baEmail, emailVerified: true, id: baUserId, name: "E2E BA User" })
    .onConflictDoUpdate({ set: { email: baEmail, emailVerified: true, name: "E2E BA User" }, target: baUserTable.id });

  await db
    .insert(baAccountTable)
    .values({
      accountId: baUserId,
      id: `ba-account-${baUserId}`,
      password: baPasswordHash,
      providerId: "credential",
      userId: baUserId,
    })
    .onConflictDoUpdate({
      set: { password: baPasswordHash },
      target: [baAccountTable.providerId, baAccountTable.accountId],
    });

  await db
    .insert(usersTable)
    .values({
      displayName: "E2E BA User",
      id: baUserId,
      onboardingComplete: true,
      tier: "free",
      username: baUsername,
    })
    .onConflictDoUpdate({
      set: { displayName: "E2E BA User", onboardingComplete: true, tier: "free" },
      target: usersTable.id,
    });

  console.log(`[e2e:seed] Seeded BA whitelisted user: ${baUserId} (email: ${baEmail})`);
  console.log("[e2e:seed] Ensure AUTH_WHITELIST_USER_IDS includes this id in the test env.");

  // Seed a test referral code for sign-up E2E tests
  const E2E_REFERRAL_CODE = `ANCHR-E2E${RUN_ID.toUpperCase().replace(/[^A-Z0-9]/g, "")}`;
  await db
    .insert(referralCodesTable)
    .values({
      code: E2E_REFERRAL_CODE,
      durationDays: 30,
      id: `e2e-referral-${RUN_ID}`,
      note: `E2E test referral code (run: ${RUN_ID})`,
      type: "admin",
    })
    .onConflictDoUpdate({
      set: { active: true, currentRedemptions: 0 },
      target: referralCodesTable.id,
    });
  console.log(`[e2e:seed] Seeded referral code: ${E2E_REFERRAL_CODE}`);
}

main().catch((err) => {
  console.error("[e2e:seed] Failed:", err);
  process.exit(1);
});
