import { THEME_VARIABLE_KEYS, THEME_VARIABLE_PREFIX, type ThemeVariables } from "../custom-themes";
import type { ThemeSwatch } from "../themes";
import { isValidThemeId } from "../themes";

/**
 * Extract the first color from a CSS value that may be a gradient or a solid color.
 * For gradients like `linear-gradient(160deg, #fdfaf2 0%, ...)`, extracts `#fdfaf2`.
 * For solid colors, returns the value as-is.
 */
function extractFirstColor(value: string): string {
  // Check for gradient — extract first hex/rgb/rgba color after the direction
  const gradientMatch = value.match(/gradient\([^,]+,\s*(#[0-9a-fA-F]{3,8}|rgba?\([^)]+\))/i);
  if (gradientMatch != null) {
    return gradientMatch[1];
  }

  return value;
}

/**
 * Derive a ThemeSwatch preview from custom theme variables.
 * Maps: accent ← anchor-color, bg ← avatar-bg, card ← first color of card-bg.
 */
export function deriveSwatchFromVariables(variables: ThemeVariables): ThemeSwatch {
  return {
    accent: variables["anchor-color"],
    bg: variables["avatar-bg"],
    card: extractFirstColor(variables["card-bg"]),
  };
}

/**
 * Derive OG image colors from custom theme variables.
 */
export function deriveOgColorsFromVariables(variables: ThemeVariables): {
  anchorColor: string;
  avatarBg: string;
  avatarOuterRing: string;
  nameColor: string;
  ogBackground: string;
} {
  return {
    anchorColor: variables["anchor-color"],
    avatarBg: variables["avatar-bg"],
    avatarOuterRing: variables["avatar-outer-ring"],
    nameColor: variables["name-color"],
    ogBackground: variables["avatar-bg"],
  };
}

/**
 * Generate a default theme name like "Custom Theme 1", "Custom Theme 2", etc.
 * Finds the lowest available number not already taken.
 */
export function generateThemeName(existingNames: string[]): string {
  const taken = new Set(existingNames);
  let n = 1;
  while (taken.has(`Custom Theme ${n}`)) {
    n++;
  }
  return `Custom Theme ${n}`;
}

/**
 * Auto-version a theme name if it conflicts with existing names.
 * "My Theme" → "My Theme 1" → "My Theme 2", etc.
 */
export function autoVersionThemeName(desiredName: string, existingNames: string[]): string {
  const taken = new Set(existingNames);
  if (!taken.has(desiredName)) {
    return desiredName;
  }

  let n = 1;
  while (taken.has(`${desiredName} ${n}`)) {
    n++;
  }
  return `${desiredName} ${n}`;
}

/**
 * Validate that at least one of light/dark mode is enabled.
 */
export function validateLightDarkToggles(lightEnabled: boolean, darkEnabled: boolean): boolean {
  return lightEnabled || darkEnabled;
}

/** UUID v4 pattern */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Check if a theme ID is a custom theme UUID (not a preset theme ID).
 */
export function isCustomThemeId(id: string): boolean {
  if (id === "" || isValidThemeId(id)) {
    return false;
  }
  return UUID_PATTERN.test(id);
}

/**
 * Convert ThemeVariables to a React inline style object with CSS custom property names.
 */
export function variablesToInlineStyle(variables: ThemeVariables): Record<string, string> {
  const style: Record<string, string> = {};
  for (const key of THEME_VARIABLE_KEYS) {
    style[`${THEME_VARIABLE_PREFIX}${key}`] = variables[key];
  }
  return style;
}
