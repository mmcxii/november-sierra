/**
 * Validates i18n locale files.
 *
 * en-US.json (source of truth):
 *   - Key must be the camelCased version of the English value
 *   - {{variable}} interpolations are preserved as-is in the key
 *   - HTML tags like <1>...</1> are stripped
 *   - Contractions collapse: you'll → youll, don't → dont, we're → were
 *   - Possessives collapse: group's → groups
 *   - & becomes And
 *   - Currency/symbols at the start are preserved ($5 → $5)
 *
 * Other locale files:
 *   - Must have the exact same set of keys as en-US.json (no missing, no extra)
 *   - {{variable}} interpolation tokens must match en-US.json
 *
 * Exit code 0 = all valid, 1 = errors found.
 */

import { readFileSync, readdirSync } from "node:fs";
import { basename, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

// ─── Core logic (exported for testing) ───────────────────────────────────────

function lowerFirst(s: string): string {
  if (s.startsWith("$")) {
    return "$" + s.slice(1).toLowerCase();
  }
  return s.charAt(0).toLowerCase() + s.slice(1).toLowerCase();
}

function upperFirst(s: string): string {
  if (s.startsWith("$")) {
    return "$" + s.charAt(1).toUpperCase() + s.slice(2).toLowerCase();
  }
  return s.charAt(0).toUpperCase() + s.slice(1).toLowerCase();
}

export function valueToCamelKey(value: string): string {
  // 1. Extract interpolation tokens and replace with placeholders
  const tokens: string[] = [];
  let processed = value.replace(/\{\{(\w+)\}\}/g, (_match, name: string) => {
    tokens.push(`{{${name}}}`);
    return ` __TOKEN${tokens.length - 1}__ `;
  });

  // 2. Strip HTML-like tags (<1>, </1>, <br/>, etc.)
  processed = processed.replace(/<\/?[^>]+>/g, "");

  // 3. Expand & to "and"
  processed = processed.replace(/&/g, " and ");

  // 4. Collapse contractions and possessives before splitting
  //    you'll → youll, don't → dont, we're → were, it's → its, group's → groups
  processed = processed.replace(/(\w)'(\w)/g, "$1$2");

  // 5. Replace non-alphanumeric characters (except $ and _) with spaces
  processed = processed.replace(/[^a-zA-Z0-9$_]/g, " ");

  // 6. Split into words and camelCase
  const words = processed.split(/\s+/).filter(Boolean);

  if (words.length === 0) {
    return "";
  }

  let result = "";
  for (let i = 0; i < words.length; i++) {
    const word = words[i];

    // Check if word is a token placeholder
    const tokenMatch = word.match(/^__TOKEN(\d+)__$/);
    if (tokenMatch != null) {
      result += tokens[Number(tokenMatch[1])];
      continue;
    }

    if (i === 0) {
      result += lowerFirst(word);
    } else {
      result += upperFirst(word);
    }
  }

  return result;
}

export function extractTokens(value: string): string[] {
  const matches = value.match(/\{\{\w+\}\}/g);
  return matches != null ? [...matches].sort() : [];
}

// ─── Main (only runs when executed directly, not when imported) ──────────────

const isDirectExecution = process.argv[1]?.endsWith("validate-i18n-keys.ts") ?? false;

if (isDirectExecution) {
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const localesDir = resolve(__dirname, "../src/lib/i18n/locales");
  const enUsPath = resolve(localesDir, "en-US.json");

  const enUs: Record<string, string> = JSON.parse(readFileSync(enUsPath, "utf-8"));
  const enUsKeys = new Set(Object.keys(enUs));

  let errors = 0;

  // ─── Validate en-US: keys must match camelCased values ───────────────────
  for (const [key, value] of Object.entries(enUs)) {
    const expected = valueToCamelKey(value);

    if (expected.length === 0) {
      continue;
    }

    if (key !== expected) {
      console.error(`  ✗ en-US.json key mismatch:`);
      console.error(`    actual:   "${key}"`);
      console.error(`    expected: "${expected}"`);
      console.error(`    value:    "${value}"`);
      console.error();
      errors++;
    }
  }

  // ─── Validate other locales: same keys + matching interpolation tokens ───
  const localeFiles = readdirSync(localesDir).filter((f) => f.endsWith(".json") && f !== "en-US.json");

  for (const file of localeFiles) {
    const localeName = basename(file, ".json");
    const locale: Record<string, string> = JSON.parse(readFileSync(resolve(localesDir, file), "utf-8"));
    const localeKeys = new Set(Object.keys(locale));

    // Check for extra keys (stale translations not in en-US)
    // Missing keys are fine — i18next falls back to en-US
    for (const key of localeKeys) {
      if (!enUsKeys.has(key)) {
        console.error(`  ✗ ${localeName}: extra key "${key}" (not in en-US.json)`);
        errors++;
      }
    }

    // Check interpolation tokens match
    for (const [key, value] of Object.entries(locale)) {
      if (!enUsKeys.has(key)) {
        continue;
      }

      const enTokens = extractTokens(enUs[key]);
      const localeTokens = extractTokens(value);

      if (enTokens.join(",") !== localeTokens.join(",")) {
        console.error(`  ✗ ${localeName}: token mismatch for "${key}":`);
        console.error(`    en-US:    ${enTokens.join(", ") || "(none)"}`);
        console.error(`    ${localeName}: ${localeTokens.join(", ") || "(none)"}`);
        console.error();
        errors++;
      }
    }
  }

  if (errors > 0) {
    console.error(`${errors} i18n error${errors === 1 ? "" : "s"} found.`);
    process.exit(1);
  } else {
    const localeCount = localeFiles.length;
    const suffix = localeCount > 0 ? ` ${localeCount} locale${localeCount === 1 ? "" : "s"} synced.` : "";
    console.log(`✓ All i18n keys valid.${suffix}`);
  }
}
