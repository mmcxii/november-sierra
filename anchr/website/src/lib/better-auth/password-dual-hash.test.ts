import { hashPassword, verifyPassword } from "@/lib/better-auth/password";
import { hash as bcryptHashRaw } from "bcryptjs";
import { getTestInstance } from "better-auth/test";
import { describe, expect, it } from "vitest";

// Integration test — bcrypt → argon2id dual-hash via BA's real credential flow.
//
// This proves the migration happy path: a Clerk-exported user row with a
// bcrypt password column signs in successfully through BA. Runs against BA's
// in-memory sqlite test harness using our production password.hash /
// password.verify hooks, so the verification path matches prod exactly.

describe("password dual-hash — BA sign-in integration", () => {
  it("signs in with a Clerk-exported bcrypt hash", async () => {
    //* Arrange
    const email = "migrated-clerk-user@example.test";
    const password = "migrated-password-123";
    const clerkBcryptHash = await bcryptHashRaw(password, 10);
    const clerkId = "user_2migratedTESTabc";

    const { client, db } = await getTestInstance(
      {
        emailAndPassword: {
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
          requireEmailVerification: false,
        },
      },
      { disableTestUser: true },
    );

    // Seed the user + account the way the migration script does: text PK,
    // credential provider, bcrypt hash imported from Clerk.
    await db.create({
      data: {
        createdAt: new Date(),
        email,
        emailVerified: true,
        id: clerkId,
        name: "Migrated User",
        updatedAt: new Date(),
      },
      forceAllowId: true,
      model: "user",
    });
    await db.create({
      data: {
        accountId: clerkId,
        createdAt: new Date(),
        id: `clerk-migrated-${clerkId}`,
        password: clerkBcryptHash,
        providerId: "credential",
        updatedAt: new Date(),
        userId: clerkId,
      },
      forceAllowId: true,
      model: "account",
    });

    //* Act
    const correct = await client.signIn.email({ email, password });
    const incorrect = await client.signIn.email({ email, password: "not-the-right-password" });

    //* Assert
    expect(correct.error).toBeNull();
    expect(correct.data?.user.id).toBe(clerkId);
    expect(correct.data?.user.email).toBe(email);
    expect(incorrect.error).not.toBeNull();
  });

  it("stores fresh sign-ups as argon2id, not bcrypt", async () => {
    //* Arrange
    const email = "new-ba-user@example.test";
    const password = "fresh-signup-pw";

    const { client, db } = await getTestInstance(
      {
        emailAndPassword: {
          autoSignIn: true,
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
          requireEmailVerification: false,
        },
      },
      { disableTestUser: true },
    );

    //* Act
    const signUp = await client.signUp.email({ email, name: "New User", password });
    const accounts = await db.findMany<{ password: null | string; providerId: string }>({
      model: "account",
      where: [{ field: "providerId", operator: "eq", value: "credential" }],
    });

    //* Assert
    expect(signUp.error).toBeNull();
    const stored = accounts[0]?.password;
    expect(stored).toMatch(/^\$argon2id\$/);
  });
});
