import { describe, expect, it } from "vitest";
import {
  canEditDay,
  daysUntilStart,
  endDateFromStart,
  hasSoftStumble,
  hasStartPassed,
  isJoinAllowed,
  isReminderDue,
  isStartDateInPast,
  isStartDateSelectable,
  localDateString,
  recomputeMemberStatus,
  remainingTaskIds,
  resolveDailyReminder,
  startDateBoundsForTimeZone,
} from "./tasks";

describe("endDateFromStart", () => {
  it("adds 74 days for a 75-day inclusive window", () => {
    //* Arrange
    const startDate = "2026-09-01";

    //* Act
    const result = endDateFromStart(startDate);

    //* Assert
    expect(result).toBe("2026-11-14");
  });
});

describe("isJoinAllowed", () => {
  it("allows join on or before the start date", () => {
    //* Arrange
    const startDate = "2026-09-01";

    //* Act
    const before = isJoinAllowed(startDate, "2026-08-31");
    const onStart = isJoinAllowed(startDate, "2026-09-01");
    const after = isJoinAllowed(startDate, "2026-09-02");

    //* Assert
    expect(before).toBe(true);
    expect(onStart).toBe(true);
    expect(after).toBe(false);
  });
});

describe("isStartDateInPast", () => {
  it("allows today and future start dates", () => {
    //* Arrange
    const today = "2026-09-01";

    //* Act
    const past = isStartDateInPast("2026-08-31", today);
    const todayStart = isStartDateInPast("2026-09-01", today);
    const future = isStartDateInPast("2026-09-02", today);

    //* Assert
    expect(past).toBe(true);
    expect(todayStart).toBe(false);
    expect(future).toBe(false);
  });
});

describe("localDateString with non-UTC timezones", () => {
  it("keeps America/Los_Angeles on the previous calendar day near UTC midnight", () => {
    //* Arrange
    const now = new Date("2026-08-10T00:30:00.000Z");

    //* Act
    const laDate = localDateString(now, "America/Los_Angeles");
    const utcDate = localDateString(now, "UTC");

    //* Assert
    expect(laDate).toBe("2026-08-09");
    expect(utcDate).toBe("2026-08-10");
  });

  it("keeps Pacific/Auckland ahead of UTC near midnight", () => {
    //* Arrange
    const now = new Date("2026-08-09T12:30:00.000Z");

    //* Act
    const aucklandDate = localDateString(now, "Pacific/Auckland");
    const utcDate = localDateString(now, "UTC");

    //* Assert
    expect(aucklandDate).toBe("2026-08-10");
    expect(utcDate).toBe("2026-08-09");
  });
});

describe("isStartDateSelectable with non-UTC timezones", () => {
  it("allows local today in America/Los_Angeles when UTC has already rolled forward", () => {
    //* Arrange
    const now = new Date("2026-08-10T00:30:00.000Z");
    const timeZone = "America/Los_Angeles";
    const localToday = localDateString(now, timeZone);

    //* Act
    const selectableLocally = isStartDateSelectable(localToday, now, timeZone);
    const selectableAgainstUtc = isStartDateSelectable(localToday, now, "UTC");

    //* Assert
    expect(localToday).toBe("2026-08-09");
    expect(selectableLocally).toBe(true);
    expect(selectableAgainstUtc).toBe(false);
  });
});

describe("startDateBoundsForTimeZone", () => {
  it("uses America/Los_Angeles today as min, not UTC today", () => {
    //* Arrange
    const now = new Date("2026-08-10T00:30:00.000Z");

    //* Act
    const bounds = startDateBoundsForTimeZone("America/Los_Angeles", now);

    //* Assert
    expect(bounds.min).toBe("2026-08-09");
    expect(bounds.defaultValue).toBe("2026-08-10");
  });
});

describe("hasStartPassed", () => {
  it("locks mode once the local start date arrives", () => {
    //* Arrange
    const startDate = "2026-09-02";

    //* Act
    const before = hasStartPassed(startDate, "2026-09-01");
    const onStart = hasStartPassed(startDate, "2026-09-02");

    //* Assert
    expect(before).toBe(false);
    expect(onStart).toBe(true);
  });
});

describe("daysUntilStart", () => {
  it("counts whole days until start", () => {
    //* Arrange
    const startDate = "2026-09-03";

    //* Act
    const inTwoDays = daysUntilStart(startDate, "2026-09-01");
    const tomorrow = daysUntilStart(startDate, "2026-09-02");
    const started = daysUntilStart(startDate, "2026-09-03");

    //* Assert
    expect(inTwoDays).toBe(2);
    expect(tomorrow).toBe(1);
    expect(started).toBe(0);
  });
});

