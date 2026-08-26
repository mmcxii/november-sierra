import { describe, expect, it } from "vitest";
import {
  canEditDay,
  countCompletedHardDays,
  daysUntilStart,
  endDateFromStart,
  firstIncompletePastDate,
  hasSoftStumble,
  hasStartPassed,
  isJoinAllowed,
  isReminderDue,
  isStartDateInPast,
  isStartDateSelectable,
  localDateString,
  preStartRosterPulseMs,
  recomputeMemberStatus,
  remainingTaskIds,
  resolveDailyReminder,
  startDateBoundsForTimeZone,
  taskIdsForDay,
  tasksForDay,
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
  it("allows join through day 1 and locks from day 2", () => {
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

describe("preStartRosterPulseMs", () => {
  it("returns null once the challenge has started", () => {
    //* Arrange
    const daysUntil = 0;

    //* Act
    const pulseMs = preStartRosterPulseMs(daysUntil);

    //* Assert
    expect(pulseMs).toBeNull();
  });

  it("scales the pulse interval by one second per day out", () => {
    //* Arrange
    const farOut = 45;
    const monthOut = 30;
    const mid = 15;
    const twoDays = 2;
    const tomorrow = 1;

    //* Act
    const farOutMs = preStartRosterPulseMs(farOut);
    const monthOutMs = preStartRosterPulseMs(monthOut);
    const midMs = preStartRosterPulseMs(mid);
    const twoDaysMs = preStartRosterPulseMs(twoDays);
    const tomorrowMs = preStartRosterPulseMs(tomorrow);

    //* Assert
    expect(farOutMs).toBe(30_000);
    expect(monthOutMs).toBe(30_000);
    expect(midMs).toBe(15_000);
    expect(twoDaysMs).toBe(2000);
    expect(tomorrowMs).toBe(1200);
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
  const softComplete = ["workout", "diet", "alcohol", "water", "reading"] as const;

  it("is true when yesterday is incomplete and today is not done", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [],
      todayLocal: "2026-09-02",
    };

    //* Act
    const stumble = hasSoftStumble(input);

    //* Assert
    expect(stumble).toBe(true);
  });

  it("clears when today is complete even if yesterday was missed", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [{ checkedTaskIds: [...softComplete], date: "2026-09-02", mode: "soft" as const }],
      todayLocal: "2026-09-02",
    };

    //* Act
    const stumble = hasSoftStumble(input);

    //* Assert
    expect(stumble).toBe(false);
  });

  it("does not keep Off track after a completed yesterday when an older day was missed", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [{ checkedTaskIds: [...softComplete], date: "2026-09-02", mode: "soft" as const }],
      todayLocal: "2026-09-03",
    };

    //* Act
    const stumble = hasSoftStumble(input);

    //* Assert
    expect(stumble).toBe(false);
  });

  it("is false on the first challenge day", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02"],
      completions: [],
      todayLocal: "2026-09-01",
    };

    //* Act
    const stumble = hasSoftStumble(input);

    //* Assert
    expect(stumble).toBe(false);
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

  it("blocks every day after a hard member exits", () => {
    //* Arrange
    const input = {
      mode: "hard" as const,
      selectedDate: "2026-09-01",
      startDate: "2026-09-01",
      status: "exited" as const,
      todayLocal: "2026-09-03",
    };

    //* Act
    const editable = canEditDay(input);

    //* Assert
    expect(editable).toBe(false);
  });
});

describe("countCompletedHardDays", () => {
  it("counts only past complete hard days", () => {
    //* Arrange
    const hardComplete = ["workout", "outdoorWorkout", "water", "diet", "reading", "progressPhoto"];

    //* Act
    const completed = countCompletedHardDays({
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [
        { checkedTaskIds: hardComplete, date: "2026-09-01", mode: "hard" },
        { checkedTaskIds: ["workout"], date: "2026-09-02", mode: "hard" },
      ],
      todayLocal: "2026-09-03",
    });

    //* Assert
    expect(completed).toBe(1);
  });
});

describe("firstIncompletePastDate", () => {
  it("returns the earliest incomplete past hard day", () => {
    //* Arrange
    const hardComplete = ["workout", "outdoorWorkout", "water", "diet", "reading", "progressPhoto"];

    //* Act
    const date = firstIncompletePastDate({
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [{ checkedTaskIds: hardComplete, date: "2026-09-01", mode: "hard" }],
      mode: "hard",
      todayLocal: "2026-09-03",
    });

    //* Assert
    expect(date).toBe("2026-09-02");
  });
});

