import { describe, expect, it } from "vitest";
import { PRESET_THEME_VARIABLES } from "../custom-themes";
import { customThemeSchema } from "./custom-theme";

describe("customThemeSchema", () => {
  const validData = {
    name: "My Theme",
    variables: PRESET_THEME_VARIABLES["dark-depths"],
  };

  it("accepts valid minimal data", () => {
    //* Act
    const result = customThemeSchema.safeParse(validData);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("accepts valid data with all optional fields", () => {
    //* Arrange
    const data = {
      ...validData,
      backgroundImage: "https://utfs.io/f/abc123.jpg",
      borderRadius: 12,
      font: "Inter",
      overlayColor: "#000000",
      overlayOpacity: 0.5,
      rawCss: ".anchr-page { color: red; }",
    };

    //* Act
    const result = customThemeSchema.safeParse(data);

    //* Assert
    expect(result.success).toBe(true);
  });

  it("rejects empty name", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, name: "" });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects name longer than 30 characters", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, name: "a".repeat(31) });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects opacity below 0", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, overlayOpacity: -0.1 });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects opacity above 1", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, overlayOpacity: 1.1 });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects negative border radius", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, borderRadius: -1 });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects border radius above 50", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, borderRadius: 51 });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects rawCss longer than 10000 characters", () => {
    //* Act
    const result = customThemeSchema.safeParse({ ...validData, rawCss: "x".repeat(10001) });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects variables with missing keys", () => {
    //* Arrange
    const incomplete = { "anchor-color": "#ff0000" };

    //* Act
    const result = customThemeSchema.safeParse({ ...validData, variables: incomplete });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects variables with unknown extra keys", () => {
    //* Arrange
    const withExtra = { ...PRESET_THEME_VARIABLES["dark-depths"], "unknown-key": "#ff0000" };

    //* Act
    const result = customThemeSchema.safeParse({ ...validData, variables: withExtra });

    //* Assert
    expect(result.success).toBe(false);
  });

  it("rejects variables with empty string values", () => {
    //* Arrange
    const withEmpty = { ...PRESET_THEME_VARIABLES["dark-depths"], "anchor-color": "" };

    //* Act
    const result = customThemeSchema.safeParse({ ...validData, variables: withEmpty });

    //* Assert
    expect(result.success).toBe(false);
  });
});
