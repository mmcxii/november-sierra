import { AppChrome } from "@/components/app-chrome";
import { TeamBoard } from "@/components/team/board";
import { getSessionContext } from "@/lib/auth/session";
import {
  hasSoftStumble,
  listChallengeDates,
  localDateString,
  taskIdsForMode,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type TeamPageProps = {
  searchParams: Promise<{ date?: string }>;
};

const TeamPage = async (props: TeamPageProps) => {
  const session = await getSessionContext();
  if (session == null) {
    redirect("/");
  }

  const searchParams = await props.searchParams;
  const todayLocal = localDateString(new Date(), session.member.timeZone);
  const selectedDate = searchParams.date ?? todayLocal;
  const challengeDates = listChallengeDates(session.team.startDate, session.team.endDate);

  const members = await db.select().from(membersTable).where(eq(membersTable.teamId, session.team.id));

  const dayRows = await db.select().from(dayCompletionsTable);
  const memberIds = new Set(members.map((member) => member.id));
  const relevantDays = dayRows.filter((day) => memberIds.has(day.memberId) && day.date === selectedDate);

  const allMemberDays = dayRows.filter((day) => memberIds.has(day.memberId));
  const checks = allMemberDays.length === 0 ? [] : await db.select().from(taskChecksTable);

  const checksByDay = new Map<string, string[]>();
  for (const check of checks) {
    const list = checksByDay.get(check.dayCompletionId) ?? [];
    list.push(check.taskId);
    checksByDay.set(check.dayCompletionId, list);
  }

  const daysByMember = new Map<string, typeof allMemberDays>();
  for (const day of allMemberDays) {
    const list = daysByMember.get(day.memberId) ?? [];
    list.push(day);
    daysByMember.set(day.memberId, list);
  }

  const roster = members.map((member) => {
    const mode = member.mode as ChallengeMode;
    const selectedDay = relevantDays.find((day) => day.memberId === member.id);
    const checkedTaskIds = selectedDay != null ? (checksByDay.get(selectedDay.id) ?? []) : [];

    const completions = (daysByMember.get(member.id) ?? []).map((day) => ({
      checkedTaskIds: checksByDay.get(day.id) ?? [],
      date: day.date,
      mode,
    }));

    const softStumble =
      mode === "soft" &&
      hasSoftStumble({
        challengeDates,
        completions,
        todayLocal,
      });

    return {
      checkedTaskIds: checkedTaskIds.filter((id) => taskIdsForMode(mode).includes(id)),
      displayName: member.displayName,
      id: member.id,
      mode,
      softStumble,
      status: member.status as MemberStatus,
    };
  });

  const selfDay = relevantDays.find((day) => day.memberId === session.member.id);
  const checkedTaskIds = selfDay != null ? (checksByDay.get(selfDay.id) ?? []) : [];

  return (
    <AppChrome>
      <TeamBoard
        checkedTaskIds={checkedTaskIds}
        endDate={session.team.endDate}
        inviteCode={session.team.inviteCode}
        isOwner={session.member.isOwner}
        memberId={session.member.id}
        memberMode={session.member.mode as ChallengeMode}
        memberStatus={session.member.status as MemberStatus}
        roster={roster}
        selectedDate={selectedDate}
        startDate={session.team.startDate}
        teamName={session.team.name}
        todayLocal={todayLocal}
      />
    </AppChrome>
  );
};

export default TeamPage;
