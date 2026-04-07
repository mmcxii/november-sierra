import { describe, expect, it, vi } from "vitest";
import { computeTrendPercent, fillDateGaps } from "./analytics";

describe("computeTrendPercent", () => {
  it("returns 0 when both values are 0", () => {
    //* Act
    const result = computeTrendPercent(0, 0);

    //* Assert
    expect(result).toBe(0);
  });

  it("returns 100 when previous is 0 and current is positive", () => {
    //* Act
    const result = computeTrendPercent(50, 0);

    //* Assert
    expect(result).toBe(100);
  });

  it("returns -100 when current is 0 and previous is positive", () => {
    //* Act
    const result = computeTrendPercent(0, 50);

    //* Assert
    expect(result).toBe(-100);
  });

  it("returns positive percent for growth", () => {
    //* Act
    const result = computeTrendPercent(150, 100);

    //* Assert
    expect(result).toBe(50);
  });

  it("returns negative percent for decline", () => {
    //* Act
    const result = computeTrendPercent(75, 100);

    //* Assert
    expect(result).toBe(-25);
  });

  it("returns 0 when values are equal", () => {
    //* Act
    const result = computeTrendPercent(100, 100);

    //* Assert
    expect(result).toBe(0);
  });

  it("rounds to the nearest integer", () => {
    //* Act
    const result = computeTrendPercent(1, 3);

    //* Assert
    expect(result).toBe(-67);
  });
});

describe("fillDateGaps", () => {
  it("fills missing dates with zero clicks", () => {
    //* Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));
    const rows = [
      { clicks: 5, date: "2026-03-14" },
      { clicks: 3, date: "2026-03-16" },
    ];

    //* Act
    const result = fillDateGaps(rows, 3);

    //* Assert
    expect(result).toEqual([
      { clicks: 0, date: "2026-03-13" },
      { clicks: 5, date: "2026-03-14" },
      { clicks: 0, date: "2026-03-15" },
      { clicks: 3, date: "2026-03-16" },
    ]);
    vi.useRealTimers();
  });

  it("returns all zeros for empty input", () => {
    //* Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));

    //* Act
    const result = fillDateGaps([], 3);

    //* Assert
    expect(result).toHaveLength(4);
    expect(result.every((r) => r.clicks === 0)).toBe(true);
    vi.useRealTimers();
  });

  it("handles a single day range", () => {
    //* Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));
    const rows = [{ clicks: 10, date: "2026-03-16" }];

    //* Act
    const result = fillDateGaps(rows, 0);

    //* Assert
    expect(result).toEqual([{ clicks: 10, date: "2026-03-16" }]);
    vi.useRealTimers();
  });

  it("preserves click counts for a full range with no gaps", () => {
    //* Arrange
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-03-16T12:00:00Z"));
    const rows = [
      { clicks: 1, date: "2026-03-14" },
      { clicks: 2, date: "2026-03-15" },
      { clicks: 3, date: "2026-03-16" },
    ];

    //* Act
    const result = fillDateGaps(rows, 2);

    //* Assert
    expect(result).toEqual([
      { clicks: 1, date: "2026-03-14" },
      { clicks: 2, date: "2026-03-15" },
      { clicks: 3, date: "2026-03-16" },
    ]);
    vi.useRealTimers();
  });
});
