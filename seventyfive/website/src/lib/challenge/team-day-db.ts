import { listChallengeDates, type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import { isDormant, type TeamDayMember } from "@/lib/challenge/team-day";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function loadTeamDayMembers(args: {
  date: string;
  endDate: string;
  startDate: string;
  teamId: string;
}): Promise<TeamDayMember[]> {
  const members = await db.select().from(membersTable).where(eq(membersTable.teamId, args.teamId));
  if (members.length === 0) {
    return [];
  }

  const days = await db
    .select()
    .from(dayCompletionsTable)
    .where(
      inArray(
        dayCompletionsTable.memberId,
        members.map((member) => member.id),
      ),
    );

  const checks =
    days.length === 0
      ? []
      : await db
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

  const daysByMember = new Map<string, typeof days>();
  for (const day of days) {
    const list = daysByMember.get(day.memberId) ?? [];
    list.push(day);
    daysByMember.set(day.memberId, list);
  }

  const challengeDates = listChallengeDates(args.startDate, args.endDate);

  return members.map((row) => {
    const memberDays = daysByMember.get(row.id) ?? [];
    const completions = memberDays.map((day) => {
      return {
        checkedTaskIds: checksByDay.get(day.id) ?? [],
        date: day.date,
      };
    });
    const dateDay = memberDays.find((day) => {
      return day.date === args.date;
    });

    return {
      checkedTaskIds: dateDay != null ? (checksByDay.get(dateDay.id) ?? []) : [],
      dormant: isDormant({
        challengeDates,
        completions,
        mode: row.mode as ChallengeMode,
        progressPhotoEndsOnly: row.progressPhotoEndsOnly,
        todayLocal: args.date,
      }),
      id: row.id,
      mode: row.mode as ChallengeMode,
      progressPhotoEndsOnly: row.progressPhotoEndsOnly,
      reminderEnabled: row.reminderEnabled,
      status: row.status as MemberStatus,
      userId: row.userId,
    };
  });
}

export async function stampTeamCelebrationDate(memberId: string, date: string): Promise<void> {
  await db
    .update(membersTable)
    .set({ lastTeamCelebrationDate: date, updatedAt: new Date() })
    .where(eq(membersTable.id, memberId));
}
