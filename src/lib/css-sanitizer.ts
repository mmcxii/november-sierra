type SanitizeResult = {
  errors: string[];
  sanitized: string;
};

/** CSS properties that are always blocked (case-insensitive match). */
const BLOCKED_PROPERTIES = new Set([
  "-moz-binding",
  "behavior",
  "clip",
  "clip-path",
  "cursor",
  "overflow",
  "overflow-x",
  "overflow-y",
  "pointer-events",
  "resize",
  "visibility",
  "z-index",
]);

/** Properties blocked when the value matches a pattern. */
const CONDITIONAL_BLOCKS: { pattern: RegExp; property: string }[] = [
  { pattern: /\b(fixed|absolute)\b/i, property: "position" },
  { pattern: /\bnone\b/i, property: "display" },
];

/** Patterns in values that indicate XSS or external resource loading. */
const BLOCKED_VALUE_PATTERNS: { message: string; pattern: RegExp }[] = [
  { message: "expression() is not allowed", pattern: /expression\s*\(/i },
  { message: "url(javascript:) is not allowed", pattern: /url\s*\(\s*['"]?\s*javascript\s*:/i },
  { message: "url(data:) is not allowed", pattern: /url\s*\(\s*['"]?\s*data\s*:/i },
];

/** At-rules that are completely blocked. */
const BLOCKED_AT_RULES = /^@(import|font-face|media)\b/i;

/** Selectors that are never allowed. */
const FORBIDDEN_SELECTORS = /(?:^|\s|,)(?:html|body|:root)(?:\s|{|,|$)/i;

/** All selectors must start with .lp-page-bg */
const SCOPE_SELECTOR = ".lp-page-bg";

/**
 * Decode CSS unicode escapes (e.g., `\70` → `p`) to prevent bypass of property name checks.
 */
function decodeCssEscapes(str: string): string {
  return str.replace(/\\([0-9a-fA-F]{1,6})\s?/g, (_, hex: string) => String.fromCodePoint(parseInt(hex, 16)));
}

/**
 * Parse CSS text into blocks: at-rules and rule blocks (selector + declarations).
 * This is a simple brace-depth parser, not a full CSS AST.
 */
function parseBlocks(css: string): string[] {
  const blocks: string[] = [];
  let current = "";
  let depth = 0;

  for (let i = 0; i < css.length; i++) {
    const char = css[i];

    // Handle @import (and other statement at-rules that end with `;` not `{}`)
    if (depth === 0 && current.trim() === "" && char === "@") {
      // Peek ahead to check if this is a statement at-rule (no braces)
      const rest = css.slice(i);
      const semiIndex = rest.indexOf(";");
      const braceIndex = rest.indexOf("{");

      if (semiIndex !== -1 && (braceIndex === -1 || semiIndex < braceIndex)) {
        // Statement at-rule ending with semicolon (e.g., @import)
        blocks.push(rest.slice(0, semiIndex + 1).trim());
        i += semiIndex;
        current = "";
        continue;
      }
    }

    if (char === "{") {
      depth++;
      current += char;
    } else if (char === "}") {
      depth--;
      current += char;
      if (depth <= 0) {
        blocks.push(current.trim());
        current = "";
        depth = 0;
      }
    } else {
      current += char;
    }
  }

  // Handle trailing content (malformed CSS with unclosed braces)
  if (current.trim().length > 0) {
    blocks.push(current.trim());
  }

  return blocks;
}

/**
 * Sanitize a single CSS rule block (selector + declarations).
 * Returns the sanitized block or null if the entire block should be removed.
 */
function sanitizeRuleBlock(block: string, errors: string[]): null | string {
  const braceIndex = block.indexOf("{");
  if (braceIndex === -1) {
    return null;
  }

  const selector = block.slice(0, braceIndex).trim();
  const bodyWithBrace = block.slice(braceIndex);
  const body = bodyWithBrace.slice(1, bodyWithBrace.lastIndexOf("}")).trim();

  // Check selector restrictions
  if (FORBIDDEN_SELECTORS.test(selector)) {
    errors.push(`Selector "${selector}" targets a forbidden element (html, body, or :root)`);
    return null;
  }

  // Check all selectors in comma-separated list are scoped
  const selectors = selector.split(",").map((s) => s.trim());
  for (const sel of selectors) {
    if (!sel.startsWith(SCOPE_SELECTOR)) {
      errors.push(`Selector "${sel}" must be scoped to ${SCOPE_SELECTOR}`);
      return null;
    }
  }

  // Sanitize declarations
  const declarations = body
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean);
  const cleanDeclarations: string[] = [];

  for (const decl of declarations) {
    const colonIndex = decl.indexOf(":");
    if (colonIndex === -1) {
      continue;
    }

    const rawProperty = decl.slice(0, colonIndex).trim();
    const value = decl.slice(colonIndex + 1).trim();
    const property = decodeCssEscapes(rawProperty).toLowerCase();

    // Check blocked properties
    if (BLOCKED_PROPERTIES.has(property)) {
      errors.push(`Property "${property}" is not allowed`);
      continue;
    }

    // "content" is always blocked (used for pseudo-element text injection)
    if (property === "content") {
      errors.push(`Property "content" is not allowed`);
      continue;
    }

    // Check conditional blocks
    let blocked = false;
    for (const { pattern, property: condProp } of CONDITIONAL_BLOCKS) {
      if (property === condProp && pattern.test(value)) {
        errors.push(`Property "${property}" with value "${value}" is not allowed`);
        blocked = true;
        break;
      }
    }
    if (blocked) {
      continue;
    }

    // Check blocked value patterns
    let valueBlocked = false;
    for (const { message, pattern } of BLOCKED_VALUE_PATTERNS) {
      if (pattern.test(value)) {
        errors.push(message);
        valueBlocked = true;
        break;
      }
    }
    if (valueBlocked) {
      continue;
    }

    cleanDeclarations.push(`${rawProperty}: ${value}`);
  }

  if (cleanDeclarations.length === 0) {
    return null;
  }

  return `${selector} { ${cleanDeclarations.join("; ")}; }`;
}

/**
 * Sanitize user-provided CSS by stripping disallowed properties, values, selectors, and at-rules.
 *
 * All CSS must be scoped to `.lp-page-bg`. Dangerous properties (positioning, visibility,
 * overflow, etc.) and XSS vectors (expression, javascript: URLs, etc.) are stripped.
 *
 * @returns The sanitized CSS string and an array of human-readable error messages.
 */
export function sanitizeCss(rawCss: string): SanitizeResult {
  if (rawCss.trim() === "") {
    return { errors: [], sanitized: "" };
  }

  const errors: string[] = [];

  // Strip comments to prevent them from hiding malicious code
  const noComments = rawCss.replace(/\/\*[\s\S]*?(\*\/|$)/g, "");

  const blocks = parseBlocks(noComments);
  const cleanBlocks: string[] = [];

  for (const block of blocks) {
    // Check for blocked at-rules
    const trimmed = block.trim();
    if (BLOCKED_AT_RULES.test(trimmed)) {
      const atRule = trimmed.match(/^@\w+/)?.[0] ?? "at-rule";
      errors.push(`${atRule} is not allowed`);
      continue;
    }

    const cleaned = sanitizeRuleBlock(block, errors);
    if (cleaned != null) {
      cleanBlocks.push(cleaned);
    }
  }

  return { errors, sanitized: cleanBlocks.join(" ") };
}
