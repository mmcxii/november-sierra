import { describe, expect, it } from "vitest";
import {
  generateCssScaffold,
  parseCssToThemeState,
  updateProPropertyInCss,
  updateVariableInCss,
} from "./css-theme-sync";
import { PRESET_THEME_VARIABLES } from "./custom-themes";

const darkDepths = PRESET_THEME_VARIABLES["dark-depths"];

describe("generateCssScaffold", () => {
  it("generates a scaffold with all 21 variables grouped by section", () => {
    //* Arrange — use dark-depths preset

    //* Act
    const result = generateCssScaffold(darkDepths);

    //* Assert
    expect(result).toContain("/* === Theme Values === */");
    expect(result).toContain("/* === End Theme Values === */");
    expect(result).toContain("/* Page */");
    expect(result).toContain("/* Card */");
    expect(result).toContain("/* Avatar */");
    expect(result).toContain("/* Featured link */");
    expect(result).toContain("/* Links */");
    expect(result).toContain("/* Display name */");
    expect(result).toContain(`--anc-theme-anchor-color: ${darkDepths["anchor-color"]};`);
    expect(result).toContain(`--anc-theme-name-color: ${darkDepths["name-color"]};`);
    expect(result).toContain(".anchr-page {");
  });

  it("includes font when provided", () => {
    //* Act
    const result = generateCssScaffold(darkDepths, { font: "Inter" });

    //* Assert
    expect(result).toContain('font-family: "Inter", var(--anc-font-sans);');
    expect(result).toContain("/* Typography */");
  });

  it("includes border radius when provided", () => {
    //* Act
    const result = generateCssScaffold(darkDepths, { borderRadius: 16 });

    //* Assert
    expect(result).toContain("--anc-theme-border-radius: 16px;");
  });

  it("includes background image when provided", () => {
    //* Act
    const result = generateCssScaffold(darkDepths, { backgroundImage: "https://example.com/bg.jpg" });

    //* Assert
    expect(result).toContain('background-image: url("https://example.com/bg.jpg");');
  });

  it("includes overlay properties when provided", () => {
    //* Act
    const result = generateCssScaffold(darkDepths, { overlayColor: "#000000", overlayOpacity: 0.5 });

    //* Assert
    expect(result).toContain("--anc-theme-overlay-color: #000000;");
    expect(result).toContain("--anc-theme-overlay-opacity: 0.5;");
  });

  it("includes commented .anchr- class reference", () => {
    //* Act
    const result = generateCssScaffold(darkDepths);

    //* Assert
    expect(result).toContain(".anchr-page { }  — full page background");
    expect(result).toContain(".anchr-avatar { }  — inner avatar circle");
    expect(result).toContain(".anchr-link { }  — link card");
    expect(result).toContain(".anchr-footer { }  — page footer");
    expect(result).toContain(".anchr-overlay { }  — background image overlay");
  });

  it("omits font section when font is null", () => {
    //* Act
    const result = generateCssScaffold(darkDepths, { font: null });

    //* Assert
    expect(result).not.toContain("/* Typography */");
    expect(result).not.toContain("font-family");
  });
});

describe("parseCssToThemeState", () => {
  it("extracts all 21 theme variables from a scaffold", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths);

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.variables["anchor-color"]).toBe(darkDepths["anchor-color"]);
    expect(result.variables["name-color"]).toBe(darkDepths["name-color"]);
    expect(result.variables["card-bg"]).toBe(darkDepths["card-bg"]);
    expect(Object.keys(result.variables)).toHaveLength(21);
  });

  it("extracts font-family", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { font: "Roboto" });

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.pro.font).toBe("Roboto");
  });

  it("extracts border radius", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { borderRadius: 20 });

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.pro.borderRadius).toBe(20);
  });

  it("extracts background image", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { backgroundImage: "https://example.com/bg.jpg" });

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.pro.backgroundImage).toBe("https://example.com/bg.jpg");
  });

  it("extracts overlay properties", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { overlayColor: "#112233", overlayOpacity: 0.7 });

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.pro.overlayColor).toBe("#112233");
    expect(result.pro.overlayOpacity).toBe(0.7);
  });

  it("ignores content outside the demarcated block", () => {
    //* Arrange
    const css = `
.anchr-link { color: red; }
/* === Theme Values === */
.anchr-page {
  --anc-theme-name-color: #ff0000;
}
/* === End Theme Values === */
.anchr-avatar { border: 1px solid blue; }
`;

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.variables["name-color"]).toBe("#ff0000");
    expect(Object.keys(result.variables)).toHaveLength(1);
  });

  it("returns empty state when markers are missing", () => {
    //* Arrange
    const css = `.anchr-page { --anc-theme-name-color: #ff0000; }`;

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(Object.keys(result.variables)).toHaveLength(0);
  });

  it("handles gradient values correctly", () => {
    //* Arrange
    const css = `/* === Theme Values === */
.anchr-page {
  --anc-theme-card-bg: linear-gradient(160deg, #111e2e 0%, #080f1c 55%, #050b14 100%);
}
/* === End Theme Values === */`;

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.variables["card-bg"]).toBe("linear-gradient(160deg, #111e2e 0%, #080f1c 55%, #050b14 100%)");
  });

  it("passes through invalid values as-is", () => {
    //* Arrange
    const css = `/* === Theme Values === */
.anchr-page {
  --anc-theme-name-color: ref;
}
/* === End Theme Values === */`;

    //* Act
    const result = parseCssToThemeState(css);

    //* Assert
    expect(result.variables["name-color"]).toBe("ref");
  });
});

