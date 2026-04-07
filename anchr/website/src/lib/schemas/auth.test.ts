import { describe, expect, it } from "vitest";
import { verifyEmailSchema } from "./auth";

describe("verifyEmailSchema", () => {
  it("accepts a valid 6-digit code", () => {
    //* Arrange
    const input = { code: "123456" };

    //* Act
    const result = verifyEmailSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty string", () => {
    //* Arrange
    const input = { code: "" };

    //* Act
    const result = verifyEmailSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects fewer than 6 digits", () => {
    //* Arrange
    const input = { code: "12345" };

    //* Act
    const result = verifyEmailSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects more than 6 digits", () => {
    //* Arrange
    const input = { code: "1234567" };

    //* Act
    const result = verifyEmailSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects non-numeric characters", () => {
    //* Arrange
    const input = { code: "12a456" };

    //* Act
    const result = verifyEmailSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a code with spaces", () => {
    //* Arrange
    const input = { code: "123 56" };

    //* Act
    const result = verifyEmailSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });
});
