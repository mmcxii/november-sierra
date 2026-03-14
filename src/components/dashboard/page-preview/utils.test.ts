import { THEMES } from "@/components/marketing/link-page-mockup/constants";
import { describe, expect, it } from "vitest";
import { getCardTheme } from "./utils";

describe("getCardTheme", () => {
  it("returns Dark Depths for 'minimal'", () => {
    //* Act
    const result = getCardTheme("minimal");

    //* Assert
    expect(result.themeName).toBe("Dark Depths");
    expect(result).toBe(THEMES[0]);
  });

  it("returns Stateroom for 'stateroom'", () => {
    //* Act
    const result = getCardTheme("stateroom");

    //* Assert
    expect(result.themeName).toBe("Stateroom");
    expect(result).toBe(THEMES[1]);
  });

  it("returns Obsidian for 'obsidian'", () => {
    //* Act
    const result = getCardTheme("obsidian");

    //* Assert
    expect(result.themeName).toBe("Obsidian");
    expect(result).toBe(THEMES[2]);
  });

  it("returns Seafoam for 'seafoam'", () => {
    //* Act
    const result = getCardTheme("seafoam");

    //* Assert
    expect(result.themeName).toBe("Seafoam");
    expect(result).toBe(THEMES[3]);
  });

  it("falls back to Dark Depths for unknown theme ID", () => {
    //* Act
    const result = getCardTheme("unknown");

    //* Assert
    expect(result.themeName).toBe("Dark Depths");
    expect(result).toBe(THEMES[0]);
  });
});
