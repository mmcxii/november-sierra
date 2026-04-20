import { hashPassword, verifyPassword } from "@/lib/better-auth/password";
import { emailOTP, twoFactor } from "better-auth/plugins";
import { getTestInstance } from "better-auth/test";
import { describe, expect, it } from "vitest";

// Spike 1 — Better Auth custom password hash hook (argon2id).
//
// Goal (from ANC-149 pre-implementation spikes): prove we can override BA's
// default scrypt with argon2id via @node-rs/argon2 without breaking the plugin
// ecosystem we depend on (twoFactor, emailOTP).
//
// Approach: spin up BA against its own in-memory sqlite test harness, wire
// the same password.hash / password.verify hooks from our production config,
// mount the same plugins, then run the happy path end-to-end.
//
// Pass criteria:
//  1. Sign-up writes an argon2id hash into the account.password column.
//  2. Sign-in with the same password succeeds.
//  3. Wrong password is rejected.
//  4. twoFactor and emailOTP plugin endpoints mount alongside the argon2 hook.
//
// Fail mode (from ticket): fall back to BA's scrypt default and adjust the
// migration script to re-hash bcrypt → scrypt instead of bcrypt → argon2id.

describe("spike 1 — argon2id hook + twoFactor + emailOTP", () => {
  it("round-trips sign-up/sign-in with argon2id hash", async () => {
    //* Arrange
    const { client, db } = await getTestInstance(
      {
        emailAndPassword: {
          autoSignIn: true,
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
          requireEmailVerification: false,
        },
        plugins: [
          emailOTP({
            sendVerificationOTP: async () => {
              /* noop */
            },
          }),
          twoFactor({
            otpOptions: {
              sendOTP: async () => {
                /* noop */
              },
            },
          }),
        ],
      },
      { disableTestUser: true },
    );

    const email = "argon2-spike@example.test";
    const password = "correct-horse-battery-staple";

    //* Act
    const signUp = await client.signUp.email({ email, name: "Spike User", password });

    //* Assert
    expect(signUp.error).toBeNull();
    expect(signUp.data?.user.email).toBe(email);

    // Inspect the underlying account row to confirm the stored password is
    // argon2id (not scrypt, not plaintext).
    const accounts = await db.findMany<{ password: null | string; providerId: string }>({
      model: "account",
      where: [{ field: "providerId", operator: "eq", value: "credential" }],
    });
    const storedHash = accounts[0]?.password;
    expect(storedHash).toBeTruthy();
    expect(storedHash).toMatch(/^\$argon2id\$/);

    // Sign in with the same password.
    const ok = await client.signIn.email({ email, password });
    expect(ok.error).toBeNull();
    expect(ok.data?.user.email).toBe(email);

    // Wrong password is rejected by the same hook.
    const bad = await client.signIn.email({ email, password: "wrong-password" });
    expect(bad.error).not.toBeNull();
  });

  it("mounts twoFactor and emailOTP endpoints alongside the argon2id config", async () => {
    //* Arrange
    const { auth } = await getTestInstance(
      {
        emailAndPassword: {
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
        },
        plugins: [
          emailOTP({
            sendVerificationOTP: async () => {
              /* noop */
            },
          }),
          twoFactor({
            otpOptions: {
              sendOTP: async () => {
                /* noop */
              },
            },
          }),
        ],
      },
      { disableTestUser: true },
    );

    //* Act
    const api = auth.api as Record<string, unknown>;
    const hasEmailOtpSend = typeof api["sendVerificationOTP"] === "function";
    const hasTwoFactorEnable = typeof api["enableTwoFactor"] === "function";
    const hasTwoFactorVerifyOtp = typeof api["verifyTwoFactorOTP"] === "function";
    const hasTwoFactorSendOtp = typeof api["sendTwoFactorOTP"] === "function";

    //* Assert
    expect(hasEmailOtpSend).toBe(true);
    expect(hasTwoFactorEnable).toBe(true);
    expect(hasTwoFactorVerifyOtp).toBe(true);
    expect(hasTwoFactorSendOtp).toBe(true);
  });
});