describe("remainingTaskIds", () => {
  it("returns unchecked soft tasks", () => {
    //* Arrange
    const checked = ["workout", "water"];

    //* Act
    const remaining = remainingTaskIds("soft", checked);

    //* Assert
    expect(remaining).toEqual(["diet", "alcohol", "reading"]);
  });

  it("omits the progress photo on a middle Hard day when the ends-only flag is on", () => {
    //* Arrange
    const context = {
      date: "2026-09-02",
      endDate: "2026-11-14",
      progressPhotoEndsOnly: true,
      startDate: "2026-09-01",
    };

    //* Act
    const remaining = remainingTaskIds("hard", ["workout", "outdoorWorkout", "water", "diet", "reading"], context);

    //* Assert
    expect(remaining).toEqual([]);
  });
});

describe("tasksForDay progress photo ends only", () => {
  const startDate = "2026-09-01";
  const endDate = "2026-11-14";
  const hardWithoutPhoto = ["workout", "outdoorWorkout", "water", "diet", "reading"] as const;
  const hardComplete = [...hardWithoutPhoto, "progressPhoto"] as const;

  it("keeps six Hard tasks every day when the flag is off", () => {
    //* Arrange
    const middle = { date: "2026-09-02", endDate, startDate };

    //* Act
    const startIds = taskIdsForDay("hard", { date: startDate, endDate, startDate });
    const middleIds = taskIdsForDay("hard", middle);
    const endIds = taskIdsForDay("hard", { date: endDate, endDate, startDate });

    //* Assert
    expect(startIds).toHaveLength(6);
    expect(middleIds).toHaveLength(6);
    expect(endIds).toHaveLength(6);
    expect(middleIds).toContain("progressPhoto");
  });

  it("requires the photo only on start and end when the flag is on", () => {
    //* Arrange
    const flagOn = { endDate, progressPhotoEndsOnly: true, startDate };

    //* Act
    const startTasks = tasksForDay("hard", { ...flagOn, date: startDate });
    const middleTasks = tasksForDay("hard", { ...flagOn, date: "2026-09-02" });
    const endTasks = tasksForDay("hard", { ...flagOn, date: endDate });

    //* Assert
    expect(startTasks).toHaveLength(6);
    expect(middleTasks).toHaveLength(5);
    expect(endTasks).toHaveLength(6);
    expect(middleTasks.map((task) => task.id)).not.toContain("progressPhoto");
  });

  it("completes a middle Hard day without a photo when the flag is on", () => {
    //* Arrange
    const input = {
      challengeDates: [startDate, "2026-09-02", endDate],
      completions: [
        { checkedTaskIds: [...hardComplete], date: startDate, mode: "hard" as const },
        { checkedTaskIds: [...hardWithoutPhoto], date: "2026-09-02", mode: "hard" as const },
      ],
      mode: "hard" as const,
      progressPhotoEndsOnly: true,
      todayLocal: "2026-09-03",
    };

    //* Act
    const status = recomputeMemberStatus(input);
    const incomplete = firstIncompletePastDate(input);
    const completed = countCompletedHardDays({
      challengeDates: input.challengeDates,
      completions: input.completions,
      progressPhotoEndsOnly: true,
      todayLocal: input.todayLocal,
    });

    //* Assert
    expect(status).toBe("active");
    expect(incomplete).toBeNull();
    expect(completed).toBe(2);
  });

  it("fails Hard when a middle day is missing the photo and the flag is off", () => {
    //* Arrange
    const input = {
      challengeDates: [startDate, "2026-09-02", endDate],
      completions: [{ checkedTaskIds: [...hardComplete], date: startDate, mode: "hard" as const }],
      mode: "hard" as const,
      todayLocal: "2026-09-03",
    };

    //* Act
    const status = recomputeMemberStatus(input);
    const incomplete = firstIncompletePastDate(input);

    //* Assert
    expect(status).toBe("failed");
    expect(incomplete).toBe("2026-09-02");
  });

  it("still requires a photo on the start date when the flag is on", () => {
    //* Arrange
    const input = {
      challengeDates: [startDate, "2026-09-02", endDate],
      completions: [{ checkedTaskIds: [...hardWithoutPhoto], date: startDate, mode: "hard" as const }],
      mode: "hard" as const,
      progressPhotoEndsOnly: true,
      todayLocal: "2026-09-02",
    };

    //* Act — start day has no photo; firstIncompletePastDate should not fire for today
    const startIncomplete = firstIncompletePastDate({
      ...input,
      todayLocal: "2026-09-03",
    });

    //* Assert
    expect(startIncomplete).toBe(startDate);
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

  it("treats HH:mm:ss reminder times the same as HH:mm", () => {
    //* Arrange — lexicographic compare of "20:05" < "20:00:00" is true and would skip forever
    const now = new Date("2026-09-02T20:05:00.000Z");

    //* Act
    const reminder = resolveDailyReminder({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00:00",
      startDate: "2026-09-01",
      status: "active",
      timeZone: "UTC",
      todayIncomplete: true,
    });

    //* Assert
    expect(reminder).toEqual({ type: "incomplete" });
  });
});
