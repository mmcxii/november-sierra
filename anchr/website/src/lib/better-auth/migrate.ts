import { betterAuthAccountTable, betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { usersTable } from "@/lib/db/schema/user";
import { eq } from "drizzle-orm";

// Library module for the Clerk → Better Auth migration.
// The CLI wrapper (scripts/migrate-clerk-to-better-auth.ts) wires the real
// Clerk SDK + Neon client; this module contains the idempotent per-user
// upsert logic so integration tests can drive it with in-process fixtures.

export type ClerkUserFixture = {
  emailAddresses: { emailAddress: string; verification: null | { status: string } }[];
  firstName: null | string;
  id: string;
  imageUrl: null | string;
  lastName: null | string;
};

export type MigrateClerkUsersResult = {
  accountsUpserted: number;
  accountsWithPassword: number;
  seen: number;
  skippedNoEmail: number;
  usersUpserted: number;
};

export type MigrateOptions = {
  // Password hashes exported from Clerk, keyed by Clerk user id. Users
  // without an entry here get a null password and must complete a reset
  // before signing in via BA.
  clerkHashes: Record<string, string>;
  dryRun: boolean;
  users: ClerkUserFixture[];
};

// The migration is generic over the Drizzle driver — neon-http in prod and
// pglite in tests. Pinning it to one driver's ReturnType leaks the driver
// choice into this module for no benefit.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- generic-over-drivers db handle
type AnyDrizzle = any;

export async function migrateClerkUsers(db: AnyDrizzle, opts: MigrateOptions): Promise<MigrateClerkUsersResult> {
  const result: MigrateClerkUsersResult = {
    accountsUpserted: 0,
    accountsWithPassword: 0,
    seen: 0,
    skippedNoEmail: 0,
    usersUpserted: 0,
  };

  for (const u of opts.users) {
    result.seen += 1;
    const email = u.emailAddresses[0]?.emailAddress;
    if (email == null || email.length === 0) {
      result.skippedNoEmail += 1;
      continue;
    }
    const emailVerified = u.emailAddresses[0]?.verification?.status === "verified";
    const name = [u.firstName, u.lastName].filter(Boolean).join(" ") || email.split("@")[0];

    if (!opts.dryRun) {
      await db
        .insert(betterAuthUserTable)
        .values({
          email,
          emailVerified,
          id: u.id,
          image: u.imageUrl ?? null,
          name,
        })
        .onConflictDoUpdate({
          set: { email, emailVerified, image: u.imageUrl ?? null, name, updatedAt: new Date() },
          target: betterAuthUserTable.id,
        });
    }
    result.usersUpserted += 1;

    // Mirror into the app-level `users` table for non-whitelisted users so
    // the Clerk webhook isn't the single source of truth during the bake
    // window. On conflict we keep whatever the app already has — we don't
    // want to clobber an onboarding-chosen username with a random candidate.
    const [existingAppUser] = await db.select().from(usersTable).where(eq(usersTable.id, u.id)).limit(1);
    if (existingAppUser == null && !opts.dryRun) {
      const local = email.split("@")[0].replace(/[^a-z0-9]/g, "");
      const candidate = `${local}${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(4, "0")}`;
      await db
        .insert(usersTable)
        .values({
          avatarUrl: u.imageUrl ?? null,
          displayName: name,
          id: u.id,
          username: candidate,
        })
        .onConflictDoNothing();
    }

    const bcryptHash = opts.clerkHashes[u.id];
    if (!opts.dryRun) {
      const accountId = `clerk-migrated-${u.id}`;
      await db
        .insert(betterAuthAccountTable)
        .values({
          accountId: u.id,
          createdAt: new Date(),
          id: accountId,
          password: bcryptHash ?? null,
          providerId: "credential",
          updatedAt: new Date(),
          userId: u.id,
        })
        .onConflictDoUpdate({
          set: bcryptHash != null ? { password: bcryptHash, updatedAt: new Date() } : { updatedAt: new Date() },
          target: [betterAuthAccountTable.providerId, betterAuthAccountTable.accountId],
        });
    }
    result.accountsUpserted += 1;
    if (bcryptHash != null) {
      result.accountsWithPassword += 1;
    }
  }

  return result;
}
