import { describe, expect, it } from "vitest";
import { RESERVED_USERNAMES, usernameSchema } from "./username";

const parse = (username: string) => usernameSchema.shape.username.safeParse(username);

describe("usernameSchema", () => {
  it("accepts a valid lowercase alphanumeric username", () => {
    //* Arrange
    const username = "johndoe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a username with underscores", () => {
    //* Arrange
    const username = "john_doe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a username starting with a digit", () => {
    //* Arrange
    const username = "1johndoe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a single character username", () => {
    //* Arrange
    const username = "a";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a 30-character username", () => {
    //* Arrange
    const username = "a".repeat(30);

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty string", () => {
    //* Arrange
    const username = "";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a username exceeding 30 characters", () => {
    //* Arrange
    const username = "a".repeat(31);

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects uppercase letters", () => {
    //* Arrange
    const username = "JohnDoe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a username starting with an underscore", () => {
    //* Arrange
    const username = "_johndoe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a username with hyphens", () => {
    //* Arrange
    const username = "john-doe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a username with spaces", () => {
    //* Arrange
    const username = "john doe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a username with special characters", () => {
    //* Arrange
    const username = "john@doe";

    //* Act
    const result = parse(username);

    //* Assert
    expect(result.success).toBe(false);
  });

  it.each(RESERVED_USERNAMES)("rejects reserved username '%s'", (reserved) => {
    //* Act
    const result = parse(reserved);

    //* Assert
    expect(result.success).toBe(false);
  });
});