describe("recomputeMemberStatus", () => {
  it("fails hard members with an incomplete past day", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [
        {
          checkedTaskIds: ["workout", "outdoorWorkout", "water", "diet", "reading", "progressPhoto"],
          date: "2026-09-01",
          mode: "hard" as const,
        },
      ],
      mode: "hard" as const,
      todayLocal: "2026-09-03",
    };

    //* Act
    const status = recomputeMemberStatus(input);

    //* Assert
    expect(status).toBe("failed");
  });

  it("restores hard members when past days are complete", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02"],
      completions: [
        {
          checkedTaskIds: ["workout", "outdoorWorkout", "water", "diet", "reading", "progressPhoto"],
          date: "2026-09-01",
          mode: "hard" as const,
        },
      ],
      mode: "hard" as const,
      todayLocal: "2026-09-02",
    };

    //* Act
    const status = recomputeMemberStatus(input);

    //* Assert
    expect(status).toBe("active");
  });

  it("keeps soft members active even with incomplete past days", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02"],
      completions: [],
      mode: "soft" as const,
      todayLocal: "2026-09-02",
    };

    //* Act
    const status = recomputeMemberStatus(input);

    //* Assert
    expect(status).toBe("active");
  });
});

describe("hasSoftStumble", () => {
  it("detects incomplete past soft days", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02"],
      completions: [],
      todayLocal: "2026-09-02",
    };

    //* Act
    const stumble = hasSoftStumble(input);

    //* Assert
    expect(stumble).toBe(true);
  });
});

describe("canEditDay", () => {
  it("blocks today for failed hard members", () => {
    //* Arrange
    const input = {
      mode: "hard" as const,
      selectedDate: "2026-09-03",
      startDate: "2026-09-01",
      status: "failed" as const,
      todayLocal: "2026-09-03",
    };

    //* Act
    const editable = canEditDay(input);

    //* Assert
    expect(editable).toBe(false);
  });

  it("allows past days for failed hard members", () => {
    //* Arrange
    const input = {
      mode: "hard" as const,
      selectedDate: "2026-09-01",
      startDate: "2026-09-01",
      status: "failed" as const,
      todayLocal: "2026-09-03",
    };

    //* Act
    const editable = canEditDay(input);

    //* Assert
    expect(editable).toBe(true);
  });
});

describe("remainingTaskIds", () => {
  it("returns unchecked soft tasks", () => {
    //* Arrange
    const checked = ["workout", "water"];

    //* Act
    const remaining = remainingTaskIds("soft", checked);

    //* Assert
    expect(remaining).toEqual(["diet", "reading"]);
  });
});

describe("resolveDailyReminder", () => {
  it("fires incomplete reminder once when local time reaches reminder time", () => {
    //* Arrange
    const now = new Date("2026-09-02T20:05:00.000Z");

    //* Act
    const reminder = resolveDailyReminder({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      startDate: "2026-09-01",
      status: "active",
      timeZone: "UTC",
      todayIncomplete: true,
    });

    //* Assert
    expect(reminder).toEqual({ type: "incomplete" });
    expect(
      isReminderDue({
        lastReminderDate: null,
        now,
        reminderEnabled: true,
        reminderTime: "20:00",
        startDate: "2026-09-01",
        status: "active",
        timeZone: "UTC",
        todayIncomplete: true,
      }),
    ).toBe(true);
  });

  it("does not fire incomplete reminders for failed hard members", () => {
    //* Arrange
    const now = new Date("2026-09-02T20:05:00.000Z");

    //* Act
    const reminder = resolveDailyReminder({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      startDate: "2026-09-01",
      status: "failed",
      timeZone: "UTC",
      todayIncomplete: true,
    });

    //* Assert
    expect(reminder).toBeNull();
  });

  it("sends countdown reminders before the challenge starts", () => {
    //* Arrange
    const now = new Date("2026-09-01T20:05:00.000Z");

    //* Act
    const inTwoDays = resolveDailyReminder({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      startDate: "2026-09-03",
      status: "active",
      timeZone: "UTC",
      todayIncomplete: true,
    });
    const tomorrow = resolveDailyReminder({
      lastReminderDate: null,
      now: new Date("2026-09-02T20:05:00.000Z"),
      reminderEnabled: true,
      reminderTime: "20:00",
      startDate: "2026-09-03",
      status: "active",
      timeZone: "UTC",
      todayIncomplete: false,
    });

    //* Assert
    expect(inTwoDays).toEqual({ daysUntil: 2, type: "countdown" });
    expect(tomorrow).toEqual({ daysUntil: 1, type: "countdown" });
  });

  it("does not send countdown after already reminding today", () => {
    //* Arrange
    const now = new Date("2026-09-01T20:05:00.000Z");

    //* Act
    const reminder = resolveDailyReminder({
      lastReminderDate: "2026-09-01",
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      startDate: "2026-09-03",
      status: "active",
      timeZone: "UTC",
      todayIncomplete: true,
    });

    //* Assert
    expect(reminder).toBeNull();
  });

  it("uses member timezone for pre-start countdown near UTC midnight", () => {
    //* Arrange — 2026-09-02 07:05 UTC is still 2026-09-01 20:05 in Los Angeles
    const now = new Date("2026-09-02T03:05:00.000Z");

    //* Act
    const reminder = resolveDailyReminder({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      startDate: "2026-09-03",
      status: "active",
      timeZone: "America/Los_Angeles",
      todayIncomplete: true,
    });

    //* Assert
    expect(reminder).toEqual({ daysUntil: 2, type: "countdown" });
  });
});
