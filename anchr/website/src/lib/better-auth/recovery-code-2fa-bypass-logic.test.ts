import { describe, expect, it, vi } from "vitest";
import {
  type BypassDeps,
  type BypassUser,
  redeemRecoveryCodeForTwoFactorBypass,
} from "./recovery-code-2fa-bypass-logic";

type FakeState = {
  cookieValue: null | string;
  createSessionShouldReturn: null | { token: string; userId: string };
  redeemResult: Awaited<ReturnType<BypassDeps["redeem"]>>;
  user: null | BypassUser;
  verificationValue: null | { value: string };
};

function createFakeDeps(initial: Partial<FakeState> = {}): {
  deps: BypassDeps;
  mocks: ReturnType<typeof createMocks>;
  state: FakeState;
} {
  const state: FakeState = {
    cookieValue: "signed-cookie-id",
    createSessionShouldReturn: { token: "session-token-1", userId: "user_1" },
    redeemResult: { kind: "ok" },
    user: { email: "user@example.test", id: "user_1" },
    verificationValue: { value: "user_1" },
    ...initial,
  };

  const mocks = createMocks(state);
  const deps: BypassDeps = {
    createSession: mocks.createSession,
    deleteVerification: mocks.deleteVerification,
    findUserById: mocks.findUserById,
    findVerificationValue: mocks.findVerificationValue,
    readSignedTwoFactorCookie: mocks.readSignedTwoFactorCookie,
    redeem: mocks.redeem,
    setSessionCookie: mocks.setSessionCookie,
  };

  return { deps, mocks, state };
}

function createMocks(state: FakeState) {
  return {
    createSession: vi.fn(async () => state.createSessionShouldReturn),
    deleteVerification: vi.fn(async () => undefined),
    findUserById: vi.fn(async () => state.user),
    findVerificationValue: vi.fn(async () => state.verificationValue),
    readSignedTwoFactorCookie: vi.fn(async () => state.cookieValue),
    redeem: vi.fn(async () => state.redeemResult),
    setSessionCookie: vi.fn(async () => undefined),
  };
}

describe("redeemRecoveryCodeForTwoFactorBypass — happy path", () => {
  it("creates a session, sets the cookie, and deletes the pending 2FA verification", async () => {
    //* Arrange
    const { deps, mocks } = createFakeDeps();

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "ABCDE-12345");

    //* Assert
    expect(result).toEqual({ kind: "ok" });
    expect(mocks.redeem).toHaveBeenCalledWith("user_1", "ABCDE-12345");
    expect(mocks.createSession).toHaveBeenCalledWith("user_1");
    expect(mocks.setSessionCookie).toHaveBeenCalledTimes(1);
    expect(mocks.deleteVerification).toHaveBeenCalledWith("signed-cookie-id");
  });
});

describe("redeemRecoveryCodeForTwoFactorBypass — cookie failures", () => {
  it("returns invalid_two_factor_cookie when the cookie is missing", async () => {
    //* Arrange
    const { deps, mocks } = createFakeDeps({ cookieValue: null });

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "ABCDE-12345");

    //* Assert
    expect(result).toEqual({ kind: "invalid_two_factor_cookie" });
    expect(mocks.findVerificationValue).not.toHaveBeenCalled();
    expect(mocks.redeem).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });

  it("returns invalid_two_factor_cookie when the verification row was deleted", async () => {
    //* Arrange
    const { deps, mocks } = createFakeDeps({ verificationValue: null });

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "ABCDE-12345");

    //* Assert
    expect(result).toEqual({ kind: "invalid_two_factor_cookie" });
    expect(mocks.findUserById).not.toHaveBeenCalled();
    expect(mocks.redeem).not.toHaveBeenCalled();
  });

  it("returns invalid_two_factor_cookie when the user no longer exists", async () => {
    //* Arrange
    const { deps, mocks } = createFakeDeps({ user: null });

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "ABCDE-12345");

    //* Assert
    expect(result).toEqual({ kind: "invalid_two_factor_cookie" });
    expect(mocks.redeem).not.toHaveBeenCalled();
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});

describe("redeemRecoveryCodeForTwoFactorBypass — code failures", () => {
  it("returns invalid_code when the recovery code does not match", async () => {
    //* Arrange
    const { deps, mocks } = createFakeDeps({ redeemResult: { kind: "invalid" } });

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "WRONG-CODE!");

    //* Assert
    expect(result).toEqual({ kind: "invalid_code" });
    // No session created and the 2FA cookie remains valid for retry.
    expect(mocks.createSession).not.toHaveBeenCalled();
    expect(mocks.deleteVerification).not.toHaveBeenCalled();
  });

  it("returns locked when the user is in lockout", async () => {
    //* Arrange
    const lockedUntil = new Date("2026-04-21T00:00:00Z");
    const { deps, mocks } = createFakeDeps({ redeemResult: { kind: "locked", lockedUntil } });

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "ABCDE-12345");

    //* Assert
    expect(result).toEqual({ kind: "locked", lockedUntil });
    expect(mocks.createSession).not.toHaveBeenCalled();
  });
});

describe("redeemRecoveryCodeForTwoFactorBypass — session creation failure", () => {
  it("does not delete the 2FA verification when session creation fails", async () => {
    //* Arrange
    const { deps, mocks } = createFakeDeps({ createSessionShouldReturn: null });

    //* Act
    const result = await redeemRecoveryCodeForTwoFactorBypass(deps, "ABCDE-12345");

    //* Assert
    expect(result).toEqual({ kind: "failed_to_create_session" });
    expect(mocks.deleteVerification).not.toHaveBeenCalled();
    expect(mocks.setSessionCookie).not.toHaveBeenCalled();
  });
});
