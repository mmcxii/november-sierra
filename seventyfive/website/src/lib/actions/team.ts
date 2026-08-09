"use server";

import { generateTeamPassword } from "@/lib/auth/password";
import { clearSessionCookie, getSessionContext, getSessionMemberId, setSessionCookie } from "@/lib/auth/session";
import {
  endDateFromStart,
  formatDateOnly,
  hasStartPassed,
  isJoinAllowed,
  type ChallengeMode,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { membersTable, teamsTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const modeSchema = z.enum(["hard", "soft"]);

const createSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  mode: modeSchema,
  replaceSession: z.boolean().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  teamName: z.string().trim().min(1).max(60),
  timeZone: z.string().min(1),
});

const joinSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  mode: modeSchema,
  password: z.string().min(1),
  replaceSession: z.boolean().optional(),
  timeZone: z.string().min(1),
});

const updateTeamSchema = z.object({
  name: z.string().trim().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ActionResult = { error: string } | { ok: true; password?: string };

async function ensureCanReplaceSession(replaceSession?: boolean): Promise<null | ActionResult> {
  const existing = await getSessionMemberId();
  if (existing != null) {
    if (!replaceSession) {
      return { error: "alreadyInATeamConfirmToSwitch" };
    }
  }
  return null;
}

export async function createTeamAction(input: z.infer<typeof createSchema>): Promise<ActionResult> {
  const parsed = createSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const blocked = await ensureCanReplaceSession(parsed.data.replaceSession);
  if (blocked != null) {
    return blocked;
  }

  const utcToday = formatDateOnly(new Date());
  if (hasStartPassed(parsed.data.startDate, utcToday)) {
    return { error: "startDateMustBeInTheFuture" };
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
    displayName: parsed.data.displayName,
    id: memberId,
    isOwner: true,
    mode: parsed.data.mode,
    teamId,
    timeZone: parsed.data.timeZone,
  });

  if ((await getSessionMemberId()) != null) {
    await clearSessionCookie();
  }
  await setSessionCookie(memberId);

  return { ok: true, password: inviteCode };
}

export async function joinTeamAction(input: z.infer<typeof joinSchema>): Promise<ActionResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const blocked = await ensureCanReplaceSession(parsed.data.replaceSession);
  if (blocked != null) {
    return blocked;
  }

  const [matched] = await db.select().from(teamsTable).where(eq(teamsTable.inviteCode, parsed.data.password)).limit(1);

  if (matched == null) {
    return { error: "invalidTeamPassword" };
  }

  const utcToday = formatDateOnly(new Date());
  if (!isJoinAllowed(matched.startDate, utcToday)) {
    return { error: "challengeAlreadyStarted" };
  }

  const memberId = newId();
  await db.insert(membersTable).values({
    displayName: parsed.data.displayName,
    id: memberId,
    isOwner: false,
    mode: parsed.data.mode as ChallengeMode,
    teamId: matched.id,
    timeZone: parsed.data.timeZone,
  });

  if ((await getSessionMemberId()) != null) {
    await clearSessionCookie();
  }
  await setSessionCookie(memberId);
  revalidatePath("/team");
  return { ok: true };
}

export async function updateTeamAction(input: z.infer<typeof updateTeamSchema>): Promise<ActionResult> {
  const parsed = updateTeamSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const session = await getSessionContext();
  if (session?.member.isOwner != true) {
    return { error: "somethingWentWrong" };
  }

  const utcToday = formatDateOnly(new Date());
  if (hasStartPassed(session.team.startDate, utcToday)) {
    return { error: "startDateCanNoLongerBeChanged" };
  }
  if (hasStartPassed(parsed.data.startDate, utcToday)) {
    return { error: "startDateMustBeInTheFuture" };
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

  revalidatePath("/team");
  return { ok: true };
}

export async function leaveTeamAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
