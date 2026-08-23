import type { TFunction } from "i18next";
import { describe, expect, it } from "vitest";
import { teamDayPushCopy } from "./team-day-copy";

const t = (key: string, opts?: Record<string, unknown>) => {
  if (key === "{{name}}FinishedToday") {
    return `${String(opts?.name)} finished today.`;
  }
  if (key === "theTeamFinishedDay{{day}}") {
    return `The team finished day ${String(opts?.day)}.`;
  }
  if (key === "theTeamFinishedTheChallenge") {
    return "The team finished the challenge.";
  }
  if (key === "teamUpdate") {
    return "Team update";
  }
  return key;
};

describe("teamDayPushCopy", () => {
  it("names the teammate who just finished", () => {
    //* Act
    const copy = teamDayPushCopy({
      actorName: "Nich",
      date: "2026-09-10",
      endDate: "2026-11-14",
      event: "memberFinished",
      startDate: "2026-09-01",
      t: t as TFunction,
    });

    //* Assert
    expect(copy).toEqual({
      body: "Nich finished today.",
      title: "Team update",
    });
  });

  it("uses the team-done day copy until the finale", () => {
    //* Act
    const mid = teamDayPushCopy({
      actorName: "Nich",
      date: "2026-09-10",
      endDate: "2026-11-14",
      event: "teamComplete",
      startDate: "2026-09-01",
      t: t as TFunction,
    });
    const finale = teamDayPushCopy({
      actorName: "Nich",
      date: "2026-11-14",
      endDate: "2026-11-14",
      event: "teamComplete",
      startDate: "2026-09-01",
      t: t as TFunction,
    });

    //* Assert
    expect(mid).toEqual({
      body: "The team finished day 10.",
      title: "Team update",
    });
    expect(finale).toEqual({
      body: "The team finished the challenge.",
      title: "Team update",
    });
  });
});
