import { describe, expect, it } from "vitest";
import { DAY_QUOTES, quoteForTeamDay, shuffledQuoteOrder } from "./quotes";

const startDate = "2026-09-01";

describe("DAY_QUOTES", () => {
  it("has 75 unique sourced lines", () => {
    //* Act
    const texts = DAY_QUOTES.map((quote) => {
      return quote.text;
    });

    //* Assert
    expect(texts).toHaveLength(75);
    expect(new Set(texts).size).toBe(75);
    expect(
      DAY_QUOTES.every((quote) => {
        return quote.author.length > 0 && quote.source.length > 0 && quote.text.length > 0;
      }),
    ).toBe(true);
    expect(
      DAY_QUOTES.every((quote) => {
        return quote.text.length <= 280;
      }),
    ).toBe(true);
  });
});

describe("quoteForTeamDay", () => {
  it("hides the quote before the start date", () => {
    //* Act
    const quote = quoteForTeamDay({ date: "2026-08-31", startDate, teamId: "team-a" });

    //* Assert
    expect(quote).toBeNull();
  });

  it("resolves day 1 and day 75", () => {
    //* Act
    const first = quoteForTeamDay({ date: "2026-09-01", startDate, teamId: "team-a" });
    const last = quoteForTeamDay({ date: "2026-11-14", startDate, teamId: "team-a" });
    const after = quoteForTeamDay({ date: "2026-11-15", startDate, teamId: "team-a" });

    //* Assert
    expect(first).not.toBeNull();
    expect(last).not.toBeNull();
    expect(after).toBeNull();
  });

  it("is stable for a team and differs across teams", () => {
    //* Act
    const first = quoteForTeamDay({ date: "2026-09-10", startDate, teamId: "team-a" });
    const again = quoteForTeamDay({ date: "2026-09-10", startDate, teamId: "team-a" });
    const other = quoteForTeamDay({ date: "2026-09-10", startDate, teamId: "team-b" });

    //* Assert
    expect(first).toEqual(again);
    expect(other).not.toEqual(first);
  });

  it("does not repeat a quote across one team’s 75 days", () => {
    //* Act
    const order = shuffledQuoteOrder("team-a");
    const texts = order.map((index) => {
      return DAY_QUOTES[index]?.text;
    });

    //* Assert
    expect(order).toHaveLength(75);
    expect(new Set(order).size).toBe(75);
    expect(new Set(texts).size).toBe(75);
  });
});
