import { db } from "@/lib/db/client";
import { betterAuthUserTable, recoveryCodesTable, recoveryLockoutTable } from "@/lib/db/schema/better-auth";
import { and, eq, isNull } from "drizzle-orm";
import { sendRecoveryCodeAuditEmail } from "./email";
import { RECOVERY_CODE_COUNT, generateRecoveryCode, normalizeRecoveryCode } from "./recovery-code-format";
import {
  type RecoveryCodesStore,
  type RecoveryRedeemResult,
  countUnusedRecoveryCodes as countUnusedLogic,
  issueRecoveryCodes as issueLogic,
  redeemRecoveryCode as redeemLogic,
} from "./recovery-codes-logic";

export { RECOVERY_CODE_COUNT, generateRecoveryCode, normalizeRecoveryCode };
export type { RecoveryRedeemResult };

// Drizzle-backed store — the production wiring. The pure logic lives in
// recovery-codes-logic.ts and is exercised directly by integration tests.
const drizzleStore: RecoveryCodesStore = {
  async clearLockoutAttempts(userId) {
    await db
      .update(recoveryLockoutTable)
      .set({ failedAttempts: 0, lockedUntil: null, updatedAt: new Date() })
      .where(eq(recoveryLockoutTable.userId, userId));
  },
  async deleteUserCodes(userId) {
    await db.delete(recoveryCodesTable).where(eq(recoveryCodesTable.userId, userId));
  },
  async findUserById(userId) {
    const [row] = await db.select().from(betterAuthUserTable).where(eq(betterAuthUserTable.id, userId)).limit(1);
    return row == null ? null : { email: row.email, id: row.id };
  },
  async getLockout(userId) {
    const [row] = await db.select().from(recoveryLockoutTable).where(eq(recoveryLockoutTable.userId, userId)).limit(1);
    return row == null
      ? null
      : { failedAttempts: row.failedAttempts, lockedUntil: row.lockedUntil, userId: row.userId };
  },
  async insertCodes(rows) {
    if (rows.length === 0) {
      return;
    }
    await db.insert(recoveryCodesTable).values(rows);
  },
  async listUnusedCodes(userId) {
    const rows = await db
      .select()
      .from(recoveryCodesTable)
      .where(and(eq(recoveryCodesTable.userId, userId), isNull(recoveryCodesTable.usedAt)));
    return rows.map((r) => ({ codeHash: r.codeHash, id: r.id, usedAt: r.usedAt, userId: r.userId }));
  },
  async markCodeUsed(codeId, usedAt) {
    await db.update(recoveryCodesTable).set({ usedAt }).where(eq(recoveryCodesTable.id, codeId));
  },
  async upsertLockout(row) {
    const existing = await this.getLockout(row.userId);
    if (existing == null) {
      await db.insert(recoveryLockoutTable).values({
        failedAttempts: row.failedAttempts,
        lockedUntil: row.lockedUntil,
        userId: row.userId,
      });
    } else {
      await db
        .update(recoveryLockoutTable)
        .set({ failedAttempts: row.failedAttempts, lockedUntil: row.lockedUntil, updatedAt: new Date() })
        .where(eq(recoveryLockoutTable.userId, row.userId));
    }
  },
};

async function sendAudit(email: string, kind: "attempted" | "regenerated" | "used"): Promise<void> {
  await sendRecoveryCodeAuditEmail(email, kind, { timestamp: new Date() });
}

export async function issueRecoveryCodesForUser(userId: string): Promise<string[]> {
  return issueLogic(drizzleStore, sendAudit, userId);
}

export async function redeemRecoveryCode(userId: string, code: string): Promise<RecoveryRedeemResult> {
  return redeemLogic(drizzleStore, sendAudit, userId, code);
}

export async function countUnusedRecoveryCodes(userId: string): Promise<number> {
  return countUnusedLogic(drizzleStore, userId);
}
