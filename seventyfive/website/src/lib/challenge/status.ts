import {
  hasSoftStumble,
  listChallengeDates,
  localDateString,
  recomputeMemberStatus,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

export async function loadMemberCompletions(memberId: string) {
  const days = await db.select().from(dayCompletionsTable).where(eq(dayCompletionsTable.memberId, memberId));

  if (days.length === 0) {
    return [] as { checkedTaskIds: string[]; date: string; mode: ChallengeMode }[];
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
    mode: "hard" as ChallengeMode,
  }));
}

export async function refreshMemberStatus(args: {
  endDate: string;
  memberId: string;
  mode: ChallengeMode;
  startDate: string;
  timeZone: string;
}): Promise<{ softStumble: boolean; status: MemberStatus }> {
  const todayLocal = localDateString(new Date(), args.timeZone);
  const challengeDates = listChallengeDates(args.startDate, args.endDate);
  const completions = await loadMemberCompletions(args.memberId);

  const status = recomputeMemberStatus({
    challengeDates,
    completions: completions.map((c) => ({ ...c, mode: args.mode })),
    mode: args.mode,
    todayLocal,
  });

  const softStumble =
    args.mode === "soft" &&
    hasSoftStumble({
      challengeDates,
      completions: completions.map((c) => ({ ...c, mode: "soft" })),
      todayLocal,
    });

  await db
    .update(membersTable)
    .set({ status, updatedAt: new Date() })
    .where(and(eq(membersTable.id, args.memberId)));

  return { softStumble, status };
}
