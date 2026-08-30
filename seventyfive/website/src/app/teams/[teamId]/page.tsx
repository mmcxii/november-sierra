import { AppChrome } from "@/components/app-chrome";
import { TeamBoard } from "@/components/team/board";
import { getMembershipContext } from "@/lib/auth/session";
import { elapsedProgressForMember } from "@/lib/challenge/progress";
import { quoteForTeamDay } from "@/lib/challenge/quotes";
import { refreshMemberStatus } from "@/lib/challenge/status";
import {
  currentStreak,
  firstIncompletePastDate,
  hasSoftStumble,
  listChallengeDates,
  localDateString,
  taskIdsForDay,
  type ChallengeMode,
  type MemberStatus,
} from "@/lib/challenge/tasks";
import { pendingTeamCelebrationDate } from "@/lib/challenge/team-day";
import { stampTeamCelebrationDate } from "@/lib/challenge/team-day-db";
import { db } from "@/lib/db/client";
import { betterAuthUserTable, dayCompletionsTable, membersTable, taskChecksTable } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { after } from "next/server";

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

  const todayLocal = localDateString(new Date(), session.user.timeZone);
  const memberMode = session.member.mode as ChallengeMode;
  const refreshed = await refreshMemberStatus({
    endDate: session.team.endDate,
    memberId: session.member.id,
    mode: memberMode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
    status: session.member.status as MemberStatus,
    timeZone: session.user.timeZone,
  });
  const memberStatus = refreshed.status;

  const searchParams = await props.searchParams;
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
    const streak = currentStreak({
      challengeDates,
      completions,
      mode,
      progressPhotoEndsOnly: row.member.progressPhotoEndsOnly,
      todayLocal,
    });

    return {
      checkedTaskIds: checkedTaskIds.filter((id) =>
        taskIdsForDay(mode, {
          date: selectedDate,
          endDate: session.team.endDate,
          progressPhotoEndsOnly: row.member.progressPhotoEndsOnly,
          startDate: session.team.startDate,
        }).includes(id),
      ),
      displayName: row.user?.name ?? row.member.displayName,
      hardCompletedDays: row.member.hardCompletedDays,
      id: row.member.id,
      mode,
      progressPhotoEndsOnly: row.member.progressPhotoEndsOnly,
      softStumble,
      status: (row.member.id === session.member.id ? memberStatus : row.member.status) as MemberStatus,
      streak,
    };
  });

  const selfDay = relevantDays.find((day) => day.memberId === session.member.id);
  const checkedTaskIds = selfDay != null ? (checksByDay.get(selfDay.id) ?? []) : [];
  const selfCompletions = (daysByMember.get(session.member.id) ?? []).map((day) => {
    return {
      checkedTaskIds: checksByDay.get(day.id) ?? [],
      date: day.date,
      mode: memberMode,
    };
  });
  const selfProgress = elapsedProgressForMember({
    completions: selfCompletions,
    endDate: session.team.endDate,
    mode: memberMode,
    progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
    startDate: session.team.startDate,
    todayLocal,
  });
  const incompletePastDate =
    refreshed.firstIncompletePastDate ??
    (memberMode === "hard" && memberStatus === "failed"
      ? firstIncompletePastDate({
          challengeDates,
          completions: selfCompletions,
          mode: memberMode,
          progressPhotoEndsOnly: session.member.progressPhotoEndsOnly,
          todayLocal,
        })
      : null);

  const teamMembers = members.map((row) => {
    return {
      id: row.member.id,
      mode: row.member.mode as ChallengeMode,
      progressPhotoEndsOnly: row.member.progressPhotoEndsOnly,
      reminderEnabled: row.member.reminderEnabled,
      status: (row.member.id === session.member.id ? memberStatus : row.member.status) as MemberStatus,
      userId: row.member.userId,
    };
  });
  const teamCompletions = allMemberDays.map((day) => {
    return {
      checkedTaskIds: checksByDay.get(day.id) ?? [],
      date: day.date,
      memberId: day.memberId,
    };
  });
  const pendingTeamDate = pendingTeamCelebrationDate({
    challengeDates,
    completions: teamCompletions,
    endDate: session.team.endDate,
    lastTeamCelebrationDate: session.member.lastTeamCelebrationDate,
    members: teamMembers,
    startDate: session.team.startDate,
    todayLocal,
  });
  if (pendingTeamDate != null) {
    after(() => {
      return stampTeamCelebrationDate(session.member.id, pendingTeamDate);
    });
  }

  return (
    <AppChrome
      reminderPushEnabled={session.member.reminderEnabled}
      vapidPublicKey={process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY}
    >
      <TeamBoard
        checkedTaskIds={checkedTaskIds}
        dayQuote={quoteForTeamDay({
          date: selectedDate,
          startDate: session.team.startDate,
          teamId: session.team.id,
        })}
        endDate={session.team.endDate}
        firstIncompletePastDate={incompletePastDate}
        inviteCode={session.team.inviteCode}
        isOwner={session.member.isOwner}
        memberId={session.member.id}
        memberMode={memberMode}
        memberStatus={memberStatus}
        pendingTeamCelebrationDate={pendingTeamDate}
        progressElapsedComplete={selfProgress.elapsedComplete}
        progressLastElapsedIsToday={selfProgress.lastElapsedIsToday}
        progressPhotoEndsOnly={session.member.progressPhotoEndsOnly}
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
