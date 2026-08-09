"use server";

import { generateGroupPassword } from "@/lib/auth/password";
import { clearSessionCookie, getSessionContext, getSessionMemberId, setSessionCookie } from "@/lib/auth/session";
import {
  endDateFromStart,
  formatDateOnly,
  hasStartPassed,
  isJoinAllowed,
  type ChallengeMode,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { groupsTable, membersTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

const modeSchema = z.enum(["hard", "soft"]);

const createSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  groupName: z.string().trim().min(1).max(60),
  mode: modeSchema,
  replaceSession: z.boolean().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  timeZone: z.string().min(1),
});

const joinSchema = z.object({
  displayName: z.string().trim().min(1).max(40),
  mode: modeSchema,
  password: z.string().min(1),
  replaceSession: z.boolean().optional(),
  timeZone: z.string().min(1),
});

const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

export type ActionResult = { error: string } | { ok: true; password?: string };

async function ensureCanReplaceSession(replaceSession?: boolean): Promise<null | ActionResult> {
  const existing = await getSessionMemberId();
  if (existing != null && !replaceSession) {
    return { error: "alreadyInAGroupConfirmToSwitch" };
  }
  return null;
}

export async function createGroupAction(input: z.infer<typeof createSchema>): Promise<ActionResult> {
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

  const groupId = newId();
  const memberId = newId();
  const inviteCode = generateGroupPassword();
  const endDate = endDateFromStart(parsed.data.startDate);

  await db.insert(groupsTable).values({
    endDate,
    id: groupId,
    inviteCode,
    name: parsed.data.groupName,
    ownerMemberId: memberId,
    startDate: parsed.data.startDate,
  });

  await db.insert(membersTable).values({
    displayName: parsed.data.displayName,
    groupId,
    id: memberId,
    isOwner: true,
    mode: parsed.data.mode,
    timeZone: parsed.data.timeZone,
  });

  if (await getSessionMemberId()) {
    await clearSessionCookie();
  }
  await setSessionCookie(memberId);

  return { ok: true, password: inviteCode };
}

export async function joinGroupAction(input: z.infer<typeof joinSchema>): Promise<ActionResult> {
  const parsed = joinSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const blocked = await ensureCanReplaceSession(parsed.data.replaceSession);
  if (blocked != null) {
    return blocked;
  }

  const [matched] = await db
    .select()
    .from(groupsTable)
    .where(eq(groupsTable.inviteCode, parsed.data.password))
    .limit(1);

  if (!matched) {
    return { error: "invalidGroupPassword" };
  }

  const utcToday = formatDateOnly(new Date());
  if (!isJoinAllowed(matched.startDate, utcToday)) {
    return { error: "challengeAlreadyStarted" };
  }

  const memberId = newId();
  await db.insert(membersTable).values({
    displayName: parsed.data.displayName,
    groupId: matched.id,
    id: memberId,
    isOwner: false,
    mode: parsed.data.mode as ChallengeMode,
    timeZone: parsed.data.timeZone,
  });

  if (await getSessionMemberId()) {
    await clearSessionCookie();
  }
  await setSessionCookie(memberId);
  revalidatePath("/group");
  return { ok: true };
}

export async function updateGroupAction(input: z.infer<typeof updateGroupSchema>): Promise<ActionResult> {
  const parsed = updateGroupSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" };
  }

  const session = await getSessionContext();
  if (!session?.member.isOwner) {
    return { error: "somethingWentWrong" };
  }

  const utcToday = formatDateOnly(new Date());
  if (hasStartPassed(session.group.startDate, utcToday)) {
    return { error: "startDateCanNoLongerBeChanged" };
  }
  if (hasStartPassed(parsed.data.startDate, utcToday)) {
    return { error: "startDateMustBeInTheFuture" };
  }

  await db
    .update(groupsTable)
    .set({
      endDate: endDateFromStart(parsed.data.startDate),
      name: parsed.data.name,
      startDate: parsed.data.startDate,
      updatedAt: new Date(),
    })
    .where(eq(groupsTable.id, session.group.id));

  revalidatePath("/group");
  return { ok: true };
}

export async function leaveGroupAction(): Promise<void> {
  await clearSessionCookie();
  redirect("/");
}
