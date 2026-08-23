import {
  countCompletedHardDays,
  firstIncompletePastDate,
  hasSoftStumble,
  listChallengeDates,
  localDateString,
  recomputeMemberStatus,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { newId } from "@/lib/utils";
import { and, eq, inArray } from "drizzle-orm";

export type MemberDayCompletion = {
  checkedTaskIds: string[];
  date: string;
  dayCompletionId: string;
};

export async function loadMemberCompletions(memberId: string): Promise<MemberDayCompletion[]> {
  const days = await db.select().from(dayCompletionsTable).where(eq(dayCompletionsTable.memberId, memberId));

  if (days.length === 0) {
    return [];
  }

  const checks = await db
    .select()
    .from(taskChecksTable)
    .where(
      inArray(
        taskChecksTable.dayCompletionId,
        days.map((day) => day.id),
      ),
    );

  const checksByDay = new Map<string, string[]>();
  for (const check of checks) {
    const list = checksByDay.get(check.dayCompletionId) ?? [];
    list.push(check.taskId);
    checksByDay.set(check.dayCompletionId, list);
  }

  return days.map((day) => ({
    checkedTaskIds: checksByDay.get(day.id) ?? [],
    date: day.date,
    dayCompletionId: day.id,
  }));
}

export async function refreshMemberStatus(args: {
  endDate: string;
  memberId: string;
  mode: ChallengeMode;
  progressPhotoEndsOnly?: boolean;
  startDate: string;
  status?: MemberStatus;
  timeZone: string;
}): Promise<{ firstIncompletePastDate: null | string; softStumble: boolean; status: MemberStatus }> {
  const todayLocal = localDateString(new Date(), args.timeZone);
  const challengeDates = listChallengeDates(args.startDate, args.endDate);
  const completions = await loadMemberCompletions(args.memberId);
  const completionInputs = completions.map((completion) => ({
    checkedTaskIds: completion.checkedTaskIds,
    date: completion.date,
    mode: args.mode,
  }));

  if (args.status === "exited") {
    return { firstIncompletePastDate: null, softStumble: false, status: "exited" };
  }

  const status = recomputeMemberStatus({
    challengeDates,
    completions: completionInputs,
    mode: args.mode,
    progressPhotoEndsOnly: args.progressPhotoEndsOnly,
    todayLocal,
  });

  const softStumble =
    args.mode === "soft" &&
    hasSoftStumble({
      challengeDates,
      completions: completionInputs,
      todayLocal,
    });

  const incompletePastDate =
    args.mode === "hard" && status === "failed"
      ? firstIncompletePastDate({
          challengeDates,
          completions: completionInputs,
          mode: "hard",
          progressPhotoEndsOnly: args.progressPhotoEndsOnly,
          todayLocal,
        })
      : null;

  await db
    .update(membersTable)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(membersTable.id, args.memberId)));

  return { firstIncompletePastDate: incompletePastDate, softStumble, status };
}

export async function convertHardMemberToSoft(args: {
  endDate: string;
  memberId: string;
  progressPhotoEndsOnly?: boolean;
  startDate: string;
  timeZone: string;
}): Promise<{ hardCompletedDays: number; status: MemberStatus }> {
  const todayLocal = localDateString(new Date(), args.timeZone);
  const challengeDates = listChallengeDates(args.startDate, args.endDate);
  const completions = await loadMemberCompletions(args.memberId);
  const completionInputs = completions.map((completion) => ({
    checkedTaskIds: completion.checkedTaskIds,
    date: completion.date,
    mode: "hard" as const,
  }));

  const hardCompletedDays = countCompletedHardDays({
    challengeDates,
    completions: completionInputs,
    progressPhotoEndsOnly: args.progressPhotoEndsOnly,
    todayLocal,
  });

  for (const completion of completions) {
    if (!completion.checkedTaskIds.includes("diet") || completion.checkedTaskIds.includes("alcohol")) {
      continue;
    }
    await db.insert(taskChecksTable).values({
      dayCompletionId: completion.dayCompletionId,
      id: newId(),
      taskId: "alcohol",
    });
  }

  await db
    .update(membersTable)
    .set({
      hardCompletedDays,
      mode: "soft",
      status: "active",
      updatedAt: new Date(),
    })
    .where(eq(membersTable.id, args.memberId));

  return { hardCompletedDays, status: "active" };
}

export async function exitHardChallenge(memberId: string): Promise<void> {
  await db
    .update(membersTable)
    .set({ reminderEnabled: false, status: "exited", updatedAt: new Date() })
    .where(eq(membersTable.id, memberId));
}
