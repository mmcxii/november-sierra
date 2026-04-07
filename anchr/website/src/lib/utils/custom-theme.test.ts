import { describe, expect, it } from "vitest";
import { PRESET_THEME_VARIABLES } from "../custom-themes";
import {
  autoVersionThemeName,
  deriveOgColorsFromVariables,
  deriveSwatchFromVariables,
  generateThemeName,
  isCustomThemeId,
  validateLightDarkToggles,
  variablesToInlineStyle,
} from "./custom-theme";

describe("deriveSwatchFromVariables", () => {
  it("returns correct accent, bg, and card from dark-depths variables", () => {
    //* Arrange
    const vars = PRESET_THEME_VARIABLES["dark-depths"];

    //* Act
    const swatch = deriveSwatchFromVariables(vars);

    //* Assert
    expect(swatch.accent).toBe("#d4b896");
    expect(swatch.bg).toBe("#050b14");
    expect(swatch.card).toBe("#111e2e"); // first color stop of gradient
  });

  it("handles gradient card-bg by extracting first color stop", () => {
    //* Arrange
    const vars = PRESET_THEME_VARIABLES.stateroom;

    //* Act
    const swatch = deriveSwatchFromVariables(vars);

    //* Assert
    expect(swatch.card).toBe("#fdfaf2"); // first stop of linear-gradient(160deg, #fdfaf2 0%, ...)
  });

  it("handles solid color card-bg", () => {
    //* Arrange
    const vars = { ...PRESET_THEME_VARIABLES["dark-depths"], "card-bg": "#ff0000" };

    //* Act
    const swatch = deriveSwatchFromVariables(vars);

    //* Assert
    expect(swatch.card).toBe("#ff0000");
  });
});

describe("deriveOgColorsFromVariables", () => {
  it("maps dark-depths variables to correct OG image fields", () => {
    //* Arrange
    const vars = PRESET_THEME_VARIABLES["dark-depths"];

    //* Act
    const og = deriveOgColorsFromVariables(vars);

    //* Assert
    expect(og.anchorColor).toBe("#d4b896");
    expect(og.avatarBg).toBe("#050b14");
    expect(og.avatarOuterRing).toBe("rgba(212, 184, 150, 0.30)");
    expect(og.nameColor).toBe("#ffffff");
    expect(og.ogBackground).toBe("#050b14");
  });
});

describe("generateThemeName", () => {
  it("returns 'Custom Theme 1' for empty array", () => {
    //* Arrange
    const existingNames: string[] = [];

    //* Act
    const name = generateThemeName(existingNames);

    //* Assert
    expect(name).toBe("Custom Theme 1");
  });

  it("skips taken numbers", () => {
    //* Arrange
    const existingNames = ["Custom Theme 1", "Custom Theme 2"];

    //* Act
    const name = generateThemeName(existingNames);

    //* Assert
    expect(name).toBe("Custom Theme 3");
  });

  it("fills gaps", () => {
    //* Arrange
    const existingNames = ["Custom Theme 1", "Custom Theme 3"];

    //* Act
    const name = generateThemeName(existingNames);

    //* Assert
    expect(name).toBe("Custom Theme 2");
  });
});

describe("autoVersionThemeName", () => {
  it("returns original name if available", () => {
    //* Arrange
    const existingNames = ["Other Theme"];

    //* Act
    const name = autoVersionThemeName("My Theme", existingNames);

    //* Assert
    expect(name).toBe("My Theme");
  });

  it("appends incrementing number on conflict", () => {
    //* Arrange
    const existingNames = ["My Theme"];

    //* Act
    const name = autoVersionThemeName("My Theme", existingNames);

    //* Assert
    expect(name).toBe("My Theme 1");
  });

  it("skips taken versions", () => {
    //* Arrange
    const existingNames = ["My Theme", "My Theme 1"];

    //* Act
    const name = autoVersionThemeName("My Theme", existingNames);

    //* Assert
    expect(name).toBe("My Theme 2");
  });
});

describe("validateLightDarkToggles", () => {
  it("accepts both enabled", () => {
    //* Arrange
    const light = true;
    const dark = true;

    //* Act
    const result = validateLightDarkToggles(light, dark);

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts light only", () => {
    //* Arrange
    const light = true;
    const dark = false;

    //* Act
    const result = validateLightDarkToggles(light, dark);

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts dark only", () => {
    //* Arrange
    const light = false;
    const dark = true;

    //* Act
    const result = validateLightDarkToggles(light, dark);

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects both disabled", () => {
    //* Arrange
    const light = false;
    const dark = false;

    //* Act
    const result = validateLightDarkToggles(light, dark);

    //* Assert
    expect(result).toBe(false);
  });
});

describe("isCustomThemeId", () => {
  it("returns false for preset theme IDs", () => {
    //* Arrange
    const presetIds = ["dark-depths", "stateroom", "obsidian", "seafoam"];

    //* Act
    const results = presetIds.map((id) => isCustomThemeId(id));

    //* Assert
    expect(results).toEqual([false, false, false, false]);
  });

  it("returns true for UUID strings", () => {
    //* Arrange
    const uuids = ["550e8400-e29b-41d4-a716-446655440000", "a1b2c3d4-e5f6-7890-abcd-ef1234567890"];

    //* Act
    const results = uuids.map((id) => isCustomThemeId(id));

    //* Assert
    expect(results).toEqual([true, true]);
  });

  it("returns false for empty string", () => {
    //* Arrange
    const id = "";

    //* Act
    const result = isCustomThemeId(id);

    //* Assert
    expect(result).toBe(false);
  });
});

describe("variablesToInlineStyle", () => {
  it("produces correct CSS variable names", () => {
    //* Arrange
    const vars = PRESET_THEME_VARIABLES["dark-depths"];

    //* Act
    const style = variablesToInlineStyle(vars);

    //* Assert
    expect(style["--anc-theme-anchor-color"]).toBe("#d4b896");
    expect(style["--anc-theme-name-color"]).toBe("#ffffff");
    expect(style["--anc-theme-card-bg"]).toBe(vars["card-bg"]);
  });

  it("has an entry for every variable key", () => {
    //* Arrange
    const vars = PRESET_THEME_VARIABLES.stateroom;

    //* Act
    const style = variablesToInlineStyle(vars);

    //* Assert
    expect(Object.keys(style)).toHaveLength(21);
  });
});
