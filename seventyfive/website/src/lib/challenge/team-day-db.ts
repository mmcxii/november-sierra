import { type ChallengeMode, type MemberStatus } from "@/lib/challenge/tasks";
import { type TeamDayMember } from "@/lib/challenge/team-day";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { eq, inArray } from "drizzle-orm";

export async function loadTeamDayMembers(teamId: string, date: string): Promise<TeamDayMember[]> {
  const members = await db.select().from(membersTable).where(eq(membersTable.teamId, teamId));
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

  const dateDays = days.filter((day) => {
    return day.date === date;
  });
  const checks =
    dateDays.length === 0
      ? []
      : await db
          .select()
          .from(taskChecksTable)
          .where(
            inArray(
              taskChecksTable.dayCompletionId,
              dateDays.map((day) => day.id),
            ),
          );

  const checksByDay = new Map<string, string[]>();
  for (const check of checks) {
    const list = checksByDay.get(check.dayCompletionId) ?? [];
    list.push(check.taskId);
    checksByDay.set(check.dayCompletionId, list);
  }

  const dayByMember = new Map(dateDays.map((day) => [day.memberId, day]));

  return members.map((row) => {
    const day = dayByMember.get(row.id);
    return {
      checkedTaskIds: day != null ? (checksByDay.get(day.id) ?? []) : [],
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
