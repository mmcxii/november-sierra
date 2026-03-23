import { db } from "@/lib/db/client";
import { referralCodesTable } from "@/lib/db/schema/referral-code";
import { and, eq, gt, isNull, or } from "drizzle-orm";

export async function isUsernameReservedByCode(username: string): Promise<boolean> {
  const [reserved] = await db
    .select({ id: referralCodesTable.id })
    .from(referralCodesTable)
    .where(
      and(
        eq(referralCodesTable.reservedUsername, username),
        eq(referralCodesTable.active, true),
        or(isNull(referralCodesTable.expiresAt), gt(referralCodesTable.expiresAt, new Date())),
      ),
    )
    .limit(1);

  return reserved != null;
}
