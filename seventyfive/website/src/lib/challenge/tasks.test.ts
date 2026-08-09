import { describe, expect, it } from "vitest";
import {
  canEditDay,
  endDateFromStart,
  hasSoftStumble,
  isJoinAllowed,
  isReminderDue,
  recomputeMemberStatus,
  remainingTaskIds,
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
  it("allows join only before start date", () => {
    //* Arrange
    const startDate = "2026-09-01";

    //* Act
    const before = isJoinAllowed(startDate, "2026-08-31");
    const onStart = isJoinAllowed(startDate, "2026-09-01");

    //* Assert
    expect(before).toBe(true);
    expect(onStart).toBe(false);
  });
});

describe("recomputeMemberStatus", () => {
  it("fails hard members with an incomplete past day", () => {
    //* Arrange
    const input = {
      challengeDates: ["2026-09-01", "2026-09-02", "2026-09-03"],
      completions: [
        {
          checkedTaskIds: ["workout", "outdoorWorkout", "water", "diet", "progressPhoto"],
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
          checkedTaskIds: ["workout", "outdoorWorkout", "water", "diet", "progressPhoto"],
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

describe("isReminderDue", () => {
  it("fires once when local time reaches reminder time", () => {
    //* Arrange
    const now = new Date("2026-09-02T20:05:00.000Z");

    //* Act
    const due = isReminderDue({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      status: "active",
      timeZone: "UTC",
      todayIncomplete: true,
    });

    //* Assert
    expect(due).toBe(true);
  });

  it("does not fire for failed hard members", () => {
    //* Arrange
    const now = new Date("2026-09-02T03:05:00.000Z");

    //* Act
    const due = isReminderDue({
      lastReminderDate: null,
      now,
      reminderEnabled: true,
      reminderTime: "20:00",
      status: "failed",
      timeZone: "UTC",
      todayIncomplete: true,
    });

    //* Assert
    expect(due).toBe(false);
  });
});
