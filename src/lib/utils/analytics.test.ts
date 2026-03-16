import { describe, expect, it, vi } from "vitest";
import { fillDateGaps } from "./analytics";

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
