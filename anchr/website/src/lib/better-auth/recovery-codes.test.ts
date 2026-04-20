import { describe, expect, it } from "vitest";
import { generateRecoveryCode, normalizeRecoveryCode } from "./recovery-code-format";

describe("recovery code format", () => {
  it("generates 11-char XXXXX-XXXXX codes from Crockford base32", () => {
    //* Arrange
    //* Act
    const code = generateRecoveryCode();

    //* Assert
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{5}-[0-9A-HJKMNP-TV-Z]{5}$/);
  });

  it("produces distinct codes on repeated calls", () => {
    //* Arrange
    const sampleSize = 50;

    //* Act
    const codes = new Set(Array.from({ length: sampleSize }, () => generateRecoveryCode()));

    //* Assert
    // 50 random codes from 32^10 space collide with negligible probability.
    expect(codes.size).toBe(sampleSize);
  });

  it("normalizes input to uppercase, strips spaces and hyphens", () => {
    //* Arrange
    const cases = [
      { expected: "ABCDE12345", input: "abcde-12345" },
      { expected: "ABCDE12345", input: "  abcde 12345  " },
      { expected: "ABCDE12345", input: "ABCDE-12345" },
    ];

    //* Act
    const actual = cases.map((c) => ({ expected: c.expected, result: normalizeRecoveryCode(c.input) }));

    //* Assert
    for (const c of actual) {
      expect(c.result).toBe(c.expected);
    }
  });
});
