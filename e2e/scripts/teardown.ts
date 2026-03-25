import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { and, eq, like, lt } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import fs from "node:fs";
import path from "node:path";

const usersTable = pgTable("users", {
  createdAt: timestamp("created_at").defaultNow().notNull(),
  id: text("id").primaryKey(),
  username: text("username").unique().notNull(),
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

const RUN_ID = process.env.E2E_RUN_ID ?? "local";
const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000;

type SeededUser = { clerkId: string; email: string; role: string };

async function deleteUserData(db: ReturnType<typeof drizzle>, userId: string) {
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

  // Clean up ephemeral users scoped to THIS run only (e.g. onboarding creates e2eob{runId}...)
  try {
    const ephemeralUsers = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(like(usersTable.username, `e2e%${RUN_ID}%`));

    for (const user of ephemeralUsers) {
      await deleteUserData(db, user.id);

      try {
        await clerk.users.deleteUser(user.id);
      } catch {
        // Ignore
      }

      console.log(`[e2e:teardown] Cleaned up ephemeral user ${user.id}`);
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

  console.log(`[e2e:teardown] Complete (run: ${RUN_ID})`);
}

main().catch((err) => {
  console.error("[e2e:teardown] Failed:", err);
  process.exit(1);
});
