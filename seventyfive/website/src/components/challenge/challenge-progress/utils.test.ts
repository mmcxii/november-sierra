import { describe, expect, it } from "vitest";
import { emberDay, emberLevel, emberProgress, isTodayPending } from "./utils";

describe("emberDay", () => {
  it("stays at the start before the challenge", () => {
    //* Act
    const day = emberDay(0, true, true);

    //* Assert
    expect(day).toBe(0);
  });

  it("parks on yesterday while today is still pending", () => {
    //* Act
    const day = emberDay(3, false, true);

    //* Assert
    expect(day).toBe(2);
  });

  it("advances to today once the day is complete", () => {
    //* Act
    const day = emberDay(3, false, false);

    //* Assert
    expect(day).toBe(3);
  });

  it("stays at the start on day 1 while incomplete", () => {
    //* Act
    const day = emberDay(1, false, true);

    //* Assert
    expect(day).toBe(0);
  });
});

describe("isTodayPending", () => {
  it("is true when today is the last elapsed day and still incomplete", () => {
    //* Act
    const pending = isTodayPending({
      elapsedComplete: [true, true, false],
      emberFailed: false,
      lastElapsedIsToday: true,
    });

    //* Assert
    expect(pending).toBe(true);
  });

  it("is false after today is complete", () => {
    //* Act
    const pending = isTodayPending({
      elapsedComplete: [true, true, true],
      emberFailed: false,
      lastElapsedIsToday: true,
    });

    //* Assert
    expect(pending).toBe(false);
  });

  it("is false for hard failed fill so the ember stays on the elapsed edge", () => {
    //* Act
    const pending = isTodayPending({
      elapsedComplete: [true, false, false],
      emberFailed: true,
      lastElapsedIsToday: true,
    });

    //* Assert
    expect(pending).toBe(false);
  });
});

describe("emberProgress", () => {
  it("maps elapsed days onto 0–1", () => {
    //* Act
    const progress = emberProgress(15);

    //* Assert
    expect(progress).toBe(15 / 75);
    expect(emberLevel(progress)).toBe(2);
  });
});
