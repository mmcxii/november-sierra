import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";
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

const RUN_ID = process.env.E2E_RUN_ID ?? "local";

const E2E_USERS = [
  { email: `e2e-pro-${RUN_ID}@anchr.io`, onboarded: true, role: "pro", tier: "pro", username: `e2epro${RUN_ID}` },
  {
    email: `e2e-admin-${RUN_ID}@anchr.io`,
    onboarded: true,
    role: "admin",
    tier: "free",
    username: `e2eadmin${RUN_ID}`,
  },
  {
    email: `e2e-fresh-${RUN_ID}@anchr.io`,
    onboarded: false,
    role: "fresh",
    tier: "free",
    username: `e2efresh${RUN_ID}`,
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

  // Seed a test referral code for sign-up E2E tests
  const E2E_REFERRAL_CODE = `ANCHR-E2E${RUN_ID.toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6)}`;
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
