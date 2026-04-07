import { describe, expect, it } from "vitest";
import { updateProfileSchema } from "./profile";

describe("updateProfileSchema", () => {
  it("accepts valid input", () => {
    //* Act
    const result = updateProfileSchema.safeParse({ bio: "Hello", displayName: "Nick" });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts empty object", () => {
    //* Act
    const result = updateProfileSchema.safeParse({});

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts theme fields", () => {
    //* Act
    const result = updateProfileSchema.safeParse({
      pageDarkTheme: "dark-depths",
      pageLightTheme: "stateroom",
    });

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects bio over 500 chars", () => {
    //* Act
    const result = updateProfileSchema.safeParse({ bio: "a".repeat(501) });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects displayName over 100 chars", () => {
    //* Act
    const result = updateProfileSchema.safeParse({ displayName: "a".repeat(101) });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (strict)", () => {
    //* Act
    const result = updateProfileSchema.safeParse({ email: "bad@test.com" });

    //* Assert
    expect(result.success).toBe(false);
  });
});
