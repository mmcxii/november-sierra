"use server";

import { createAccountForDisplayName } from "@/lib/auth/account";
import { generateTeamPassword } from "@/lib/auth/password";
import {
  clearSessionCookie,
  getAuthUser,
  getMembershipContext,
  getPendingPasswordCookie,
  getSessionMemberId,
} from "@/lib/auth/session";
import {
  endDateFromStart,
  hasStartPassed,
  isJoinAllowed,
  isStartDateSelectable,
  localDateString,
  type ChallengeMode,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { membersTable, teamsTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { and, asc, eq, ne } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const modeSchema = z.enum(["hard", "soft"]);

const createSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  mode: modeSchema,
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  teamName: z.string().trim().min(1).max(60),
  timeZone: z.string().min(1).optional(),
});

const joinSchema = z.object({
  displayName: z.string().trim().min(1).max(40).optional(),
  mode: modeSchema,
  password: z.string().min(1),
  timeZone: z.string().min(1).optional(),
});

const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  teamId: z.string().min(1),
});

export type ActionResult =
  | {
      inviteCode?: string;
      ok: true;
      password?: string;
      teamId: string;
      username?: string;
    }
  | { error: string; password?: string; username?: string };

export async function createTeamAction(input: z.infer<typeof createSchema>): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  try {
    const existingUser = await getAuthUser();
    let userId: string;
    let displayName: string;
    let timeZone: string;
    let generatedPassword: undefined | string;
    let username: undefined | string;

    if (existingUser == null) {
      if (parsed.data.displayName == null || parsed.data.timeZone == null) {
        return { error: "somethingWentWrong" };
      }
      // Do not call getAuthUser() after signup — the new session cookie is on the
      // response and is not visible on this request's headers yet.
      const created = await createAccountForDisplayName({
        displayName: parsed.data.displayName,
        timeZone: parsed.data.timeZone,
      });
      userId = created.userId;
      displayName = created.displayName;
      timeZone = created.timeZone;
      generatedPassword = created.password;
      username = created.username;
    } else {
      userId = existingUser.id;
      displayName = existingUser.name;
      timeZone = existingUser.timeZone;
    }

    if (!isStartDateSelectable(parsed.data.startDate, new Date(), timeZone)) {
      return { error: "startDateCannotBeInThePast" };
    }

    const teamId = newId();
    const memberId = newId();
    const inviteCode = generateTeamPassword();
    const endDate = endDateFromStart(parsed.data.startDate);

    await db.insert(teamsTable).values({
      endDate,
      id: teamId,
      inviteCode,
      name: parsed.data.teamName,
      ownerMemberId: memberId,
      startDate: parsed.data.startDate,
    });

    await db.insert(membersTable).values({
      displayName,
      id: memberId,
      isOwner: true,
      mode: parsed.data.mode,
      teamId,
      timeZone,
      userId,
    });

    await clearSessionCookie();
    revalidatePath("/teams");

    const pending = await getPendingPasswordCookie();
    return {
      inviteCode,
      ok: true,
      password: generatedPassword ?? pending?.password,
      teamId,
      username: username ?? pending?.username,
    };
  } catch (error) {
    console.error("createTeamAction failed", error);
    const pending = await getPendingPasswordCookie();
    if (pending != null) {
      // Account may already exist; surface credentials so the user is not locked out.
      return {
        error: "somethingWentWrong",
        password: pending.password,
        username: pending.username,
      };
    }
    return { error: "somethingWentWrong" };
  }
}

