import { describe, expect, it } from "vitest";
import {
  DARK_THEME_IDS,
  DARK_THEME_ID_LIST,
  DEFAULT_THEME_ID,
  LIGHT_THEME_ID_LIST,
  THEMES,
  THEME_IDS,
  getTheme,
  isDarkTheme,
  isValidThemeId,
} from "./themes";

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

describe("isDarkTheme", () => {
  it("returns true for dark theme IDs", () => {
    //* Act
    const results = DARK_THEME_ID_LIST.map((id) => isDarkTheme(id));

    //* Assert
    for (const result of results) {
      expect(result).toBe(true);
    }
  });

  it("returns false for light theme IDs", () => {
    //* Act
    const results = LIGHT_THEME_ID_LIST.map((id) => isDarkTheme(id));

    //* Assert
    for (const result of results) {
      expect(result).toBe(false);
    }
  });
});

describe("theme lists", () => {
  it("DARK_THEME_ID_LIST and LIGHT_THEME_ID_LIST are exhaustive", () => {
    //* Act
    const combined = [...DARK_THEME_ID_LIST, ...LIGHT_THEME_ID_LIST].sort();
    const allIds = [...THEME_IDS].sort();

    //* Assert
    expect(combined).toEqual(allIds);
  });

  it("DARK_THEME_ID_LIST and LIGHT_THEME_ID_LIST are disjoint", () => {
    //* Act
    const overlap = DARK_THEME_ID_LIST.filter((id) => LIGHT_THEME_ID_LIST.includes(id));

    //* Assert
    expect(overlap).toEqual([]);
  });

  it("DARK_THEME_ID_LIST matches DARK_THEME_IDS set", () => {
    //* Act
    const listSize = DARK_THEME_ID_LIST.length;
    const setSize = DARK_THEME_IDS.size;

    //* Assert
    expect(listSize).toBe(setSize);
    for (const id of DARK_THEME_ID_LIST) {
      expect(DARK_THEME_IDS.has(id)).toBe(true);
    }
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
      "swatch",
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
