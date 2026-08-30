import { describe, expect, it } from "vitest";
import {
  isDormant,
  pendingTeamCelebrationDate,
  resolveTeamDayEvent,
  teamDayPushRecipients,
  type TeamDayMember,
} from "./team-day";

const startDate = "2026-09-01";
const endDate = "2026-11-14";
const date = "2026-09-10";
const softComplete = ["workout", "diet", "alcohol", "water", "reading"] as const;

function member(overrides: Partial<TeamDayMember> & Pick<TeamDayMember, "id">): TeamDayMember {
  return {
    checkedTaskIds: [],
    dormant: false,
    mode: "soft",
    reminderEnabled: true,
    status: "active",
    userId: `user-${overrides.id}`,
    ...overrides,
  };
}

describe("resolveTeamDayEvent", () => {
  it("returns none when the actor did not just flip complete", () => {
    //* Arrange
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: softComplete.slice(0, 2), id: "b" }),
    ];

    //* Act
    const already = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: true,
      date,
      endDate,
      members,
      startDate,
    });
    const incomplete = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: false,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(already).toBe("none");
    expect(incomplete).toBe("none");
  });

  it("returns none for a solo counted member", () => {
    //* Arrange
    const members = [member({ checkedTaskIds: softComplete, id: "a" })];

    //* Act
    const event = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(event).toBe("none");
  });

  it("returns memberFinished when another counted member is still incomplete", () => {
    //* Arrange
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: ["workout"], id: "b" }),
    ];

    //* Act
    const event = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(event).toBe("memberFinished");
  });

  it("returns teamComplete when every counted member is done", () => {
    //* Arrange
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: softComplete, id: "b" }),
    ];

    //* Act
    const event = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(event).toBe("teamComplete");
  });

  it("ignores exited members and still requires failed Hard", () => {
    //* Arrange
    const hardIncomplete = member({
      checkedTaskIds: ["workout"],
      id: "failed",
      mode: "hard",
      status: "failed",
    });
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: [], id: "gone", status: "exited" }),
      hardIncomplete,
    ];

    //* Act
    const blocked = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });
    const converted = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members: [
        member({ checkedTaskIds: softComplete, id: "a" }),
        member({ checkedTaskIds: softComplete, id: "soft", mode: "soft", status: "active" }),
        member({ checkedTaskIds: [], id: "gone", status: "exited" }),
      ],
      startDate,
    });

    //* Assert
    expect(blocked).toBe("memberFinished");
    expect(converted).toBe("teamComplete");
  });

  it("ignores a dormant teammate who has not finished the day", () => {
    //* Arrange
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: softComplete, id: "b" }),
      member({ checkedTaskIds: [], dormant: true, id: "quiet" }),
    ];

    //* Act
    const event = resolveTeamDayEvent({
      actorId: "a",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(event).toBe("teamComplete");
  });

  it("does not fire a second teamComplete when a returning member finishes after the others", () => {
    //* Arrange
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: softComplete, id: "b" }),
      member({ checkedTaskIds: softComplete, dormant: false, id: "quiet" }),
    ];

    //* Act
    const event = resolveTeamDayEvent({
      actorId: "quiet",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(event).toBe("none");
  });

  it("fires teamComplete when a two-person team first has two counted finishers", () => {
    //* Arrange
    const members = [
      member({ checkedTaskIds: softComplete, id: "a" }),
      member({ checkedTaskIds: softComplete, id: "quiet" }),
    ];

    //* Act
    const event = resolveTeamDayEvent({
      actorId: "quiet",
      actorIsNowComplete: true,
      actorWasAlreadyComplete: false,
      date,
      endDate,
      members,
      startDate,
    });

    //* Assert
    expect(event).toBe("teamComplete");
  });
});

describe("isDormant", () => {
  const challengeDates = [
    "2026-09-01",
    "2026-09-02",
    "2026-09-03",
    "2026-09-04",
    "2026-09-05",
    "2026-09-06",
    "2026-09-07",
  ];

  it("is false before five past challenge days exist", () => {
    //* Act
    const dormant = isDormant({
      challengeDates,
      completions: [],
      mode: "soft",
      todayLocal: "2026-09-05",
    });

    //* Assert
    expect(dormant).toBe(false);
  });

  it("is false when the last complete day is the fifth most recent past day", () => {
    //* Act
    const dormant = isDormant({
      challengeDates,
      completions: [{ checkedTaskIds: [...softComplete], date: "2026-09-01" }],
      mode: "soft",
      todayLocal: "2026-09-06",
    });

    //* Assert
    expect(dormant).toBe(false);
  });

  it("is true when five past challenge days have no complete day in the window", () => {
    //* Act
    const dormant = isDormant({
      challengeDates,
      completions: [{ checkedTaskIds: [...softComplete], date: "2026-09-01" }],
      mode: "soft",
      todayLocal: "2026-09-07",
    });

    //* Assert
    expect(dormant).toBe(true);
  });

  it("clears when today is complete", () => {
    //* Act
    const dormant = isDormant({
      challengeDates,
      completions: [
        { checkedTaskIds: [...softComplete], date: "2026-09-01" },
        { checkedTaskIds: [...softComplete], date: "2026-09-07" },
      ],
      mode: "soft",
      todayLocal: "2026-09-07",
    });

    //* Assert
    expect(dormant).toBe(false);
  });

  it("is true when they never finished a day and five past days have elapsed", () => {
    //* Act
    const dormant = isDormant({
      challengeDates,
      completions: [],
      mode: "soft",
      todayLocal: "2026-09-07",
    });

    //* Assert
    expect(dormant).toBe(true);
  });
});

