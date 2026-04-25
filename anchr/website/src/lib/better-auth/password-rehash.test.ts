import { betterAuthAccountTable, betterAuthUserTable } from "@/lib/db/schema/better-auth";
import { PGlite } from "@electric-sql/pglite";
import { hash as bcryptHash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/pglite";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isArgon2Hash, isBcryptHash } from "./password";

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- pglite/drizzle typing
let db: any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- PGlite instance
let client: any;

vi.mock("@/lib/db/client", () => ({
  get db() {
    return db;
  },
}));

beforeEach(async () => {
  client = new PGlite();
  db = drizzle(client);
  await client.exec(`
    CREATE TABLE ba_user (
      created_at TIMESTAMP DEFAULT now() NOT NULL,
      email TEXT NOT NULL,
      email_verified BOOLEAN DEFAULT false NOT NULL,
      id TEXT PRIMARY KEY,
      image TEXT,
      name TEXT NOT NULL,
      two_factor_enabled BOOLEAN DEFAULT false NOT NULL,
      updated_at TIMESTAMP DEFAULT now() NOT NULL
    );
    CREATE TABLE ba_account (
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
  `);
});

async function seedAccount(userId: string, password: string): Promise<string> {
  await db
    .insert(betterAuthUserTable)
    .values({ email: `${userId}@example.test`, emailVerified: true, id: userId, name: userId });
  await db.insert(betterAuthAccountTable).values({
    accountId: userId,
    id: `acct-${userId}`,
    password,
    providerId: "credential",
    userId,
  });
  return password;
}

describe("verifyPasswordWithRehash — bcrypt upgrade", () => {
  it("upgrades a successfully-verified bcrypt hash to argon2id", async () => {
    //* Arrange
    const userId = "user_bcrypt";
    const plaintext = "correct-horse-battery-staple";
    const oldHash = await bcryptHash(plaintext, 4);
    await seedAccount(userId, oldHash);
    const { verifyPasswordWithRehash } = await import("./password-rehash");

    //* Act
    const ok = await verifyPasswordWithRehash({ hash: oldHash, password: plaintext });
    const [row] = await db
      .select({ password: betterAuthAccountTable.password })
      .from(betterAuthAccountTable)
      .where(eq(betterAuthAccountTable.userId, userId));

    //* Assert
    expect(isBcryptHash(oldHash)).toBe(true);
    expect(ok).toBe(true);
    expect(row.password).not.toBe(oldHash);
    expect(isArgon2Hash(row.password)).toBe(true);
  });

  it("does not upgrade when the bcrypt verify fails", async () => {
    //* Arrange
    const userId = "user_wrong_password";
    const plaintext = "correct-horse-battery-staple";
    const oldHash = await bcryptHash(plaintext, 4);
    await seedAccount(userId, oldHash);
    const { verifyPasswordWithRehash } = await import("./password-rehash");

    //* Act
    const ok = await verifyPasswordWithRehash({ hash: oldHash, password: "wrong-password" });
    const [row] = await db
      .select({ password: betterAuthAccountTable.password })
      .from(betterAuthAccountTable)
      .where(eq(betterAuthAccountTable.userId, userId));

    //* Assert
    expect(ok).toBe(false);
    expect(row.password).toBe(oldHash);
  });

  it("leaves argon2id hashes untouched on successful verify", async () => {
    //* Arrange
    const userId = "user_argon";
    const plaintext = "already-modern";
    const { hashPassword } = await import("./password");
    const argonHash = await hashPassword(plaintext);
    await seedAccount(userId, argonHash);
    const { verifyPasswordWithRehash } = await import("./password-rehash");

    //* Act
    const ok = await verifyPasswordWithRehash({ hash: argonHash, password: plaintext });
    const [row] = await db
      .select({ password: betterAuthAccountTable.password })
      .from(betterAuthAccountTable)
      .where(eq(betterAuthAccountTable.userId, userId));

    //* Assert
    expect(ok).toBe(true);
    expect(row.password).toBe(argonHash);
  });
});
