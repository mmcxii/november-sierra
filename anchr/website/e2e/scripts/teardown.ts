import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { and, eq, like, lt, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { boolean, pgTable, text, timestamp } from "drizzle-orm/pg-core";
import fs from "node:fs";
import path from "node:path";
import { UTApi } from "uploadthing/server";

const usersTable = pgTable("users", {
  avatarUrl: text("avatar_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  customAvatar: boolean("custom_avatar"),
  customDomain: text("custom_domain"),
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
});

const apiKeysTable = pgTable("api_keys", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const linksTable = pgTable("links", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const linkGroupsTable = pgTable("link_groups", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const clicksTable = pgTable("clicks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const webhooksTable = pgTable("webhooks", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const webhookDeliveriesTable = pgTable("webhook_deliveries", {
  id: text("id").primaryKey(),
  webhookId: text("webhook_id").notNull(),
});

const customThemesTable = pgTable("custom_themes", {
  backgroundImage: text("background_image"),
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
});

const accountDeletionLogsTable = pgTable("account_deletion_logs", {
  clerkUserId: text("clerk_user_id").notNull(),
  id: text("id").primaryKey(),
  username: text("username").notNull(),
});

const referralCodesTable = pgTable("referral_codes", {
  id: text("id").primaryKey(),
});

const referralRedemptionsTable = pgTable("referral_redemptions", {
  codeId: text("code_id").notNull(),
  id: text("id").primaryKey(),
});

const RUN_ID = process.env.E2E_RUN_ID ?? "local";
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

type SeededUser = { clerkId: string; email: string; role: string };

async function removeVercelDomain(domain: string) {
  const token = process.env.VERCEL_API_TOKEN;
  const projectId = process.env.VERCEL_PROJECT_ID;
  if (!token || !projectId) {
    return;
  }

  await fetch(`https://api.vercel.com/v10/projects/${projectId}/domains/${domain}`, {
    headers: { Authorization: `Bearer ${token}` },
    method: "DELETE",
  }).catch(() => {});
}

async function deleteUploadthingFiles(fileKeys: string[]) {
  if (fileKeys.length === 0) {
    return;
  }
  try {
    const utapi = new UTApi();
    await utapi.deleteFiles(fileKeys);
    console.log(`[e2e:teardown] Deleted ${fileKeys.length} UploadThing file(s)`);
  } catch {
    // UploadThing cleanup is best-effort
  }
}

function extractFileKey(url: string): null | string {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split("/");
    const fIndex = segments.indexOf("f");
    if (fIndex !== -1 && fIndex + 1 < segments.length) {
      return segments[fIndex + 1] ?? null;
    }
    return null;
  } catch {
    return null;
  }
}

async function deleteUserData(db: ReturnType<typeof drizzle>, userId: string) {
  // Remove custom domain from Vercel before deleting user
  const [user] = await db
    .select({
      avatarUrl: usersTable.avatarUrl,
      customAvatar: usersTable.customAvatar,
      customDomain: usersTable.customDomain,
    })
    .from(usersTable)
    .where(eq(usersTable.id, userId))
    .limit(1)
    .catch(() => []);
  if (user?.customDomain) {
    await removeVercelDomain(user.customDomain);
    console.log(`[e2e:teardown] Removed Vercel domain ${user.customDomain}`);
  }

  // Clean up UploadThing files (avatar + theme background images)
  const fileKeys: string[] = [];
  if (user?.customAvatar && user.avatarUrl) {
    const key = extractFileKey(user.avatarUrl);
    if (key != null) {
      fileKeys.push(key);
    }
  }
  const themes = await db
    .select({ backgroundImage: customThemesTable.backgroundImage })
    .from(customThemesTable)
    .where(eq(customThemesTable.userId, userId))
    .catch(() => [] as { backgroundImage: null | string }[]);
  for (const theme of themes) {
    if (theme.backgroundImage != null) {
      const key = extractFileKey(theme.backgroundImage);
      if (key != null) {
        fileKeys.push(key);
      }
    }
  }
  await deleteUploadthingFiles(fileKeys);

  // Clean up any account deletion log entries for this user
  await db
    .delete(accountDeletionLogsTable)
    .where(eq(accountDeletionLogsTable.clerkUserId, userId))
    .catch(() => {});

  // Delete webhook deliveries for user's webhooks, then webhooks themselves
  const userWebhooks = await db
    .select({ id: webhooksTable.id })
    .from(webhooksTable)
    .where(eq(webhooksTable.userId, userId))
    .catch(() => [] as { id: string }[]);
  for (const wh of userWebhooks) {
    await db
      .delete(webhookDeliveriesTable)
      .where(eq(webhookDeliveriesTable.webhookId, wh.id))
      .catch(() => {});
  }
  await db
    .delete(webhooksTable)
    .where(eq(webhooksTable.userId, userId))
    .catch(() => {});
  await db
    .delete(apiKeysTable)
    .where(eq(apiKeysTable.userId, userId))
    .catch(() => {});
  await db
    .delete(clicksTable)
    .where(eq(clicksTable.userId, userId))
    .catch(() => {});
  await db
    .delete(linksTable)
    .where(eq(linksTable.userId, userId))
    .catch(() => {});
  await db
    .delete(linkGroupsTable)
    .where(eq(linkGroupsTable.userId, userId))
    .catch(() => {});
  await db
    .delete(usersTable)
    .where(eq(usersTable.id, userId))
    .catch(() => {});
}

async function main() {
  const secretKey = process.env.CLERK_SECRET_KEY;
  const databaseUrl = process.env.DATABASE_URL;

  if (!secretKey || !databaseUrl) {
    return;
  }

  const clerk = createClerkClient({ secretKey });
  const db = drizzle(neon(databaseUrl));

  // Clean up seeded users (tracked by this run's JSON file)
  const seededUsersPath = path.join(import.meta.dirname, "../.clerk/seeded-users.json");

  if (fs.existsSync(seededUsersPath)) {
    const seededUsers: SeededUser[] = JSON.parse(fs.readFileSync(seededUsersPath, "utf-8"));

    for (const user of seededUsers) {
      await deleteUserData(db, user.clerkId);
      console.log(`[e2e:teardown] Deleted data for ${user.role} (${user.clerkId})`);

      try {
        await clerk.users.deleteUser(user.clerkId);
        console.log(`[e2e:teardown] Deleted Clerk user ${user.role} (${user.clerkId})`);
      } catch {
        // Clerk user may already be deleted
      }
    }

    fs.unlinkSync(seededUsersPath);
  }

  // Clean up ephemeral users from this run, plus webhook-created duplicates.
  //
  // When seed creates a Clerk user, the Clerk webhook on the staging server
  // also fires and inserts a DB row with a short random suffix (e.g. e2epro354).
  // The seed's ON CONFLICT UPDATE handles its own row, but the webhook creates a
  // separate row with a different username. These webhook artifacts have short
  // (<=4 digit) suffixes and don't contain the run ID, so the old run-scoped
  // query missed them. We now clean up both patterns:
  //   1. e2e%{RUN_ID}% — ephemeral users from this run (onboarding, signup flows)
  //   2. e2e(pro|admin|fresh) + short suffix — webhook-created duplicates
  try {
    const ephemeralUsers = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(like(usersTable.username, `e2e%${RUN_ID}%`));

    const webhookDuplicates = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(sql`${usersTable.username} ~ '^e2e(pro|admin|fresh)[0-9]{1,4}$'`);

    const allEphemeral = [...ephemeralUsers, ...webhookDuplicates];

    for (const user of allEphemeral) {
      await deleteUserData(db, user.id);

      try {
        await clerk.users.deleteUser(user.id);
      } catch {
        // Ignore — Clerk user may not exist (webhook-created DB rows have no matching Clerk user)
      }

      console.log(`[e2e:teardown] Cleaned up ephemeral user ${user.username} (${user.id})`);
    }
  } catch {
    // Table query may fail
  }

  // Purge stale e2e users from any run older than 24 hours (orphan safety net)
  try {
    const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
    const staleUsers = await db
      .select({ id: usersTable.id, username: usersTable.username })
      .from(usersTable)
      .where(and(like(usersTable.username, "e2e%"), lt(usersTable.createdAt, cutoff)));

    for (const user of staleUsers) {
      await deleteUserData(db, user.id);

      try {
        await clerk.users.deleteUser(user.id);
      } catch {
        // Ignore
      }

      console.log(`[e2e:teardown] Purged stale user ${user.username} (${user.id})`);
    }
  } catch {
    // Table query may fail
  }

  // Clean up seeded referral code and its redemptions
  const referralCodeId = `e2e-referral-${RUN_ID}`;
  try {
    await db.delete(referralRedemptionsTable).where(eq(referralRedemptionsTable.codeId, referralCodeId));
    await db.delete(referralCodesTable).where(eq(referralCodesTable.id, referralCodeId));
    console.log(`[e2e:teardown] Deleted referral code ${referralCodeId}`);
  } catch {
    // Referral code may not exist
  }

  console.log(`[e2e:teardown] Complete (run: ${RUN_ID})`);
}

main().catch((err) => {
  console.error("[e2e:teardown] Failed:", err);
  process.exit(1);
});
