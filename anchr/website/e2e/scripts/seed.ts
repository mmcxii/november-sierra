import "dotenv/config";
import { neon } from "@neondatabase/serverless";
import { hash as argon2Hash } from "@node-rs/argon2";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, pgTable, text, timestamp, uniqueIndex } from "drizzle-orm/pg-core";

// Minimal schema mirror — only the columns the seeder writes.
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

// Test users for the BA flow. Each gets a corresponding ba_user + ba_account
// (credential password) + users row. Username + id are run-scoped so parallel
// CI runs never collide. Passwords share a single env var so the
// signInUser fixture can hash once and re-use.
const E2E_USERS = [
  { onboarded: true, role: "pro", tier: "pro" },
  { onboarded: true, role: "admin", tier: "free" },
  { onboarded: false, role: "fresh", tier: "free" },
  { onboarded: true, role: "passwordPro", tier: "pro" },
  { onboarded: true, role: "free", tier: "free" },
] as const;

type SeededUser = {
  email: string;
  id: string;
  password: string;
  role: string;
  username: string;
};

function buildSeededUser(role: string, password: string): SeededUser {
  return {
    email: `e2e-${role.toLowerCase()}-${RUN_ID}@anchr.to`,
    id: `e2e_${role.toLowerCase()}_${RUN_ID}`,
    password,
    role,
    username: `e2e${role.toLowerCase()}${RUN_ID}`,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  const password = process.env.E2E_USER_PASSWORD;

  if (databaseUrl == null || password == null) {
    console.warn("[e2e:seed] Skipping — missing DATABASE_URL or E2E_USER_PASSWORD");
    process.exit(0);
  }

  const db = drizzle(neon(databaseUrl));

  // Hash the shared password once — all roles share it. Weaker argon2id
  // params are deliberate: the hash only ever guards an ephemeral CI user
  // against in-repo plaintext, so OWASP cost is overkill here.
  const passwordHash = await argon2Hash(password, { memoryCost: 8, outputLen: 32, parallelism: 1, timeCost: 1 });

  for (const user of E2E_USERS) {
    const seeded = buildSeededUser(user.role, password);

    await db
      .insert(baUserTable)
      .values({ email: seeded.email, emailVerified: true, id: seeded.id, name: `E2E ${user.role}` })
      .onConflictDoUpdate({
        set: { email: seeded.email, emailVerified: true, name: `E2E ${user.role}` },
        target: baUserTable.id,
      });

    await db
      .insert(baAccountTable)
      .values({
        accountId: seeded.id,
        id: `ba-account-${seeded.id}`,
        password: passwordHash,
        providerId: "credential",
        userId: seeded.id,
      })
      .onConflictDoUpdate({
        set: { password: passwordHash },
        target: [baAccountTable.providerId, baAccountTable.accountId],
      });

    await db
      .insert(usersTable)
      .values({
        displayName: `E2E ${user.role}`,
        id: seeded.id,
        onboardingComplete: user.onboarded,
        tier: user.tier,
        username: seeded.username,
      })
      .onConflictDoUpdate({
        set: {
          displayName: `E2E ${user.role}`,
          onboardingComplete: user.onboarded,
          tier: user.tier,
        },
        target: usersTable.id,
      });

    console.log(`[e2e:seed] Seeded ${user.role}: ${seeded.id} (${seeded.email})`);
  }

  // Test referral code consumed by the redeem-referral spec.
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
