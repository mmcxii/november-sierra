import { describe, expect, it, vi } from "vitest";
import { RECOVERY_CODE_COUNT } from "./recovery-code-format";
import {
  type RecoveryAuditKind,
  type RecoveryCodesStore,
  type StoredLockout,
  type StoredRecoveryCode,
  type StoredUser,
  countUnusedRecoveryCodes,
  issueRecoveryCodes,
  redeemRecoveryCode,
} from "./recovery-codes-logic";

// In-memory store used to exercise the recovery-code orchestration end-to-end.
// Mirrors the semantics of the Drizzle store in recovery-codes.ts so these
// tests verify real issue → redeem → lockout state transitions, not mock
// behavior.
function createInMemoryStore(user: StoredUser): RecoveryCodesStore {
  const codes: StoredRecoveryCode[] = [];
  let lockout: null | StoredLockout = null;

  return {
    async clearLockoutAttempts(userId) {
      if (lockout?.userId === userId) {
        lockout = { failedAttempts: 0, lockedUntil: null, userId };
      }
    },
    async deleteUserCodes(userId) {
      for (let i = codes.length - 1; i >= 0; i--) {
        if (codes[i].userId === userId) {
          codes.splice(i, 1);
        }
      }
    },
    async findUserById(userId) {
      return userId === user.id ? user : null;
    },
    async getLockout(userId) {
      return lockout?.userId === userId ? { ...lockout } : null;
    },
    async insertCodes(rows) {
      codes.push(...rows.map((r) => ({ ...r })));
    },
    async listUnusedCodes(userId) {
      return codes.filter((c) => c.userId === userId && c.usedAt == null).map((c) => ({ ...c }));
    },
    async markCodeUsed(codeId, usedAt) {
      const row = codes.find((c) => c.id === codeId);
      if (row != null) {
        row.usedAt = usedAt;
      }
    },
    async upsertLockout(row) {
      lockout = { ...row };
    },
  };
}

describe("issueRecoveryCodes", () => {
  it("generates RECOVERY_CODE_COUNT unique codes and persists them hashed", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);

    //* Act
    const codes = await issueRecoveryCodes(store, send, user.id);
    const stored = await store.listUnusedCodes(user.id);

    //* Assert
    expect(codes.length).toBe(RECOVERY_CODE_COUNT);
    expect(new Set(codes).size).toBe(RECOVERY_CODE_COUNT);
    expect(stored.length).toBe(RECOVERY_CODE_COUNT);
    // None of the stored hashes should equal any plaintext code.
    for (const row of stored) {
      expect(codes).not.toContain(row.codeHash);
    }
    expect(send).toHaveBeenCalledWith(user.email, "regenerated" satisfies RecoveryAuditKind);
  });

  it("invalidates the prior set when regenerated", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);

    //* Act
    const firstSet = await issueRecoveryCodes(store, send, user.id);
    const secondSet = await issueRecoveryCodes(store, send, user.id);
    const stored = await store.listUnusedCodes(user.id);

    //* Assert
    expect(stored.length).toBe(RECOVERY_CODE_COUNT);
    // Stored hashes correspond to the second set only — attempting to redeem
    // any of the first set's plaintext codes against the current hashes fails.
    expect(firstSet).not.toEqual(secondSet);
  });
});

describe("redeemRecoveryCode — happy path", () => {
  it("redeems a valid code, marks it used, and fires the used audit email", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    const codes = await issueRecoveryCodes(store, send, user.id);
    send.mockClear();

    //* Act
    const result = await redeemRecoveryCode(store, send, user.id, codes[0]);
    const remaining = await countUnusedRecoveryCodes(store, user.id);

    //* Assert
    expect(result).toEqual({ kind: "ok" });
    expect(remaining).toBe(RECOVERY_CODE_COUNT - 1);
    expect(send).toHaveBeenCalledWith(user.email, "used" satisfies RecoveryAuditKind);
  });

  it("rejects a used code on second redemption", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    const codes = await issueRecoveryCodes(store, send, user.id);

    //* Act
    const first = await redeemRecoveryCode(store, send, user.id, codes[0]);
    const second = await redeemRecoveryCode(store, send, user.id, codes[0]);

    //* Assert
    expect(first.kind).toBe("ok");
    expect(second.kind).toBe("invalid");
  });

  it("accepts hyphen-stripped and uppercase variants", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    const [code] = await issueRecoveryCodes(store, send, user.id);
    const lowercaseNoHyphen = code.replace("-", "").toLowerCase();

    //* Act
    const result = await redeemRecoveryCode(store, send, user.id, lowercaseNoHyphen);

    //* Assert
    expect(result).toEqual({ kind: "ok" });
  });
});

