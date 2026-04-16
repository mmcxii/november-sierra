import { describe, expect, it } from "vitest";
import { bulkCreateShortLinksSchema, createShortLinkSchema, updateShortLinkSchema } from "./short-link";

describe("createShortLinkSchema", () => {
  it("accepts a minimal valid input with only url", () => {
    //* Arrange
    const input = { url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts full input with all optional fields", () => {
    //* Arrange
    const input = {
      customSlug: "my-link",
      expiresAt: "2026-12-31T23:59:59Z",
      password: "secret123",
      url: "https://example.com/long-path",
    };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty url", () => {
    //* Arrange
    const input = { url: "" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects missing url", () => {
    //* Arrange
    const input = {};

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects customSlug with uppercase letters", () => {
    //* Arrange
    const input = { customSlug: "MyLink", url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects customSlug with spaces", () => {
    //* Arrange
    const input = { customSlug: "my link", url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("accepts customSlug with hyphens and numbers", () => {
    //* Arrange
    const input = { customSlug: "my-link-123", url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects customSlug exceeding 100 characters", () => {
    //* Arrange
    const input = { customSlug: "a".repeat(101), url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects invalid expiresAt format", () => {
    //* Arrange
    const input = { expiresAt: "not-a-date", url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects unknown fields (strict mode)", () => {
    //* Arrange
    const input = { title: "test", url: "https://example.com" };

    //* Act
    const result = createShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });
});

describe("updateShortLinkSchema", () => {
  it("accepts empty object (no changes)", () => {
    //* Arrange
    const input = {};

    //* Act
    const result = updateShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts url-only update", () => {
    //* Arrange
    const input = { url: "https://new-url.com" };

    //* Act
    const result = updateShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts null customSlug to remove", () => {
    //* Arrange
    const input = { customSlug: null };

    //* Act
    const result = updateShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts null expiresAt to remove", () => {
    //* Arrange
    const input = { expiresAt: null };

    //* Act
    const result = updateShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts null password to remove", () => {
    //* Arrange
    const input = { password: null };

    //* Act
    const result = updateShortLinkSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });
});

describe("bulkCreateShortLinksSchema", () => {
  it("accepts array of url objects", () => {
    //* Arrange
    const input = {
      urls: [{ url: "https://example.com" }, { url: "https://test.com" }],
    };

    //* Act
    const result = bulkCreateShortLinksSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty array", () => {
    //* Arrange
    const input = { urls: [] };

    //* Act
    const result = bulkCreateShortLinksSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects more than 50 urls", () => {
    //* Arrange
    const urls = Array.from({ length: 51 }, (_, i) => {
      return { url: `https://example${i}.com` };
    });
    const input = { urls };

    //* Act
    const result = bulkCreateShortLinksSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects urls with empty string", () => {
    //* Arrange
    const input = { urls: [{ url: "" }] };

    //* Act
    const result = bulkCreateShortLinksSchema.safeParse(input);

    //* Assert
    expect(result.success).toBe(false);
  });
});
