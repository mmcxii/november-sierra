import { describe, expect, it } from "vitest";
import { groupSchema } from "./link-group";

describe("groupSchema", () => {
  it("accepts a valid group title", () => {
    //* Arrange
    const input = { title: "My Links" };

    //* Act
    const result = groupSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a single character title", () => {
    //* Arrange
    const input = { title: "A" };

    //* Act
    const result = groupSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a 100-character title", () => {
    //* Arrange
    const input = { title: "a".repeat(100) };

    //* Act
    const result = groupSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty title", () => {
    //* Arrange
    const input = { title: "" };

    //* Act
    const result = groupSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a title exceeding 100 characters", () => {
    //* Arrange
    const input = { title: "a".repeat(101) };

    //* Act
    const result = groupSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });
});
