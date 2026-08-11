import { AppChrome } from "@/components/app-chrome";
import { TeamBoard } from "@/components/team/board";
import { getMembershipContext } from "@/lib/auth/session";
import { elapsedProgressForMember } from "@/lib/challenge/progress";
import {
  hasSoftStumble,
  listChallengeDates,
  localDateString,
  taskIdsForMode,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { betterAuthUserTable, dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

type TeamPageProps = {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ date?: string }>;
};

const TeamPage = async (props: TeamPageProps) => {
  const { teamId } = await props.params;
  const session = await getMembershipContext(teamId);
  if (session == null) {
    redirect("/teams");
  }

  const searchParams = await props.searchParams;
  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const selectedDate = searchParams.date ?? todayLocal;
  const challengeDates = listChallengeDates(session.team.startDate, session.team.endDate);

  const members = await db
    .select({
      member: membersTable,
      user: betterAuthUserTable,
    })
    .from(membersTable)
    .leftJoin(betterAuthUserTable, eq(membersTable.userId, betterAuthUserTable.id))
    .where(eq(membersTable.teamId, session.team.id));

  const dayRows = await db.select().from(dayCompletionsTable);
  const memberIds = new Set(members.map((row) => row.member.id));
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

  const roster = members.map((row) => {
    const mode = row.member.mode as ChallengeMode;
    const selectedDay = relevantDays.find((day) => day.memberId === row.member.id);
    const checkedTaskIds = selectedDay != null ? (checksByDay.get(selectedDay.id) ?? []) : [];

    const completions = (daysByMember.get(row.member.id) ?? []).map((day) => ({
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
      displayName: row.user?.name ?? row.member.displayName,
      id: row.member.id,
      mode,
      softStumble,
      status: row.member.status as MemberStatus,
    };
  });

  const selfDay = relevantDays.find((day) => day.memberId === session.member.id);
  const checkedTaskIds = selfDay != null ? (checksByDay.get(selfDay.id) ?? []) : [];
  const memberMode = session.member.mode as ChallengeMode;
  const selfProgress = elapsedProgressForMember({
    completions: (daysByMember.get(session.member.id) ?? []).map((day) => {
      return {
        checkedTaskIds: checksByDay.get(day.id) ?? [],
        date: day.date,
      };
    }),
    endDate: session.team.endDate,
    mode: memberMode,
    startDate: session.team.startDate,
    todayLocal,
  });

  return (
    <AppChrome
      reminderPushEnabled={session.member.reminderEnabled}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
    >
      <TeamBoard
        checkedTaskIds={checkedTaskIds}
        endDate={session.team.endDate}
        inviteCode={session.team.inviteCode}
        isOwner={session.member.isOwner}
        memberId={session.member.id}
        memberMode={memberMode}
        memberStatus={session.member.status as MemberStatus}
        progressElapsedComplete={selfProgress.elapsedComplete}
        progressLastElapsedIsToday={selfProgress.lastElapsedIsToday}
        roster={roster}
        selectedDate={selectedDate}
        startDate={session.team.startDate}
        teamId={session.team.id}
        teamName={session.team.name}
        todayLocal={todayLocal}
      />
    </AppChrome>
  );
};

export default TeamPage;
