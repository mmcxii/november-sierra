import { betterAuthAccountTable, betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { usersTable } from "@/lib/db/schema/user";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it } from "vitest";
import { type ClerkUserFixture, migrateClerkUsers } from "./migrate";

// Integration test — migration script idempotency against a real Postgres
// (PGlite in-process). Proves the `onConflictDoUpdate` semantics our upserts
// rely on actually work with Postgres, not just with whatever the ORM thinks
// should happen. SQLite would misreport the unique-constraint behavior.

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- drizzle/pglite typing
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PGlite instance
let client: any;

function fixture(id: string, email: string, extra: Partial<ClerkUserFixture> = {}): ClerkUserFixture {
  return {
    emailAddresses: [{ emailAddress: email, verification: { status: "verified" } }],
    firstName: null,
    id,
    imageUrl: null,
    lastName: null,
    ...extra,
  };
}

beforeEach(async () => {
  client = new PGlite();
  db = drizzle(client);

  // Mirror the production schema for every table the migration touches. Keep
  // the DDL in lockstep with the Drizzle schema in src/lib/db/schema — Drizzle
  // SELECT emits every column so any drift causes the first select-after-insert
  // to fail loudly, which is the signal we want.
  await client.exec(`
    CREATE TABLE IF NOT EXISTS users (
      avatar_url TEXT,
      billing_interval TEXT,
      bio TEXT,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      current_period_end TIMESTAMP,
      custom_avatar BOOLEAN DEFAULT false NOT NULL,
      custom_domain TEXT UNIQUE,
      custom_domain_verified BOOLEAN DEFAULT false NOT NULL,
      display_name TEXT,
      domain_removed_at TIMESTAMP,
      hide_branding BOOLEAN DEFAULT false NOT NULL,
      id TEXT PRIMARY KEY,
      nostr_npub TEXT,
      nostr_profile_fetched_at TIMESTAMP,
      nostr_relays TEXT,
      onboarding_complete BOOLEAN DEFAULT false NOT NULL,
      page_dark_enabled BOOLEAN DEFAULT true NOT NULL,
      page_dark_theme TEXT DEFAULT 'dark-depths' NOT NULL,
      page_light_enabled BOOLEAN DEFAULT true NOT NULL,
      page_light_theme TEXT DEFAULT 'stateroom' NOT NULL,
      payment_failed_at TIMESTAMP,
      preferences JSONB DEFAULT '{}' NOT NULL,
      pro_expires_at TIMESTAMP,
      referred_by TEXT,
      short_domain TEXT UNIQUE,
      short_domain_verified BOOLEAN DEFAULT false NOT NULL,
      stripe_customer_id TEXT UNIQUE,
      stripe_subscription_id TEXT,
      subscription_cancel_at TIMESTAMP,
      tier TEXT DEFAULT 'free' NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL,
      use_nostr_profile BOOLEAN DEFAULT false NOT NULL,
      username TEXT UNIQUE NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ba_user (
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      email TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT false NOT NULL,
      id TEXT PRIMARY KEY,
      image TEXT,
      name TEXT NOT NULL,
      two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );
    CREATE TABLE IF NOT EXISTS ba_account (
      access_token TEXT,
      access_token_expires_at TIMESTAMP,
      account_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      id TEXT PRIMARY KEY,
      id_token TEXT,
      password TEXT,
      provider_id TEXT NOT NULL,
      refresh_token TEXT,
      refresh_token_expires_at TIMESTAMP,
      scope TEXT,
      updated_at TIMESTAMP DEFAULT now() NOT NULL,
      user_id TEXT NOT NULL REFERENCES ba_user(id) ON DELETE CASCADE
    );
    CREATE UNIQUE INDEX IF NOT EXISTS ba_account_provider_account_uniq ON ba_account (provider_id, account_id);
  `);
});

describe("migrateClerkUsers — first-run correctness", () => {
  it("writes BA user + app user + credential account for a typical Clerk user", async () => {
    //* Arrange
    const users = [
      fixture("user_abc", "alice@example.test", { firstName: "Alice", imageUrl: "https://example.test/a.png" }),
    ];
    const hashes = { user_abc: "$2b$10$bcrypt-from-clerk-export" };

    //* Act
    const result = await migrateClerkUsers(db, { clerkHashes: hashes, dryRun: false, users });
    const baUsers = await db.select().from(betterAuthUserTable);
    const baAccounts = await db.select().from(betterAuthAccountTable);
    const appUsers = await db.select().from(usersTable);

    //* Assert
    expect(result.seen).toBe(1);
    expect(result.usersUpserted).toBe(1);
    expect(result.accountsUpserted).toBe(1);
    expect(result.accountsWithPassword).toBe(1);
    expect(baUsers).toHaveLength(1);
    expect(baUsers[0].email).toBe("alice@example.test");
    expect(baUsers[0].id).toBe("user_abc");
    expect(baAccounts).toHaveLength(1);
    expect(baAccounts[0].password).toBe("$2b$10$bcrypt-from-clerk-export");
    expect(baAccounts[0].providerId).toBe("credential");
    expect(appUsers).toHaveLength(1);
    expect(appUsers[0].id).toBe("user_abc");
  });

  it("skips users without an email and records the skip count", async () => {
    //* Arrange
    const users: ClerkUserFixture[] = [
      { emailAddresses: [], firstName: null, id: "user_no_email", imageUrl: null, lastName: null },
      fixture("user_ok", "ok@example.test"),
    ];

    //* Act
    const result = await migrateClerkUsers(db, { clerkHashes: {}, dryRun: false, users });
    const baUsers = await db.select().from(betterAuthUserTable);

    //* Assert
    expect(result.seen).toBe(2);
    expect(result.skippedNoEmail).toBe(1);
    expect(result.usersUpserted).toBe(1);
    expect(baUsers).toHaveLength(1);
    expect(baUsers[0].id).toBe("user_ok");
  });

  it("leaves password null for users without a bcrypt hash export", async () => {
    //* Arrange
    const users = [fixture("user_nohash", "nohash@example.test")];

    //* Act
    await migrateClerkUsers(db, { clerkHashes: {}, dryRun: false, users });
    const baAccounts = await db.select().from(betterAuthAccountTable);

    //* Assert
    expect(baAccounts).toHaveLength(1);
    expect(baAccounts[0].password).toBeNull();
  });
});

