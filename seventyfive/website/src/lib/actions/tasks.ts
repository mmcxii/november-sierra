"use server";

import { getMembershipContext } from "@/lib/auth/session";
import { refreshMemberStatus } from "@/lib/challenge/status";
import {
  canEditDay,
  localDateString,
  taskIdsForMode,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, taskChecksTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const setTaskSchema = z.object({
  checked: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  taskId: z.string().min(1),
  teamId: z.string().min(1),
});

export async function setTaskCheckedAction(input: z.infer<typeof setTaskSchema>) {
  const parsed = setTaskSchema.safeParse(input);
  if (!parsed.success) {
    return { error: "somethingWentWrong" as const };
  }

  const session = await getMembershipContext(parsed.data.teamId);
  if (session == null) {
    return { error: "somethingWentWrong" as const };
  }

  const mode = session.member.mode as ChallengeMode;
  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const allowed = canEditDay({
    mode,
    selectedDate: parsed.data.date,
    startDate: session.team.startDate,
    status: session.member.status as MemberStatus,
    todayLocal,
  });

  if (!allowed) {
    return { error: "thisDayIsReadOnly" as const };
  }

  if (!taskIdsForMode(mode).includes(parsed.data.taskId)) {
    return { error: "somethingWentWrong" as const };
  }

  let [day] = await db
    .select()
    .from(dayCompletionsTable)
    .where(and(eq(dayCompletionsTable.memberId, session.member.id), eq(dayCompletionsTable.date, parsed.data.date)))
    .limit(1);

  if (!day) {
    day = {
      createdAt: new Date(),
      date: parsed.data.date,
      id: newId(),
      memberId: session.member.id,
    };
    await db.insert(dayCompletionsTable).values(day);
  }

  const [existing] = await db
    .select()
    .from(taskChecksTable)
    .where(and(eq(taskChecksTable.dayCompletionId, day.id), eq(taskChecksTable.taskId, parsed.data.taskId)))
    .limit(1);

  if (parsed.data.checked && !existing) {
    await db.insert(taskChecksTable).values({
      dayCompletionId: day.id,
      id: newId(),
      taskId: parsed.data.taskId,
    });
  }

  if (!parsed.data.checked && existing) {
    await db.delete(taskChecksTable).where(eq(taskChecksTable.id, existing.id));
  }

  await refreshMemberStatus({
    endDate: session.team.endDate,
    memberId: session.member.id,
    mode,
    startDate: session.team.startDate,
    status: session.member.status as MemberStatus,
    timeZone: session.user.timeZone,
  });

  revalidatePath(`/teams/${parsed.data.teamId}`);
  return { ok: true as const };
}
