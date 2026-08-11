import { AppChrome } from "@/components/app-chrome";
import { TeamListRow } from "@/components/team/team-list-row";
import { Container } from "@/components/ui/container";
import { getAuthUser, listMembershipsForUser } from "@/lib/auth/session";
import { challengeDayNumber } from "@/lib/challenge/celebrations";
import { daysUntilStart, localDateString, type ChallengeMode } from "@/lib/challenge/tasks";
import { db } from "@/lib/db/client";
import { dayCompletionsTable, taskChecksTable } from "@/lib/db/schema";
import { initTranslations } from "@/lib/i18n/server";
import { and, eq, inArray } from "drizzle-orm";
import Link from "next/link";
import { redirect } from "next/navigation";

const TeamsPage = async () => {
  const user = await getAuthUser();
  if (user == null) {
    redirect("/sign-in");
  }

  const memberships = await listMembershipsForUser(user.id);
  const { t } = await initTranslations();
  const todayLocal = localDateString(new Date(), user.timeZone);

  const memberIds = memberships.map((row) => row.member.id);
  const todayDays =
    memberIds.length === 0
      ? []
      : await db
          .select()
          .from(dayCompletionsTable)
          .where(and(inArray(dayCompletionsTable.memberId, memberIds), eq(dayCompletionsTable.date, todayLocal)));

  const dayIds = todayDays.map((day) => day.id);
  const checks =
    dayIds.length === 0
      ? []
      : await db.select().from(taskChecksTable).where(inArray(taskChecksTable.dayCompletionId, dayIds));

  const checksByDay = new Map<string, string[]>();
  for (const check of checks) {
    const list = checksByDay.get(check.dayCompletionId) ?? [];
    list.push(check.taskId);
    checksByDay.set(check.dayCompletionId, list);
  }

  const checkedByMember = new Map<string, string[]>();
  for (const day of todayDays) {
    checkedByMember.set(day.memberId, checksByDay.get(day.id) ?? []);
  }

  return (
    <AppChrome>
      <Container as="main" className="flex-1 py-8">
        <h1 className="font-sf-display text-3xl">{t("yourTeams")}</h1>
        {memberships.length === 0 ? (
          <p className="text-sf-muted mt-8 text-sm">{t("youAreNotOnATeamYet")}</p>
        ) : (
          <ul className="divide-sf-border mt-8 divide-y">
            {memberships.map((row) => {
              const daysUntil = daysUntilStart(row.team.startDate, todayLocal);
              let progressLabel = t("challengeStartsIn{{count}}Days", { count: daysUntil });
              if (daysUntil === 0) {
                const dayNumber = challengeDayNumber(row.team.startDate, todayLocal) ?? 75;
                progressLabel = t("day{{day}}Of75", { day: dayNumber });
              } else if (daysUntil === 1) {
                progressLabel = t("challengeStartsTomorrow");
              }

              return (
                <TeamListRow
                  checkedTaskIds={checkedByMember.get(row.member.id) ?? []}
                  key={row.team.id}
                  mode={row.member.mode as ChallengeMode}
                  progressLabel={progressLabel}
                  teamId={row.team.id}
                  teamName={row.team.name}
                />
              );
            })}
          </ul>
        )}
        <div className="mt-8 flex flex-col gap-3">
          <Link
            className="bg-sf-accent text-sf-accent-text block rounded-[var(--sf-radius)] px-4 py-3 text-center text-sm"
            href="/create"
          >
            {t("createTeam")}
          </Link>
          <Link
            className="border-sf-border block rounded-[var(--sf-radius)] border px-4 py-3 text-center text-sm"
            href="/join"
          >
            {t("joinTeam")}
          </Link>
        </div>
        <div className="mt-10 flex gap-4 text-sm">
          <Link className="text-sf-muted underline" href="/settings">
            {t("settings")}
          </Link>
        </div>
      </Container>
    </AppChrome>
  );
};

export default TeamsPage;
