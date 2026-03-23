import "dotenv/config";
import { createClerkClient } from "@clerk/backend";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgTable, text, timestamp } from "drizzle-orm/pg-core";

const usersTable = pgTable("users", {
  avatarUrl: text("avatar_url"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  displayName: text("display_name"),
  id: text("id").primaryKey(),
  pageDarkTheme: text("page_dark_theme").default("dark-depths").notNull(),
  pageLightTheme: text("page_light_theme").default("stateroom").notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  username: text("username").unique().notNull(),
});

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CLI script requires env vars
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY! });
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion -- CLI script requires env vars
  const db = drizzle(neon(process.env.DATABASE_URL!));

  const { data: users } = await clerk.users.getUserList({ limit: 1 });

  if (users.length === 0) {
    console.log("No Clerk users found. Sign up first at /sign-up, then re-run this script.");
    process.exit(1);
  }

  const clerkUser = users[0];
  const email = clerkUser.emailAddresses[0]?.emailAddress ?? "";
  const displayName = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ") || null;
  const username =
    email.split("@")[0].replace(/[^a-z0-9]/g, "") +
    Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, "0");

  await db
    .insert(usersTable)
    .values({
      avatarUrl: clerkUser.imageUrl ?? null,
      displayName,
      id: clerkUser.id,
      username,
    })
    .onConflictDoNothing();

  console.log(`Seeded user: ${clerkUser.id} (${displayName ?? username})`);
}

main().catch(console.error);