describe("teamDayPushRecipients", () => {
  it("excludes the actor and members with notifications off", () => {
    //* Arrange
    const members = [
      member({ id: "a", reminderEnabled: true }),
      member({ id: "b", reminderEnabled: true }),
      member({ id: "c", reminderEnabled: false }),
      member({ id: "d", reminderEnabled: true, status: "exited" }),
      member({ dormant: true, id: "e", reminderEnabled: true }),
    ];

    //* Act
    const recipients = teamDayPushRecipients({ actorId: "a", members });

    //* Assert
    expect(recipients.map((item) => item.id)).toEqual(["b"]);
  });
});

describe("pendingTeamCelebrationDate", () => {
  const challengeDates = ["2026-09-01", "2026-09-02", "2026-09-03"];

  it("returns the latest unseen team-complete date", () => {
    //* Arrange
    const members = [member({ id: "a" }), member({ id: "b" })];
    const completions = [
      { checkedTaskIds: [...softComplete], date: "2026-09-01", memberId: "a" },
      { checkedTaskIds: [...softComplete], date: "2026-09-01", memberId: "b" },
      { checkedTaskIds: [...softComplete], date: "2026-09-02", memberId: "a" },
      { checkedTaskIds: [...softComplete], date: "2026-09-02", memberId: "b" },
    ];

    //* Act
    const pending = pendingTeamCelebrationDate({
      challengeDates,
      completions,
      endDate,
      lastTeamCelebrationDate: null,
      members,
      startDate,
      todayLocal: "2026-09-02",
    });
    const seen = pendingTeamCelebrationDate({
      challengeDates,
      completions,
      endDate,
      lastTeamCelebrationDate: "2026-09-02",
      members,
      startDate,
      todayLocal: "2026-09-02",
    });

    //* Assert
    expect(pending).toBe("2026-09-02");
    expect(seen).toBeNull();
  });

  it("returns null for a solo team", () => {
    //* Act
    const pending = pendingTeamCelebrationDate({
      challengeDates,
      completions: [{ checkedTaskIds: [...softComplete], date: "2026-09-02", memberId: "a" }],
      endDate,
      lastTeamCelebrationDate: null,
      members: [member({ id: "a" })],
      startDate,
      todayLocal: "2026-09-02",
    });

    //* Assert
    expect(pending).toBeNull();
  });

  it("treats lastTeamCelebrationDate as a watermark", () => {
    //* Arrange
    const members = [member({ id: "a" }), member({ id: "b" })];
    const completions = [
      { checkedTaskIds: [...softComplete], date: "2026-09-01", memberId: "a" },
      { checkedTaskIds: [...softComplete], date: "2026-09-01", memberId: "b" },
    ];

    //* Act
    const pending = pendingTeamCelebrationDate({
      challengeDates,
      completions,
      endDate,
      lastTeamCelebrationDate: "2026-09-02",
      members,
      startDate,
      todayLocal: "2026-09-03",
    });
    const future = pendingTeamCelebrationDate({
      challengeDates,
      completions: [
        ...completions,
        { checkedTaskIds: [...softComplete], date: "2026-09-03", memberId: "a" },
        { checkedTaskIds: [...softComplete], date: "2026-09-03", memberId: "b" },
      ],
      endDate,
      lastTeamCelebrationDate: null,
      members,
      startDate,
      todayLocal: "2026-09-02",
    });

    //* Assert
    expect(pending).toBeNull();
    expect(future).toBe("2026-09-01");
  });

  it("treats a long-inactive teammate as uncounted for later dates", () => {
    //* Arrange
    const longDates = [
      "2026-09-01",
      "2026-09-02",
      "2026-09-03",
      "2026-09-04",
      "2026-09-05",
      "2026-09-06",
      "2026-09-07",
    ];
    const members = [member({ id: "a" }), member({ id: "b" }), member({ id: "quiet" })];
    const completions = [
      { checkedTaskIds: [...softComplete], date: "2026-09-07", memberId: "a" },
      { checkedTaskIds: [...softComplete], date: "2026-09-07", memberId: "b" },
    ];

    //* Act
    const pending = pendingTeamCelebrationDate({
      challengeDates: longDates,
      completions,
      endDate,
      lastTeamCelebrationDate: null,
      members,
      startDate,
      todayLocal: "2026-09-07",
    });
    const dayOneBlocked = pendingTeamCelebrationDate({
      challengeDates: longDates,
      completions: [
        { checkedTaskIds: [...softComplete], date: "2026-09-01", memberId: "a" },
        { checkedTaskIds: [...softComplete], date: "2026-09-01", memberId: "b" },
      ],
      endDate,
      lastTeamCelebrationDate: null,
      members,
      startDate,
      todayLocal: "2026-09-01",
    });

    //* Assert
    expect(pending).toBe("2026-09-07");
    expect(dayOneBlocked).toBeNull();
  });
});