describe("updateVariableInCss", () => {
  it("replaces a single variable value without affecting others", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths);

    //* Act
    const result = updateVariableInCss(css, "name-color", "#ff0000");

    //* Assert
    expect(result).toContain("--anc-theme-name-color: #ff0000;");
    expect(result).toContain(`--anc-theme-anchor-color: ${darkDepths["anchor-color"]};`);
  });

  it("handles gradient value replacement", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths);

    //* Act
    const newGradient = "linear-gradient(180deg, #aaa 0%, #bbb 100%)";
    const result = updateVariableInCss(css, "card-bg", newGradient);

    //* Assert
    expect(result).toContain(`--anc-theme-card-bg: ${newGradient};`);
  });

  it("preserves content outside the synced block", () => {
    //* Arrange
    const scaffold = generateCssScaffold(darkDepths);
    const css = scaffold + "\n.anchr-link { box-shadow: 0 2px 4px rgba(0,0,0,0.2); }";

    //* Act
    const result = updateVariableInCss(css, "name-color", "#00ff00");

    //* Assert
    expect(result).toContain("box-shadow: 0 2px 4px rgba(0,0,0,0.2)");
    expect(result).toContain("--anc-theme-name-color: #00ff00;");
  });

  it("appends variable if missing from block", () => {
    //* Arrange
    const css = `/* === Theme Values === */
.anchr-page {
  --anc-theme-anchor-color: #d4b896;
}
/* === End Theme Values === */`;

    //* Act
    const result = updateVariableInCss(css, "name-color", "#ffffff");

    //* Assert
    expect(result).toContain("--anc-theme-name-color: #ffffff;");
    expect(result).toContain("--anc-theme-anchor-color: #d4b896;");
  });

  it("returns CSS unchanged when markers are missing", () => {
    //* Arrange
    const css = `.anchr-page { --anc-theme-name-color: #ff0000; }`;

    //* Act
    const result = updateVariableInCss(css, "name-color", "#00ff00");

    //* Assert
    expect(result).toBe(css);
  });
});

describe("updateProPropertyInCss", () => {
  it("updates font-family value", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { font: "Inter" });

    //* Act
    const result = updateProPropertyInCss(css, "font", "Roboto");

    //* Assert
    expect(result).toContain('"Roboto"');
    expect(result).not.toContain('"Inter"');
  });

  it("updates border radius value", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { borderRadius: 12 });

    //* Act
    const result = updateProPropertyInCss(css, "borderRadius", 20);

    //* Assert
    expect(result).toContain("--anc-theme-border-radius: 20px;");
    expect(result).not.toContain("12px");
  });

  it("updates background image", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { backgroundImage: "https://old.com/bg.jpg" });

    //* Act
    const result = updateProPropertyInCss(css, "backgroundImage", "https://new.com/bg.jpg");

    //* Assert
    expect(result).toContain("https://new.com/bg.jpg");
    expect(result).not.toContain("https://old.com/bg.jpg");
  });

  it("updates overlay color", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths, { overlayColor: "#000000" });

    //* Act
    const result = updateProPropertyInCss(css, "overlayColor", "#ff0000");

    //* Assert
    expect(result).toContain("--anc-theme-overlay-color: #ff0000;");
  });

  it("appends property if not present", () => {
    //* Arrange
    const css = generateCssScaffold(darkDepths);

    //* Act
    const result = updateProPropertyInCss(css, "font", "Montserrat");

    //* Assert
    expect(result).toContain('"Montserrat"');
  });
});