export async function joinTeamAction(input: z.infer<typeof joinSchema>): Promise<ActionResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  try {
    const existingUser = await getAuthUser();
    let userId: string;
    let displayName: string;
    let timeZone: string;
    let generatedPassword: undefined | string;
    let username: undefined | string;

    if (existingUser == null) {
      if (parsed.data.displayName == null || parsed.data.timeZone == null) {
        return { error: "somethingWentWrong" };
      }
      const created = await createAccountForDisplayName({
        displayName: parsed.data.displayName,
        timeZone: parsed.data.timeZone,
      });
      userId = created.userId;
      displayName = created.displayName;
      timeZone = created.timeZone;
      generatedPassword = created.password;
      username = created.username;
    } else {
      userId = existingUser.id;
      displayName = existingUser.name;
      timeZone = existingUser.timeZone;
    }

    const [matched] = await db
      .select()
      .from(teamsTable)
      .where(eq(teamsTable.inviteCode, parsed.data.password))
      .limit(1);

    if (matched == null) {
      return { error: "invalidTeamPassword" };
    }

    const todayLocal = localDateString(new Date(), timeZone);
    if (!isJoinAllowed(matched.startDate, todayLocal)) {
      return { error: "challengeAlreadyStarted" };
    }

    const [existingMembership] = await db
      .select()
      .from(membersTable)
      .where(and(eq(membersTable.userId, userId), eq(membersTable.teamId, matched.id)))
      .limit(1);

    if (existingMembership != null) {
      return {
        ok: true,
        password: generatedPassword,
        teamId: matched.id,
        username,
      };
    }

    const memberId = newId();
    await db.insert(membersTable).values({
      displayName,
      id: memberId,
      isOwner: false,
      mode: parsed.data.mode as ChallengeMode,
      teamId: matched.id,
      timeZone,
      userId,
    });

    await clearSessionCookie();
    revalidatePath("/teams");

    const pending = await getPendingPasswordCookie();
    return {
      ok: true,
      password: generatedPassword ?? pending?.password,
      teamId: matched.id,
      username: username ?? pending?.username,
    };
  } catch (error) {
    console.error("joinTeamAction failed", error);
    const pending = await getPendingPasswordCookie();
    if (pending != null) {
      return {
        error: "somethingWentWrong",
        password: pending.password,
        username: pending.username,
      };
    }
    return { error: "somethingWentWrong" };
  }
}

export async function updateTeamAction(input: z.infer<typeof updateTeamSchema>): Promise<ActionResult> {
  const parsed = updateTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const session = await getMembershipContext(parsed.data.teamId);
  if (session?.member.isOwner != true) {
    return { error: "somethingWentWrong" };
  }

  const todayLocal = localDateString(new Date(), session.user.timeZone);
  if (hasStartPassed(session.team.startDate, todayLocal)) {
    return { error: "startDateCanNoLongerBeChanged" };
  }
  if (!isStartDateSelectable(parsed.data.startDate, new Date(), session.user.timeZone)) {
    return { error: "startDateCannotBeInThePast" };
  }

  await db
    .update(teamsTable)
    .set({
      endDate: endDateFromStart(parsed.data.startDate),
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      updatedAt: new Date(),
    })
    .where(eq(teamsTable.id, session.team.id));

  revalidatePath(`/teams/${session.team.id}`);
  return { ok: true, teamId: session.team.id };
}

export async function leaveTeamAction(teamId: string): Promise<void> {
  const session = await getMembershipContext(teamId);
  if (session == null) {
    redirect("/teams");
  }

  if (session.member.isOwner) {
    redirect(`/teams/${teamId}/settings`);
  }

  await db.delete(membersTable).where(eq(membersTable.id, session.member.id));
  redirect("/teams");
}

const deleteTeamSchema = z.object({
  confirm: z.literal(true),
  teamId: z.string().min(1),
});

export async function deleteTeamAction(input: z.infer<typeof deleteTeamSchema>): Promise<ActionResult> {
  const parsed = deleteTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "confirmDeleteTeam" };
  }

  const session = await getMembershipContext(parsed.data.teamId);
  if (session?.member.isOwner != true) {
    return { error: "somethingWentWrong" };
  }

  await db.delete(teamsTable).where(eq(teamsTable.id, session.team.id));
  redirect("/teams");
}

/** Transfer ownership to oldest other member, or delete team if alone. */
export async function transferOrDeleteOwnedTeam(teamId: string, ownerMemberId: string): Promise<void> {
  const [next] = await db
    .select()
    .from(membersTable)
    .where(and(eq(membersTable.teamId, teamId), ne(membersTable.id, ownerMemberId)))
    .orderBy(asc(membersTable.joinedAt))
    .limit(1);

  if (next == null) {
    await db.delete(teamsTable).where(eq(teamsTable.id, teamId));
    return;
  }

  await db.update(membersTable).set({ isOwner: true, updatedAt: new Date() }).where(eq(membersTable.id, next.id));
  await db
    .update(membersTable)
    .set({ isOwner: false, updatedAt: new Date() })
    .where(eq(membersTable.id, ownerMemberId));
  await db.update(teamsTable).set({ ownerMemberId: next.id, updatedAt: new Date() }).where(eq(teamsTable.id, teamId));
}

/** @deprecated — use getSessionMemberId only for migration shim */
export { getSessionMemberId };
