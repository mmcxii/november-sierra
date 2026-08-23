import { challengeDayNumber } from "@/lib/challenge/celebrations";
import { teamCelebrationIsFinale, type TeamDayEvent } from "@/lib/challenge/team-day";
import type { TFunction } from "i18next";

export function teamDayPushCopy(args: {
  actorName: string;
  date: string;
  endDate: string;
  event: Exclude<TeamDayEvent, "none">;
  startDate: string;
  t: TFunction;
}): { body: string; title: string } {
  const { actorName, date, endDate, event, startDate, t } = args;
  if (event === "memberFinished") {
    return {
      body: t("{{name}}FinishedToday", { name: actorName }),
      title: t("teamUpdate"),
    };
  }

  const day = challengeDayNumber(startDate, date);
  if (teamCelebrationIsFinale(startDate, endDate, date)) {
    return {
      body: t("theTeamFinishedTheChallenge"),
      title: t("teamUpdate"),
    };
  }

  return {
    body: t("theTeamFinishedDay{{day}}", { day: day ?? 1 }),
    title: t("teamUpdate"),
  };
}
