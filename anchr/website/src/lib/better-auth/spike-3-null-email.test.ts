import { hashPassword, verifyPassword } from "@/lib/better-auth/password";
import { getTestInstance } from "better-auth/test";
import { describe, expect, it } from "vitest";

// Spike 3 — Null email handling.
//
// Goal (from ANC-149 pre-implementation spikes): confirm BA supports
// `user.email` as nullable so nostr-only users (who legitimately have no
// email) can exist.
//
// Context for Shot 1: The ticket explicitly says this spike "blocks ANC-157's
// design, not Shot 1 directly." Shot 1 is admin-whitelist only; nostr users
// never enter the Shot 1 surface. The Shot 1 position is: email stays
// notNull in ba_user; ANC-157 re-opens this when nostr flows are built.
//
// This spike therefore asserts two things:
//  1. BA's out-of-the-box sign-up pipeline requires an email (confirming that
//     "no action needed for Shot 1" is correct).
//  2. BA's email-and-password sign-in requires an email identifier (so a
//     sentinel-email workaround for nostr users is compatible with the
//     existing BA flow; we don't need to fork BA for Shot 1).
//
// Pass criteria:
//  1. signUp.email with an empty email is rejected.
//  2. signIn.email with a sentinel email + correct password succeeds (proving
//     the fail-mode workaround from the ticket is viable for ANC-157).
//
// Fail mode (from ticket): use a placeholder sentinel (e.g. `<userId>@nostr.local`)
// and document the convention. Not blocking Shot 1.

describe("spike 3 — null email handling (Shot 1 deferral)", () => {
  it("rejects sign-up with empty email (confirms notNull is correct for Shot 1)", async () => {
    //* Arrange
    const { client } = await getTestInstance(
      {
        emailAndPassword: {
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
          requireEmailVerification: false,
        },
      },
      { disableTestUser: true },
    );

    //* Act
    const result = await client.signUp.email({
      email: "",
      name: "No Email",
      password: "correct-horse-battery-staple",
    });

    //* Assert
    expect(result.error).not.toBeNull();
    expect(result.data).toBeNull();
  });

  it("accepts sentinel emails for the ANC-157 fail-mode workaround", async () => {
    //* Arrange — the workaround pattern: derive a sentinel email from the
    // nostr user id so the notNull constraint stays satisfied without lying
    // about having a real contact address.
    const sentinelEmail = "npub1abc123@nostr.local";
    const password = "correct-horse-battery-staple";

    const { client } = await getTestInstance(
      {
        emailAndPassword: {
          enabled: true,
          password: { hash: hashPassword, verify: verifyPassword },
          requireEmailVerification: false,
        },
      },
      { disableTestUser: true },
    );

    //* Act
    const signUp = await client.signUp.email({ email: sentinelEmail, name: "Nostr User", password });
    const signIn = await client.signIn.email({ email: sentinelEmail, password });

    //* Assert
    expect(signUp.error).toBeNull();
    expect(signIn.error).toBeNull();
    expect(signIn.data?.user.email).toBe(sentinelEmail);
  });
});