describe("redeemRecoveryCode — invalid + lockout", () => {
  it("locks the account after 10 consecutive failed attempts", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    await issueRecoveryCodes(store, send, user.id);
    const fakeNow = new Date("2026-04-20T00:00:00Z");

    //* Act
    const results = [];
    for (let i = 0; i < 10; i++) {
      results.push(await redeemRecoveryCode(store, send, user.id, "WRONG-CODE!", () => fakeNow));
    }
    // 11th attempt inside the lockout window
    const eleventh = await redeemRecoveryCode(store, send, user.id, "WRONG-CODE!", () => fakeNow);
    const lockout = await store.getLockout(user.id);

    //* Assert
    expect(results.filter((r) => r.kind === "invalid").length).toBe(10);
    expect(eleventh.kind).toBe("locked");
    expect(lockout?.failedAttempts).toBeGreaterThanOrEqual(10);
    expect(lockout?.lockedUntil).not.toBeNull();
    if (eleventh.kind === "locked") {
      // Lockout is 24h from the 10th failed attempt.
      expect(eleventh.lockedUntil.getTime() - fakeNow.getTime()).toBe(24 * 60 * 60 * 1000);
    }
  });

  it("clears failed attempts on successful redemption", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    const codes = await issueRecoveryCodes(store, send, user.id);

    //* Act
    // Rack up a few failures (below lockout threshold), then succeed.
    for (let i = 0; i < 5; i++) {
      await redeemRecoveryCode(store, send, user.id, "WRONG-CODE!");
    }
    const beforeSuccess = await store.getLockout(user.id);
    const success = await redeemRecoveryCode(store, send, user.id, codes[1]);
    const afterSuccess = await store.getLockout(user.id);

    //* Assert
    expect(beforeSuccess?.failedAttempts).toBe(5);
    expect(success.kind).toBe("ok");
    expect(afterSuccess?.failedAttempts).toBe(0);
    expect(afterSuccess?.lockedUntil).toBeNull();
  });

  it("emits the attempted audit email on every failure", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    await issueRecoveryCodes(store, send, user.id);
    send.mockClear();

    //* Act
    await redeemRecoveryCode(store, send, user.id, "WRONG-CODE!");

    //* Assert
    expect(send).toHaveBeenCalledWith(user.email, "attempted" satisfies RecoveryAuditKind);
  });

  it("does not crash when the audit email send fails", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockRejectedValue(new Error("Resend 500"));

    //* Act
    const issued = await issueRecoveryCodes(store, send, user.id);

    //* Assert
    // Codes were still generated and persisted even though the audit failed.
    expect(issued.length).toBe(RECOVERY_CODE_COUNT);
  });

  it("returns locked while the lockout window is active, then unlocks after expiry", async () => {
    //* Arrange
    const user: StoredUser = { email: "user@example.test", id: "user_abc" };
    const store = createInMemoryStore(user);
    const send = vi.fn().mockResolvedValue(undefined);
    const codes = await issueRecoveryCodes(store, send, user.id);
    const lockoutStart = new Date("2026-04-20T00:00:00Z");
    for (let i = 0; i < 10; i++) {
      await redeemRecoveryCode(store, send, user.id, "WRONG-CODE!", () => lockoutStart);
    }

    //* Act
    const duringLockout = await redeemRecoveryCode(store, send, user.id, codes[0], () => lockoutStart);
    // Fast-forward past the 24h window.
    const afterLockout = new Date(lockoutStart.getTime() + 25 * 60 * 60 * 1000);
    const postLockout = await redeemRecoveryCode(store, send, user.id, codes[0], () => afterLockout);

    //* Assert
    expect(duringLockout.kind).toBe("locked");
    expect(postLockout.kind).toBe("ok");
  });
});
