import { THEMES, THEME_CSS_VARS } from "@/components/marketing/link-page-mockup/constants";
import { describe, expect, it } from "vitest";
import { getCardTheme, getThemeStyle } from "./utils";

describe("getCardTheme", () => {
  it("returns matching theme for a known ID", () => {
    //* Arrange
    const theme = THEMES[2];

    //* Act
    const result = getCardTheme(theme.id);

    //* Assert
    expect(result).toBe(theme);
  });

  it("falls back to the first theme for an unknown ID", () => {
    //* Act
    const result = getCardTheme("nonexistent");

    //* Assert
    expect(result).toBe(THEMES[0]);
  });
});

describe("getThemeStyle", () => {
  it("returns a CSS variable entry for every key in THEME_CSS_VARS", () => {
    //* Arrange
    const theme = THEMES[0];

    //* Act
    const style = getThemeStyle(theme);

    //* Assert
    const cssVarNames = Object.keys(THEME_CSS_VARS);
    expect(Object.keys(style)).toEqual(expect.arrayContaining(cssVarNames));
    expect(Object.keys(style)).toHaveLength(cssVarNames.length);
  });

  it("maps each CSS variable to the correct theme value", () => {
    //* Arrange
    const theme = THEMES[1];

    //* Act
    const style = getThemeStyle(theme);

    //* Assert
    for (const [cssVar, key] of Object.entries(THEME_CSS_VARS)) {
      expect(style[cssVar]).toBe(theme[key]);
    }
  });
});
