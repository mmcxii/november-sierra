import { auth } from "@/lib/better-auth/server";
import { db } from "@/lib/db/client";
import { betterAuthUserTable, membersTable, teamsTable } from "@/lib/db/schema";
import { envSchema } from "@/lib/env";
import { and, desc, eq } from "drizzle-orm";
import { cookies, headers } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

/** @deprecated Temporary cookie for pre-account members; remove with migration shim. */
export const SESSION_COOKIE = "sf_session";
export const PENDING_PASSWORD_COOKIE = "sf_pending_password";

function sign(memberId: string): string {
  const sig = createHmac("sha256", envSchema.SESSION_SECRET).update(memberId).digest("base64url");
  return `${memberId}.${sig}`;
}

function verify(token: string): null | string {
  const [memberId, sig] = token.split(".");
  if (memberId == null || sig == null) {
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

/** @deprecated */
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

/** @deprecated */
export async function getSessionMemberId(): Promise<null | string> {
  const jar = await cookies();
  const token = jar.get(SESSION_COOKIE)?.value;
  if (token == null) {
    return null;
  }
  return verify(token);
}

export async function setPendingPasswordCookie(payload: { password: string; username: string }): Promise<void> {
  const jar = await cookies();
  jar.set(PENDING_PASSWORD_COOKIE, JSON.stringify(payload), {
    httpOnly: true,
    maxAge: 60 * 60,
    path: "/",
    sameSite: "lax",
    secure: envSchema.NODE_ENV === "production",
  });
}

export async function getPendingPasswordCookie(): Promise<null | { password: string; username: string }> {
  const jar = await cookies();
  const raw = jar.get(PENDING_PASSWORD_COOKIE)?.value;
  if (raw == null) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as { password?: string; username?: string };
    if (parsed.password == null || parsed.username == null) {
      return null;
    }
    return { password: parsed.password, username: parsed.username };
  } catch {
    return null;
  }
}

export async function clearPendingPasswordCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(PENDING_PASSWORD_COOKIE);
}

export async function getAuthSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function getAuthUser() {
  const session = await getAuthSession();
  if (session?.user == null) {
    return null;
  }
  const [user] = await db
    .select()
    .from(betterAuthUserTable)
    .where(eq(betterAuthUserTable.id, session.user.id))
    .limit(1);
  return user ?? null;
}

export async function listMembershipsForUser(userId: string) {
  return db
    .select({
      member: membersTable,
      team: teamsTable,
      user: betterAuthUserTable,
    })
    .from(membersTable)
    .innerJoin(teamsTable, eq(membersTable.teamId, teamsTable.id))
    .innerJoin(betterAuthUserTable, eq(membersTable.userId, betterAuthUserTable.id))
    .where(eq(membersTable.userId, userId))
    .orderBy(desc(membersTable.joinedAt));
}

export async function getMembershipContext(teamId: string) {
  const user = await getAuthUser();
  if (user == null) {
    return null;
  }
  return getMembershipContextForUser(user.id, teamId);
}

export async function getMembershipContextForUser(userId: string, teamId: string) {
  const [row] = await db
    .select({
      member: membersTable,
      team: teamsTable,
      user: betterAuthUserTable,
    })
    .from(membersTable)
    .innerJoin(teamsTable, eq(membersTable.teamId, teamsTable.id))
    .innerJoin(betterAuthUserTable, eq(membersTable.userId, betterAuthUserTable.id))
    .where(and(eq(membersTable.userId, userId), eq(membersTable.teamId, teamId)))
    .limit(1);

  return row ?? null;
}

export type MembershipContext = NonNullable<Awaited<ReturnType<typeof getMembershipContextForUser>>>;

/**
 * Legacy helper used during migration / transitional call sites.
 * Prefer getMembershipContext(teamId) or getAuthUser().
 */
export async function getSessionContext() {
  const user = await getAuthUser();
  if (user != null) {
    const memberships = await listMembershipsForUser(user.id);
    const first = memberships[0];
    if (first == null) {
      return null;
    }
    return first;
  }

  // Temporary: cookie-only members before migration runs.
  const memberId = await getSessionMemberId();
  if (memberId == null) {
    return null;
  }

  const rows = await db
    .select({
      member: membersTable,
      team: teamsTable,
    })
    .from(membersTable)
    .innerJoin(teamsTable, eq(membersTable.teamId, teamsTable.id))
    .where(eq(membersTable.id, memberId))
    .limit(1);

  const session = rows[0] ?? null;
  if (session == null) {
    await clearSessionCookie();
    return null;
  }
  return { ...session, user: null };
}
