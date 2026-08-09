import { db } from "@/lib/db/client";
import { groupsTable, membersTable } from "@/lib/db/schema";
import { envSchema } from "@/lib/env";
import { eq } from "drizzle-orm";
import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "sf_session";

function sign(memberId: string): string {
  const sig = createHmac("sha256", envSchema.SESSION_SECRET).update(memberId).digest("base64url");
  return `${memberId}.${sig}`;
}

function verify(token: string): null | string {
  const [memberId, sig] = token.split(".");
  if (!memberId || !sig) {
    return null;
  }

  const expected = createHmac("sha256", envSchema.SESSION_SECRET).update(memberId).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return null;
  }
  return memberId;
}

export async function setSessionCookie(memberId: string): Promise<void> {
  const jar = await cookies();
  jar.set(SESSION_COOKIE, sign(memberId), {
    httpOnly: true,
    maxAge: 60 * 60 * 24 * 120,
    path: "/",
    sameSite: "lax",
    secure: envSchema.NODE_ENV === "production",
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
}

export async function getSessionMemberId(): Promise<null | string> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token == null) {
    return null;
  }
  return verify(token);
}

export async function getSessionContext() {
  const memberId = await getSessionMemberId();
  if (memberId == null) {
    return null;
  }

  const rows = await db
    .select({
      group: groupsTable,
      member: membersTable,
    })
    .from(membersTable)
    .innerJoin(groupsTable, eq(membersTable.groupId, groupsTable.id))
    .where(eq(membersTable.id, memberId))
    .limit(1);

  return rows[0] ?? null;
}
