import { hashPassword, verifyPassword } from "./password";
import { RECOVERY_CODE_COUNT, generateRecoveryCode, normalizeRecoveryCode } from "./recovery-code-format";

// Pure orchestration layer for recovery-code flows. Decoupled from Drizzle
// so integration tests can drive it against an in-memory store and exercise
// issue → redeem → lockout cycles without a DB.

const LOCKOUT_THRESHOLD = 10;
const LOCKOUT_DURATION_MS = 24 * 60 * 60 * 1000;

export type StoredRecoveryCode = {
  codeHash: string;
  id: string;
  usedAt: null | Date;
  userId: string;
};

export type StoredLockout = {
  failedAttempts: number;
  lockedUntil: null | Date;
  userId: string;
};

export type StoredUser = {
  email: string;
  id: string;
};

export type RecoveryAuditKind = "attempted" | "regenerated" | "used";

export type RecoveryCodesStore = {
  clearLockoutAttempts: (userId: string) => Promise<void>;
  deleteUserCodes: (userId: string) => Promise<void>;
  findUserById: (userId: string) => Promise<null | StoredUser>;
  getLockout: (userId: string) => Promise<null | StoredLockout>;
  insertCodes: (rows: StoredRecoveryCode[]) => Promise<void>;
  listUnusedCodes: (userId: string) => Promise<StoredRecoveryCode[]>;
  markCodeUsed: (codeId: string, usedAt: Date) => Promise<void>;
  upsertLockout: (row: StoredLockout) => Promise<void>;
};

export type SendAuditEmail = (email: string, kind: RecoveryAuditKind) => Promise<void>;

export type RecoveryRedeemResult = { kind: "invalid" } | { kind: "locked"; lockedUntil: Date } | { kind: "ok" };

async function auditEmailSafe(
  send: SendAuditEmail,
  email: string,
  kind: RecoveryAuditKind,
  tag: string,
): Promise<void> {
  try {
    await send(email, kind);
  } catch (error) {
    // Audit emails are notification-grade; a Resend outage must never block
    // the auth flow the user is in the middle of.
    console.error(`[recovery-codes] ${tag} email failed:`, error);
  }
}

export async function issueRecoveryCodes(
  store: RecoveryCodesStore,
  send: SendAuditEmail,
  userId: string,
): Promise<string[]> {
  // Invalidate any prior codes — regeneration is always a clean slate.
  await store.deleteUserCodes(userId);

  const codes: string[] = [];
  const rows: StoredRecoveryCode[] = [];
  for (let i = 0; i < RECOVERY_CODE_COUNT; i++) {
    const code = generateRecoveryCode();
    codes.push(code);
    const hash = await hashPassword(normalizeRecoveryCode(code));
    rows.push({ codeHash: hash, id: crypto.randomUUID(), usedAt: null, userId });
  }
  await store.insertCodes(rows);

  const user = await store.findUserById(userId);
  if (user != null) {
    await auditEmailSafe(send, user.email, "regenerated", "regenerate-audit");
  }

  return codes;
}

export async function redeemRecoveryCode(
  store: RecoveryCodesStore,
  send: SendAuditEmail,
  userId: string,
  code: string,
  now: () => Date = () => new Date(),
): Promise<RecoveryRedeemResult> {
  const lockout = await store.getLockout(userId);
  if (lockout?.lockedUntil != null && lockout.lockedUntil > now()) {
    return { kind: "locked", lockedUntil: lockout.lockedUntil };
  }

  const normalized = normalizeRecoveryCode(code);
  const unused = await store.listUnusedCodes(userId);

  for (const row of unused) {
    // verifyPassword is constant-time inside a single hash verification;
    // iterating over unused codes is fine because N ≤ RECOVERY_CODE_COUNT.
    if (await verifyPassword({ hash: row.codeHash, password: normalized })) {
      await store.markCodeUsed(row.id, now());
      await store.clearLockoutAttempts(userId);

      const user = await store.findUserById(userId);
      if (user != null) {
        await auditEmailSafe(send, user.email, "used", "used-audit");
      }
      return { kind: "ok" };
    }
  }

  const existing = await store.getLockout(userId);
  const nextCount = (existing?.failedAttempts ?? 0) + 1;
  const lockedUntil =
    nextCount >= LOCKOUT_THRESHOLD ? new Date(now().getTime() + LOCKOUT_DURATION_MS) : (existing?.lockedUntil ?? null);
  await store.upsertLockout({ failedAttempts: nextCount, lockedUntil, userId });

  const user = await store.findUserById(userId);
  if (user != null) {
    await auditEmailSafe(send, user.email, "attempted", "attempted-audit");
  }
  return { kind: "invalid" };
}

export async function countUnusedRecoveryCodes(store: RecoveryCodesStore, userId: string): Promise<number> {
  const rows = await store.listUnusedCodes(userId);
  return rows.length;
}