describe("migrateClerkUsers — idempotency", () => {
  it("produces the same row count and identical shape on a second run (no-op)", async () => {
    //* Arrange
    const users = [
      fixture("user_a", "a@example.test", { firstName: "Alice" }),
      fixture("user_b", "b@example.test", { firstName: "Bob" }),
    ];
    const hashes = { user_a: "$2b$10$hash-a", user_b: "$2b$10$hash-b" };

    //* Act
    const first = await migrateClerkUsers(db, { clerkHashes: hashes, dryRun: false, users });
    const afterFirstBaUsers = await db.select().from(betterAuthUserTable);
    const afterFirstBaAccounts = await db.select().from(betterAuthAccountTable);
    const afterFirstAppUsers = await db.select().from(usersTable);

    const second = await migrateClerkUsers(db, { clerkHashes: hashes, dryRun: false, users });
    const afterSecondBaUsers = await db.select().from(betterAuthUserTable);
    const afterSecondBaAccounts = await db.select().from(betterAuthAccountTable);
    const afterSecondAppUsers = await db.select().from(usersTable);

    //* Assert
    expect(first.seen).toBe(2);
    expect(second.seen).toBe(2);
    expect(afterSecondBaUsers).toHaveLength(2);
    expect(afterSecondBaAccounts).toHaveLength(2);
    // Re-runs must not create duplicate app-user rows — the first run seeded
    // them, the second sees existing records and falls through.
    expect(afterFirstAppUsers.length).toBe(afterSecondAppUsers.length);

    // Ids stable across runs (no PK regeneration).
    expect(new Set(afterFirstBaUsers.map((u: { id: string }) => u.id))).toEqual(
      new Set(afterSecondBaUsers.map((u: { id: string }) => u.id)),
    );
  });

  it("updates mutable fields (email, image, name) when the Clerk side changes", async () => {
    //* Arrange
    const before = [fixture("user_m", "old@example.test", { firstName: "Old", imageUrl: "https://old" })];
    const after = [fixture("user_m", "new@example.test", { firstName: "New", imageUrl: "https://new" })];

    //* Act
    await migrateClerkUsers(db, { clerkHashes: {}, dryRun: false, users: before });
    await migrateClerkUsers(db, { clerkHashes: {}, dryRun: false, users: after });
    const [baUser] = await db.select().from(betterAuthUserTable);

    //* Assert
    expect(baUser.email).toBe("new@example.test");
    expect(baUser.image).toBe("https://new");
    expect(baUser.name).toBe("New");
  });

  it("backfills a password when the hash export becomes available on a subsequent run", async () => {
    //* Arrange
    const users = [fixture("user_late", "late@example.test")];

    //* Act
    await migrateClerkUsers(db, { clerkHashes: {}, dryRun: false, users });
    const afterFirst = await db.select().from(betterAuthAccountTable);
    await migrateClerkUsers(db, { clerkHashes: { user_late: "$2b$10$now-i-have-a-hash" }, dryRun: false, users });
    const afterSecond = await db.select().from(betterAuthAccountTable);

    //* Assert
    expect(afterFirst[0].password).toBeNull();
    expect(afterSecond[0].password).toBe("$2b$10$now-i-have-a-hash");
    expect(afterSecond).toHaveLength(1);
  });

  it("does not clobber an existing password when re-run without hashes", async () => {
    //* Arrange
    const users = [fixture("user_set", "set@example.test")];

    //* Act
    await migrateClerkUsers(db, { clerkHashes: { user_set: "$2b$10$set-hash" }, dryRun: false, users });
    // Simulate a later run that forgot the hash export (e.g., operator
    // re-runs without --hashes). Existing password must be preserved.
    await migrateClerkUsers(db, { clerkHashes: {}, dryRun: false, users });
    const accounts = await db.select().from(betterAuthAccountTable);

    //* Assert
    expect(accounts[0].password).toBe("$2b$10$set-hash");
  });
});

describe("migrateClerkUsers — dry run", () => {
  it("writes nothing and reports the same totals as a real run", async () => {
    //* Arrange
    const users = [fixture("user_dry", "dry@example.test")];

    //* Act
    const result = await migrateClerkUsers(db, { clerkHashes: {}, dryRun: true, users });
    const baUsers = await db.select().from(betterAuthUserTable);
    const baAccounts = await db.select().from(betterAuthAccountTable);

    //* Assert
    expect(result.seen).toBe(1);
    expect(result.usersUpserted).toBe(1);
    expect(result.accountsUpserted).toBe(1);
    expect(baUsers).toHaveLength(0);
    expect(baAccounts).toHaveLength(0);
  });
});
