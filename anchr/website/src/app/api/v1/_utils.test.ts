import { describe, expect, it } from "vitest";
import { parseDateRange } from "./_utils";

describe("parseDateRange", () => {
  it("returns null dates when no params", () => {
    //* Act
    const url = new URL("https://anchr.to/api/v1/analytics");
    const { end, start } = parseDateRange(url);

    //* Assert
    expect(start).toBeNull();
    expect(end).toBeNull();
  });

  it("parses valid start date", () => {
    //* Act
    const url = new URL("https://anchr.to/api/v1/analytics?start=2026-01-01");
    const { start } = parseDateRange(url);

    //* Assert
    expect(start).toBeInstanceOf(Date);
    expect((start as Date).getFullYear()).toBe(2026);
    expect((start as Date).getMonth()).toBe(0);
    expect((start as Date).getDate()).toBe(1);
    expect((start as Date).getHours()).toBe(0);
  });

  it("parses valid end date with time set to end of day", () => {
    //* Act
    const url = new URL("https://anchr.to/api/v1/analytics?end=2026-01-31");
    const { end } = parseDateRange(url);

    //* Assert
    expect(end).toBeInstanceOf(Date);
    expect((end as Date).getHours()).toBe(23);
    expect((end as Date).getMinutes()).toBe(59);
  });

  it("parses both start and end", () => {
    //* Act
    const url = new URL("https://anchr.to/api/v1/analytics?start=2026-01-01&end=2026-01-31");
    const { end, start } = parseDateRange(url);

    //* Assert
    expect(start).toBeInstanceOf(Date);
    expect(end).toBeInstanceOf(Date);
  });

  it("returns null for invalid date strings", () => {
    //* Act
    const url = new URL("https://anchr.to/api/v1/analytics?start=not-a-date&end=also-bad");
    const { end, start } = parseDateRange(url);

    //* Assert
    expect(start).toBeNull();
    expect(end).toBeNull();
  });
});
