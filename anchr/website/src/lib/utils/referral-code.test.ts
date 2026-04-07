import { describe, expect, it } from "vitest";
import { generateReferralCode } from "./referral-code";

describe("generateReferralCode", () => {
  it("returns a code in PREFIX-XXXXXX format", () => {
    //* Act
    const code = generateReferralCode("ANCHR");

    //* Assert
    expect(code).toMatch(/^ANCHR-[A-Z0-9]{6}$/);
  });

  it("uses the provided prefix", () => {
    //* Act
    const code = generateReferralCode("TEST");

    //* Assert
    expect(code.startsWith("TEST-")).toBe(true);
  });

  it("excludes ambiguous characters (0, 1, I, O)", () => {
    //* Arrange
    const codes = Array.from({ length: 100 }, () => generateReferralCode("X"));
    const suffixes = codes.map((c) => c.split("-")[1]);

    //* Act
    const allChars = suffixes.join("");

    //* Assert
    expect(allChars).not.toMatch(/[01IO]/);
  });

  it("generates unique codes across calls", () => {
    //* Act
    const codes = new Set(Array.from({ length: 50 }, () => generateReferralCode("ANCHR")));

    //* Assert
    expect(codes.size).toBeGreaterThan(1);
  });
});
