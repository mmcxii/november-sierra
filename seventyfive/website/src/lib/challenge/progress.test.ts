import { describe, expect, it } from "vitest";
import { buildChallengeProgressSlices, countMissedSlices, elapsedProgressForMember } from "./progress";

describe("buildChallengeProgressSlices", () => {
  it("keeps pre-start / empty elapsed as all future", () => {
    //* Arrange
    const elapsedComplete: boolean[] = [];

    //* Act
    const slices = buildChallengeProgressSlices({
      elapsedComplete,
      lastElapsedIsToday: false,
      mode: "soft",
      status: "active",
      totalDays: 5,
    });

    //* Assert
    expect(slices).toEqual(["future", "future", "future", "future", "future"]);
  });

  it("marks soft past misses grey and leaves today pending when incomplete", () => {
    //* Arrange
    const elapsedComplete = [true, false, false];

    //* Act
    const slices = buildChallengeProgressSlices({
      elapsedComplete,
      lastElapsedIsToday: true,
      mode: "soft",
      status: "active",
      totalDays: 5,
    });

    //* Assert
    expect(slices).toEqual(["complete", "missed", "pending", "future", "future"]);
    expect(countMissedSlices(slices)).toBe(1);
  });

  it("fills soft solid primary when every elapsed day is complete", () => {
    //* Arrange
    const elapsedComplete = [true, true, true];

    //* Act
    const slices = buildChallengeProgressSlices({
      elapsedComplete,
      lastElapsedIsToday: true,
      mode: "soft",
      status: "active",
      totalDays: 5,
    });

    //* Assert
    expect(slices).toEqual(["complete", "complete", "complete", "future", "future"]);
  });

  it("uses failed fill through today for hard failed members", () => {
    //* Arrange
    const elapsedComplete = [true, false, false];

    //* Act
    const slices = buildChallengeProgressSlices({
      elapsedComplete,
      lastElapsedIsToday: true,
      mode: "hard",
      status: "failed",
      totalDays: 5,
    });

    //* Assert
    expect(slices).toEqual(["failed", "failed", "failed", "future", "future"]);
  });

  it("keeps hard active fill primary with today pending when incomplete", () => {
    //* Arrange
    const elapsedComplete = [true, true, false];

    //* Act
    const slices = buildChallengeProgressSlices({
      elapsedComplete,
      lastElapsedIsToday: true,
      mode: "hard",
      status: "active",
      totalDays: 5,
    });

    //* Assert
    expect(slices).toEqual(["complete", "complete", "pending", "future", "future"]);
  });

  it("treats incomplete last day as missed when today is after the challenge", () => {
    //* Arrange
    const elapsedComplete = [true, false];

    //* Act
    const slices = buildChallengeProgressSlices({
      elapsedComplete,
      lastElapsedIsToday: false,
      mode: "soft",
      status: "active",
      totalDays: 2,
    });

    //* Assert
    expect(slices).toEqual(["complete", "missed"]);
  });
});

describe("elapsedProgressForMember", () => {
  it("builds completeness through today from completions", () => {
    //* Arrange
    const startDate = "2026-09-01";
    const endDate = "2026-09-05";
    const todayLocal = "2026-09-03";
    const softTasks = ["workout", "diet", "alcohol", "water", "reading"];

    //* Act
    const result = elapsedProgressForMember({
      completions: [
        { checkedTaskIds: softTasks, date: "2026-09-01" },
        { checkedTaskIds: ["workout"], date: "2026-09-02" },
      ],
      endDate,
      mode: "soft",
      startDate,
      todayLocal,
    });

    //* Assert
    expect(result.lastElapsedIsToday).toBe(true);
    expect(result.elapsedComplete).toEqual([true, false, false]);
  });

  it("treats a middle Hard day as complete without a photo when the flag is on", () => {
    //* Arrange
    const hardWithoutPhoto = ["workout", "outdoorWorkout", "water", "diet", "reading"];

    //* Act
    const result = elapsedProgressForMember({
      completions: [
        { checkedTaskIds: [...hardWithoutPhoto, "progressPhoto"], date: "2026-09-01" },
        { checkedTaskIds: hardWithoutPhoto, date: "2026-09-02" },
      ],
      endDate: "2026-11-14",
      mode: "hard",
      progressPhotoEndsOnly: true,
      startDate: "2026-09-01",
      todayLocal: "2026-09-02",
    });

    //* Assert
    expect(result.elapsedComplete).toEqual([true, true]);
  });
});
