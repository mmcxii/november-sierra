import { type Mock, describe, expect, it, vi } from "vitest";
import { formatAccountAge } from "./format-account-age";

const mockT = vi.fn((key: string, opts?: Record<string, unknown>) => {
  if (opts != null) {
    return Object.entries(opts).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key);
  }
  return key;
}) as unknown as Parameters<typeof formatAccountAge>[1];

describe("formatAccountAge", () => {
  it("returns lessThanADay for dates less than 24 hours ago", () => {
    //* Arrange
    const now = new Date();

    //* Act
    const result = formatAccountAge(now, mockT);

    //* Assert
    expect(result).toBe("lessThanADay");
  });

  it("returns days for dates less than 30 days ago", () => {
    //* Arrange
    const date = new Date();
    date.setDate(date.getDate() - 15);

    //* Act
    const result = formatAccountAge(date, mockT);

    //* Assert
    expect(result).toBe("15Days");
    expect((mockT as unknown as Mock).mock.calls.at(-1)).toEqual(["{{count}}Days", { count: 15 }]);
  });

  it("returns months for dates less than 12 months ago", () => {
    //* Arrange
    const date = new Date();
    date.setDate(date.getDate() - 90);

    //* Act
    const result = formatAccountAge(date, mockT);

    //* Assert
    expect((mockT as unknown as Mock).mock.calls.at(-1)?.[0]).toBe("{{count}}Months");
    expect((mockT as unknown as Mock).mock.calls.at(-1)?.[1]).toEqual({ count: 3 });
  });

  it("returns years for exact year boundaries", () => {
    //* Arrange
    const date = new Date();
    date.setDate(date.getDate() - 720); // ~2 years

    //* Act
    const result = formatAccountAge(date, mockT);

    //* Assert
    expect((mockT as unknown as Mock).mock.calls.at(-1)?.[0]).toBe("{{count}}Years");
    expect((mockT as unknown as Mock).mock.calls.at(-1)?.[1]).toEqual({ count: 2 });
  });

  it("returns years and months for mixed durations", () => {
    //* Arrange
    const date = new Date();
    date.setDate(date.getDate() - 450); // ~1 year 3 months

    //* Act
    const result = formatAccountAge(date, mockT);

    //* Assert
    expect((mockT as unknown as Mock).mock.calls.at(-1)?.[0]).toBe("{{years}}Years{{months}}Months");
  });

  it("handles string dates from server action serialization", () => {
    //* Arrange
    const dateStr = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

    //* Act
    const result = formatAccountAge(dateStr as unknown as Date, mockT);

    //* Assert
    expect(result).toBe("5Days");
    expect((mockT as unknown as Mock).mock.calls.at(-1)?.[1]).toEqual({ count: 5 });
  });
});
