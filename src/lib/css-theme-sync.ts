import { SECTIONS } from "@/components/dashboard/theme-studio-content/constants";
import { THEME_VARIABLE_PREFIX, type ThemeVariableKey, type ThemeVariables } from "./custom-themes";

// ── Constants ────────────────────────────────────────────────────────────────

const SYNC_START = "/* === Theme Values === */";
const SYNC_END = "/* === End Theme Values === */";

/** All available .anchr- classes with plain-language descriptions. */
const ANCHR_CLASSES: readonly { cls: string; desc: string }[] = [
  { cls: ".anchr-page", desc: "full page background" },
  { cls: ".anchr-hairline", desc: "top accent line" },
  { cls: ".anchr-glow", desc: "radial glow effect" },
  { cls: ".anchr-wave", desc: "wave texture pattern" },
  { cls: ".anchr-profile-header", desc: "profile section wrapper" },
  { cls: ".anchr-avatar-ring", desc: "outer avatar ring" },
  { cls: ".anchr-avatar", desc: "inner avatar circle" },
  { cls: ".anchr-avatar-img", desc: "profile picture" },
  { cls: ".anchr-display-name", desc: "profile name heading" },
  { cls: ".anchr-bio", desc: "bio text" },
  { cls: ".anchr-quick-links", desc: "quick links row" },
  { cls: ".anchr-quick-link", desc: "quick link button" },
  { cls: ".anchr-quick-link-icon", desc: "quick link icon" },
  { cls: ".anchr-link-list", desc: "links container" },
  { cls: ".anchr-featured-link", desc: "featured link card" },
  { cls: ".anchr-featured-link-icon-bg", desc: "featured link icon background" },
  { cls: ".anchr-featured-link-icon", desc: "featured link icon" },
  { cls: ".anchr-featured-link-text", desc: "featured link title" },
  { cls: ".anchr-link", desc: "link card" },
  { cls: ".anchr-link-icon-bg", desc: "link icon background" },
  { cls: ".anchr-link-icon", desc: "link icon" },
  { cls: ".anchr-link-text", desc: "link title" },
  { cls: ".anchr-copy-btn", desc: "copy button" },
  { cls: ".anchr-group-header", desc: "link group heading" },
  { cls: ".anchr-footer", desc: "page footer" },
  { cls: ".anchr-brand", desc: "Anchr branding" },
  { cls: ".anchr-theme-toggle", desc: "light/dark toggle" },
  { cls: ".anchr-overlay", desc: "background image overlay" },
] as const;

// ── Types ────────────────────────────────────────────────────────────────────

export type ThemeProProperties = {
  backgroundImage?: null | string;
  borderRadius?: null | number;
  font?: null | string;
  overlayColor?: null | string;
  overlayOpacity?: null | number;
};

export type ParsedThemeState = {
  pro: ThemeProProperties;
  variables: Partial<ThemeVariables>;
};

// ── Scaffold Generator ───────────────────────────────────────────────────────

/**
 * Generate the full CSS scaffold including the synced variable block and
 * the commented-out class reference.
 */
export function generateCssScaffold(variables: ThemeVariables, pro: ThemeProProperties = {}): string {
  const lines: string[] = [];

  lines.push(SYNC_START);
  lines.push(".anchr-page {");

  // Group variables by section
  const sectionLabels: Record<string, string> = {
    Accent: "Branding",
    "Display name": "Display name",
    Featured: "Featured link",
    "Link icons": "Links",
  };

  for (const section of SECTIONS) {
    const label = sectionLabels[section.title] ?? section.title;
    lines.push(`  /* ${label} */`);
    for (const field of section.fields) {
      const key = field.key as ThemeVariableKey;
      lines.push(`  ${THEME_VARIABLE_PREFIX}${key}: ${variables[key]};`);
    }
    lines.push("");
  }

  // Typography
  if (pro.font != null && pro.font.trim() !== "") {
    lines.push("  /* Typography */");
    lines.push(`  font-family: "${pro.font}", var(--anc-font-sans);`);
    lines.push("");
  }

  // Border Radius
  if (pro.borderRadius != null) {
    lines.push("  /* Border Radius */");
    lines.push(`  --anc-theme-border-radius: ${pro.borderRadius}px;`);
    lines.push("");
  }

  // Background
  if (pro.backgroundImage != null && pro.backgroundImage.trim() !== "") {
    lines.push("  /* Background */");
    lines.push(`  background-image: url("${pro.backgroundImage}");`);
    lines.push("");
  }

  // Overlay
  if (pro.overlayColor != null || pro.overlayOpacity != null) {
    lines.push("  /* Overlay */");
    if (pro.overlayColor != null) {
      lines.push(`  --anc-theme-overlay-color: ${pro.overlayColor};`);
    }
    if (pro.overlayOpacity != null) {
      lines.push(`  --anc-theme-overlay-opacity: ${pro.overlayOpacity};`);
    }
    lines.push("");
  }

  lines.push("}");
  lines.push(SYNC_END);
  lines.push("");
  lines.push("/* Add your own styles below — uncomment any line to get started */");

  for (const { cls, desc } of ANCHR_CLASSES) {
    lines.push(`/* ${cls} { }  — ${desc} */`);
  }

  return lines.join("\n");
}

// ── CSS Parser (CSS → UI) ────────────────────────────────────────────────────

/** Regex to match --anc-theme-<key>: <value>; inside the synced block */
const VARIABLE_PATTERN = /--anc-theme-([\w-]+)\s*:\s*([^;]+);/g;

/** Regex to extract font-family value */
const FONT_PATTERN = /font-family\s*:\s*"([^"]+)"/;

/** Regex to extract background-image url */
const BG_IMAGE_PATTERN = /background-image\s*:\s*url\(\s*"([^"]+)"\s*\)/;

