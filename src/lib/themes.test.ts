import { describe, expect, it } from "vitest";
import { DEFAULT_THEME_ID, THEMES, THEME_IDS, getTheme, isValidThemeId } from "./themes";

describe("getTheme", () => {
  it("returns the correct theme for a known ID", () => {
    //* Arrange
    const id = "obsidian";

    //* Act
    const result = getTheme(id);

    //* Assert
    expect(result).toBe(THEMES.obsidian);
  });

  it("falls back to the default theme for an unknown ID", () => {
    //* Act
    const result = getTheme("nonexistent");

    //* Assert
    expect(result).toBe(THEMES[DEFAULT_THEME_ID]);
  });
});

describe("isValidThemeId", () => {
  it("returns true for valid theme IDs", () => {
    //* Act
    const results = THEME_IDS.map((id) => isValidThemeId(id));

    //* Assert
    for (const result of results) {
      expect(result).toBe(true);
    }
  });

  it("returns false for invalid theme IDs", () => {
    //* Act
    const nonexistent = isValidThemeId("nonexistent");
    const empty = isValidThemeId("");

    //* Assert
    expect(nonexistent).toBe(false);
    expect(empty).toBe(false);
  });
});

describe("theme completeness", () => {
  it("every theme has all required properties", () => {
    //* Arrange
    const requiredKeys: (keyof (typeof THEMES)[typeof DEFAULT_THEME_ID])[] = [
      "anchorColor",
      "avatarBg",
      "avatarOuterRing",
      "name",
      "nameColor",
      "ogBackground",
      "preview",
    ];

    //* Act
    const values = THEME_IDS.flatMap((id) => requiredKeys.map((key) => THEMES[id][key]));

    //* Assert
    for (const value of values) {
      expect(value).toBeDefined();
    }
  });

  it("THEME_IDS matches the keys of THEMES", () => {
    //* Act
    const themeKeys = Object.keys(THEMES).sort();
    const idsSorted = [...THEME_IDS].sort();

    //* Assert
    expect(idsSorted).toEqual(themeKeys);
  });
});
