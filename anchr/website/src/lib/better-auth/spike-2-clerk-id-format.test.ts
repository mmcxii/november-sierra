import { hashPassword, verifyPassword } from "@/lib/better-auth/password";
import { getTestInstance } from "better-auth/test";
import { describe, expect, it } from "vitest";

// Spike 2 — BA accepts Clerk-format user IDs.
//
// Goal (from ANC-149 pre-implementation spikes): confirm BA's adapter and
// internal queries accept `user_xxx` non-UUID strings so the production
// migration can preserve Clerk IDs verbatim without cascading a remap across
// 7+ FK tables + Stripe's stored client_reference_id.
//
// Finding: BA's adapter `create` requires `forceAllowId: true` to honor a
// pre-set id in `data`. The production migration script writes via Drizzle
// directly (bypassing the adapter) so this is immaterial to the migration
// path itself — but any BA-adapter-routed create that needs a specific id
// must pass the flag. Documented so a future admin tool doesn't regress.
//
// Pass criteria:
//  1. Adapter accepts `user_xxx` as a primary key on the user table.
//  2. signIn.email against the seeded credential succeeds.
//  3. getSession returns session.user.id === the Clerk-format id.
//  4. Adapter update on user.id round-trips.
//
// Fail mode (from ticket): user ID remapping across 7+ FK tables becomes
// its own migration ticket; Shot 1 pauses and gets re-scoped.

describe("spike 2 — BA accepts Clerk-format user IDs", () => {
  it("round-trips sign-in + getSession + update for a user_xxx id", async () => {
    //* Arrange
    const clerkId = "user_2zzTESTkL9XyAbCdEfGh";
    const email = "clerk-id-spike@example.test";
    const password = "correct-horse-battery-staple";
    const passwordHash = await hashPassword(password);

    const { auth, client, db } = await getTestInstance(
      {
        emailAndPassword: {
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
          requireEmailVerification: false,
        },
      },
      { disableTestUser: true },
    );

    const createdUser = await db.create<{ id: string }>({
      data: {
        createdAt: new Date(),
        email,
        emailVerified: true,
        id: clerkId,
        name: "Clerk-Migrated User",
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
        password: passwordHash,
        providerId: "credential",
        updatedAt: new Date(),
        userId: clerkId,
      },
      forceAllowId: true,
      model: "account",
    });

    //* Act
    const signInHeaders = new Headers();
    const signIn = await client.signIn.email({
      email,
      fetchOptions: {
        onSuccess(ctx) {
          const setCookie = ctx.response.headers.get("set-cookie");
          if (setCookie != null) {
            signInHeaders.set("cookie", setCookie);
          }
        },
      },
      password,
    });
    const session = await auth.api.getSession({ headers: signInHeaders });
    await db.update({
      model: "user",
      update: { name: "Updated Name" },
      where: [{ field: "id", operator: "eq", value: clerkId }],
    });
    const [updated] = await db.findMany<{ id: string; name: string }>({
      model: "user",
      where: [{ field: "id", operator: "eq", value: clerkId }],
    });

    //* Assert
    expect(createdUser.id).toBe(clerkId);
    expect(signIn.error).toBeNull();
    expect(signIn.data?.user.id).toBe(clerkId);
    expect(signIn.data?.user.email).toBe(email);
    expect(session?.user.id).toBe(clerkId);
    expect(session?.session.userId).toBe(clerkId);
    expect(updated.id).toBe(clerkId);
    expect(updated.name).toBe("Updated Name");
  });

  it("rejects wrong password for a Clerk-seeded user (sanity check)", async () => {
    //* Arrange
    const clerkId = "user_2zzTESTmM0WxVuTsRqPo";
    const email = "clerk-id-spike2@example.test";
    const passwordHash = await hashPassword("actual-password");

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

    await db.create<{ id: string }>({
      data: {
        createdAt: new Date(),
        email,
        emailVerified: true,
        id: clerkId,
        name: "Clerk Spike 2",
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
        password: passwordHash,
        providerId: "credential",
        updatedAt: new Date(),
        userId: clerkId,
      },
      forceAllowId: true,
      model: "account",
    });

    //* Act
    const result = await client.signIn.email({ email, password: "wrong-password" });

    //* Assert
    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });
});
