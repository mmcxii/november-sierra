import { describe, expect, it } from "vitest";
import { linkSchema } from "./link";

describe("linkSchema", () => {
  it("accepts a URL with https protocol", () => {
    //* Arrange
    const input = { title: "Test", url: "https://x.com" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a URL without protocol", () => {
    //* Arrange
    const input = { title: "Test", url: "x.com" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts a URL with http protocol", () => {
    //* Arrange
    const input = { title: "Test", url: "http://example.com" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects an empty url", () => {
    //* Arrange
    const input = { title: "Test", url: "" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects an invalid url", () => {
    //* Arrange
    const input = { title: "Test", url: "not a url" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects an empty title", () => {
    //* Arrange
    const input = { title: "", url: "https://x.com" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a title exceeding 100 characters", () => {
    //* Arrange
    const input = { title: "a".repeat(101), url: "https://x.com" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a javascript: URL", () => {
    //* Arrange
    const input = { title: "Test", url: "javascript:alert(1)" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects a data: URL", () => {
    //* Arrange
    const input = { title: "Test", url: "data:text/html,<h1>hi</h1>" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects an anchr.to URL", () => {
    //* Arrange
    const input = { title: "Test", url: "https://anchr.to/someone" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects anchr.to without protocol", () => {
    //* Arrange
    const input = { title: "Test", url: "anchr.to/someone" };

    //* Act
    const result = linkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });
});
