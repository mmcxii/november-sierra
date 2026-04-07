import { describe, expect, it } from "vitest";
import { PRESET_THEME_VARIABLES, THEME_VARIABLE_KEYS, type ThemeVariableKey } from "./custom-themes";
import { THEME_IDS } from "./themes";

describe("THEME_VARIABLE_KEYS", () => {
  it("has exactly 21 entries", () => {
    //* Arrange — THEME_VARIABLE_KEYS is imported at module level

    //* Act
    const length = THEME_VARIABLE_KEYS.length;

    //* Assert
    expect(length).toBe(21);
  });

  it("contains all expected variable names", () => {
    //* Arrange
    const expected: ThemeVariableKey[] = [
      "anchor-color",
      "avatar-bg",
      "avatar-inner-border",
      "avatar-outer-ring",
      "border",
      "brand",
      "card-bg",
      "divider",
      "featured-bg",
      "featured-border",
      "featured-icon-bg",
      "featured-icon-color",
      "featured-text",
      "glow-bg",
      "hairline",
      "link-bg",
      "link-border",
      "link-icon-bg",
      "link-icon-color",
      "link-text",
      "name-color",
    ];

    //* Act
    const actual = THEME_VARIABLE_KEYS;

    //* Assert
    expect(actual).toEqual(expected);
  });
});

describe("PRESET_THEME_VARIABLES", () => {
  it("has entries for all 4 preset themes", () => {
    //* Arrange — PRESET_THEME_VARIABLES and THEME_IDS are imported at module level

    //* Act
    const keys = Object.keys(PRESET_THEME_VARIABLES);

    //* Assert
    for (const id of THEME_IDS) {
      expect(keys).toContain(id);
    }
  });

  it("each preset has all 21 variable keys populated", () => {
    //* Arrange — PRESET_THEME_VARIABLES and THEME_VARIABLE_KEYS are imported at module level

    //* Act
    const results = THEME_IDS.map((id) => ({
      id,
      vars: PRESET_THEME_VARIABLES[id],
    }));

    //* Assert
    for (const { id, vars } of results) {
      for (const key of THEME_VARIABLE_KEYS) {
        expect(vars[key], `${id} missing ${key}`).toBeDefined();
        expect(typeof vars[key], `${id}.${key} should be a string`).toBe("string");
        expect(vars[key].length, `${id}.${key} should not be empty`).toBeGreaterThan(0);
      }
    }
  });
});
