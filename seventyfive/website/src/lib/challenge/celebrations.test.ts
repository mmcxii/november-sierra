import { describe, expect, it } from "vitest";
import { challengeDayNumber, daysRemainingAfter, resolveCheckCelebration } from "./celebrations";

describe("challengeDayNumber", () => {
  it("returns 1-based day within the challenge", () => {
    //* Arrange
    const startDate = "2026-09-01";

    //* Act
    const dayOne = challengeDayNumber(startDate, "2026-09-01");
    const dayTwo = challengeDayNumber(startDate, "2026-09-02");
    const daySeventyFive = challengeDayNumber(startDate, "2026-11-14");
    const beforeStart = challengeDayNumber(startDate, "2026-08-31");

    //* Assert
    expect(dayOne).toBe(1);
    expect(dayTwo).toBe(2);
    expect(daySeventyFive).toBe(75);
    expect(beforeStart).toBeNull();
  });
});

describe("resolveCheckCelebration", () => {
  const softComplete = ["workout", "diet", "water", "reading"] as const;

  it("returns none when unchecking", () => {
    //* Act
    const result = resolveCheckCelebration({
      checkedTaskIdsBefore: softComplete.slice(0, 3),
      endDate: "2026-11-14",
      mode: "soft",
      nextChecked: false,
      selectedDate: "2026-09-10",
      startDate: "2026-09-01",
      taskId: "reading",
      todayLocal: "2026-09-10",
    });

    //* Assert
    expect(result).toBe("none");
  });

  it("returns none when catching up a past day", () => {
    //* Act
    const result = resolveCheckCelebration({
      checkedTaskIdsBefore: softComplete.slice(0, 3),
      endDate: "2026-11-14",
      mode: "soft",
      nextChecked: true,
      selectedDate: "2026-09-09",
      startDate: "2026-09-01",
      taskId: "reading",
      todayLocal: "2026-09-10",
    });

    //* Assert
    expect(result).toBe("none");
  });

  it("returns day when finishing today before the finale", () => {
    //* Act
    const result = resolveCheckCelebration({
      checkedTaskIdsBefore: softComplete.slice(0, 3),
      endDate: "2026-11-14",
      mode: "soft",
      nextChecked: true,
      selectedDate: "2026-09-10",
      startDate: "2026-09-01",
      taskId: "reading",
      todayLocal: "2026-09-10",
    });

    //* Assert
    expect(result).toBe("day");
    expect(daysRemainingAfter(10)).toBe(65);
  });

  it("returns finale when finishing the end date today", () => {
    //* Act
    const result = resolveCheckCelebration({
      checkedTaskIdsBefore: softComplete.slice(0, 3),
      endDate: "2026-11-14",
      mode: "soft",
      nextChecked: true,
      selectedDate: "2026-11-14",
      startDate: "2026-09-01",
      taskId: "reading",
      todayLocal: "2026-11-14",
    });

    //* Assert
    expect(result).toBe("finale");
  });

  it("returns none when the day was already complete", () => {
    //* Act
    const result = resolveCheckCelebration({
      checkedTaskIdsBefore: [...softComplete],
      endDate: "2026-11-14",
      mode: "soft",
      nextChecked: true,
      selectedDate: "2026-09-10",
      startDate: "2026-09-01",
      taskId: "reading",
      todayLocal: "2026-09-10",
    });

    //* Assert
    expect(result).toBe("none");
  });
});
