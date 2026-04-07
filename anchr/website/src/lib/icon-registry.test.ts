import { describe, expect, it } from "vitest";
import { getEmojiCharacter, getIconEntry, parseIconId, searchIcons } from "./icon-registry";

describe("parseIconId", () => {
  it("parses an emoji icon ID", () => {
    //* Act
    const result = parseIconId("emoji:rocket");

    //* Assert
    expect(result).toEqual({ name: "rocket", provider: "emoji" });
  });

  it("parses a lucide icon ID", () => {
    //* Act
    const result = parseIconId("lucide:heart");

    //* Assert
    expect(result).toEqual({ name: "heart", provider: "lucide" });
  });

  it("parses a simple icon ID", () => {
    //* Act
    const result = parseIconId("si:github");

    //* Assert
    expect(result).toEqual({ name: "github", provider: "si" });
  });

  it("returns null for an invalid format", () => {
    //* Act
    const result = parseIconId("invalid");

    //* Assert
    expect(result).toBeNull();
  });

  it("returns null for an unknown provider", () => {
    //* Act
    const result = parseIconId("foo:bar");

    //* Assert
    expect(result).toBeNull();
  });

  it("returns null for a missing name", () => {
    //* Act
    const result = parseIconId("emoji:");

    //* Assert
    expect(result).toBeNull();
  });
});

describe("getEmojiCharacter", () => {
  it("returns the correct character for a known emoji", () => {
    //* Act
    const result = getEmojiCharacter("rocket");

    //* Assert
    expect(result).toBe("\u{1F680}");
  });

  it("returns undefined for an unknown emoji", () => {
    //* Act
    const result = getEmojiCharacter("nonexistent");

    //* Assert
    expect(result).toBeUndefined();
  });
});

describe("searchIcons", () => {
  it("includes emoji entries when searching with an empty query", () => {
    //* Act
    const results = searchIcons("");

    //* Assert
    const emojiResults = results.filter((r) => r.id.startsWith("emoji:"));
    expect(emojiResults.length).toBeGreaterThan(0);
    expect(results.length).toBeGreaterThanOrEqual(250);
  });

  it("includes emoji:rocket when searching for 'rocket'", () => {
    //* Act
    const results = searchIcons("rocket");

    //* Assert
    const ids = results.map((r) => r.id);
    expect(ids).toContain("emoji:rocket");
  });

  it("matches emoji keywords", () => {
    //* Act
    const results = searchIcons("trending");

    //* Assert
    const ids = results.map((r) => r.id);
    expect(ids).toContain("emoji:fire");
  });
});

describe("getIconEntry", () => {
  it("returns the correct entry for an emoji icon", () => {
    //* Act
    const entry = getIconEntry("emoji:rocket");

    //* Assert
    expect(entry).toEqual({
      category: "emoji",
      id: "emoji:rocket",
      keywords: ["launch", "startup", "space", "fast"],
      name: "Rocket",
    });
  });

  it("returns undefined for a nonexistent icon", () => {
    //* Act
    const entry = getIconEntry("emoji:nonexistent");

    //* Assert
    expect(entry).toBeUndefined();
  });
});