/**
 * Parse the synced block from a CSS string and extract theme variable values
 * and pro properties. Only parses content within the demarcated markers.
 */
export function parseCssToThemeState(css: string): ParsedThemeState {
  const variables: Partial<ThemeVariables> = {};
  const pro: ThemeProProperties = {};

  // Extract the synced block
  const startIdx = css.indexOf(SYNC_START);
  const endIdx = css.indexOf(SYNC_END);

  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
    return { pro, variables };
  }

  const block = css.slice(startIdx + SYNC_START.length, endIdx);

  // Extract --anc-theme-* variables
  let match: null | RegExpExecArray;
  VARIABLE_PATTERN.lastIndex = 0;
  while ((match = VARIABLE_PATTERN.exec(block)) !== null) {
    const key = match[1];
    const value = match[2].trim();

    if (key === "border-radius") {
      const px = parseInt(value, 10);
      if (!Number.isNaN(px)) {
        pro.borderRadius = px;
      }
    } else if (key === "overlay-color") {
      pro.overlayColor = value;
    } else if (key === "overlay-opacity") {
      const num = parseFloat(value);
      if (!Number.isNaN(num)) {
        pro.overlayOpacity = num;
      }
    } else {
      variables[key as ThemeVariableKey] = value;
    }
  }

  // Extract font-family
  const fontMatch = FONT_PATTERN.exec(block);
  if (fontMatch != null) {
    pro.font = fontMatch[1];
  }

  // Extract background-image
  const bgMatch = BG_IMAGE_PATTERN.exec(block);
  if (bgMatch != null) {
    pro.backgroundImage = bgMatch[1];
  }

  return { pro, variables };
}

// ── Surgical Updater (UI → CSS) ──────────────────────────────────────────────

/**
 * Update a single --anc-theme-* variable value in the synced block of a CSS string.
 * Returns the updated CSS. If the variable isn't found, it is appended before
 * the closing brace of the .anchr-page rule.
 */
export function updateVariableInCss(css: string, key: ThemeVariableKey, newValue: string): string {
  const propName = `${THEME_VARIABLE_PREFIX}${key}`;
  const pattern = new RegExp(`(${escapeRegex(propName)}\\s*:\\s*)([^;]+)(;)`, "g");

  // Only operate within the synced block
  const startIdx = css.indexOf(SYNC_START);
  const endIdx = css.indexOf(SYNC_END);

  if (startIdx === -1 || endIdx === -1) {
    return css;
  }

  const before = css.slice(0, startIdx + SYNC_START.length);
  const block = css.slice(startIdx + SYNC_START.length, endIdx);
  const after = css.slice(endIdx);

  if (pattern.test(block)) {
    // Reset lastIndex after test
    pattern.lastIndex = 0;
    const updatedBlock = block.replace(pattern, `$1${newValue}$3`);
    return before + updatedBlock + after;
  }

  // Variable not found — append before closing brace
  const closingBraceIdx = block.lastIndexOf("}");
  if (closingBraceIdx !== -1) {
    const updatedBlock =
      block.slice(0, closingBraceIdx) + `  ${propName}: ${newValue};\n` + block.slice(closingBraceIdx);
    return before + updatedBlock + after;
  }

  return css;
}

/**
 * Update a pro property (font-family, border-radius, background-image, overlay)
 * in the synced block of a CSS string.
 */
export function updateProPropertyInCss(
  css: string,
  property: "backgroundImage" | "borderRadius" | "font" | "overlayColor" | "overlayOpacity",
  value: null | number | string,
): string {
  const startIdx = css.indexOf(SYNC_START);
  const endIdx = css.indexOf(SYNC_END);

  if (startIdx === -1 || endIdx === -1) {
    return css;
  }

  const before = css.slice(0, startIdx + SYNC_START.length);
  const block = css.slice(startIdx + SYNC_START.length, endIdx);
  const after = css.slice(endIdx);

  let propPattern: RegExp;
  let newDeclaration: string;

  switch (property) {
    case "backgroundImage":
      propPattern = /background-image\s*:\s*url\([^)]*\)\s*;/;
      newDeclaration = value != null && String(value).trim() !== "" ? `background-image: url("${value}");` : "";
      break;
    case "borderRadius":
      propPattern = /--anc-theme-border-radius\s*:\s*[^;]+;/;
      newDeclaration = value != null ? `--anc-theme-border-radius: ${value}px;` : "";
      break;
    case "font":
      propPattern = /font-family\s*:\s*[^;]+;/;
      newDeclaration =
        value != null && String(value).trim() !== "" ? `font-family: "${value}", var(--anc-font-sans);` : "";
      break;
    case "overlayColor":
      propPattern = /--anc-theme-overlay-color\s*:\s*[^;]+;/;
      newDeclaration = value != null ? `--anc-theme-overlay-color: ${value};` : "";
      break;
    case "overlayOpacity":
      propPattern = /--anc-theme-overlay-opacity\s*:\s*[^;]+;/;
      newDeclaration = value != null ? `--anc-theme-overlay-opacity: ${value};` : "";
      break;
  }

  if (propPattern.test(block)) {
    const updatedBlock = newDeclaration
      ? block.replace(propPattern, newDeclaration)
      : block.replace(new RegExp(`\\s*${propPattern.source}`, propPattern.flags), "");
    return before + updatedBlock + after;
  }

  // Property not found — append before closing brace if value is non-null
  if (newDeclaration) {
    const closingBraceIdx = block.lastIndexOf("}");
    if (closingBraceIdx !== -1) {
      const updatedBlock = block.slice(0, closingBraceIdx) + `  ${newDeclaration}\n` + block.slice(closingBraceIdx);
      return before + updatedBlock + after;
    }
  }

  return css;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
