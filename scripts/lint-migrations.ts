#!/usr/bin/env node

/**
 * Destructive migration linter.
 *
 * Scans migration .sql files for dangerous operations:
 *   - BLOCK (exit 1): DROP TABLE, DROP COLUMN, ALTER COLUMN ... TYPE
 *   - WARN  (annotate): ALTER COLUMN ... DROP NOT NULL, ALTER COLUMN ... SET NOT NULL,
 *                        RENAME TABLE, RENAME COLUMN
 *
 * Escape hatch: add `-- allow-destructive` anywhere in the migration file to skip all checks.
 *
 * Usage:
 *   node --no-warnings scripts/lint-migrations.ts [file1.sql file2.sql ...]
 *
 * When called without arguments, scans all files in drizzle/*.sql.
 */

import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const ESCAPE_HATCH = "-- allow-destructive";

type Rule = {
  message: string;
  pattern: RegExp;
  severity: "block" | "warn";
};

const rules: Rule[] = [
  // Blocking rules
  {
    message: "DROP TABLE is a destructive operation that permanently deletes data",
    pattern: /\bDROP\s+TABLE\b/i,
    severity: "block",
  },
  {
    message: "DROP COLUMN is a destructive operation that permanently deletes data",
    pattern: /\bDROP\s+COLUMN\b/i,
    severity: "block",
  },
  {
    message: "ALTER COLUMN ... TYPE can cause data loss or lock tables",
    pattern: /\bALTER\s+COLUMN\b[^;]*\bTYPE\b/i,
    severity: "block",
  },
  // Warning rules
  {
    message: "ALTER COLUMN ... DROP NOT NULL changes column constraints",
    pattern: /\bALTER\s+COLUMN\b[^;]*\bDROP\s+NOT\s+NULL\b/i,
    severity: "warn",
  },
  {
    message: "ALTER COLUMN ... SET NOT NULL may fail on existing NULL rows",
    pattern: /\bALTER\s+COLUMN\b[^;]*\bSET\s+NOT\s+NULL\b/i,
    severity: "warn",
  },
  {
    message: "RENAME TABLE may break existing queries and application code",
    pattern: /\bRENAME\s+TABLE\b/i,
    severity: "warn",
  },
  {
    message: "ALTER TABLE ... RENAME TO may break existing queries and application code",
    pattern: /\bALTER\s+TABLE\b[^;]*\bRENAME\s+TO\b/i,
    severity: "warn",
  },
  {
    message: "RENAME COLUMN may break existing queries and application code",
    pattern: /\bRENAME\s+COLUMN\b/i,
    severity: "warn",
  },
];

function getMigrationFiles(args: string[]): string[] {
  if (args.length > 0) {
    return args.map((f) => resolve(f));
  }

  const drizzleDir = join(process.cwd(), "drizzle");
  return readdirSync(drizzleDir)
    .filter((f) => f.endsWith(".sql"))
    .map((f) => join(drizzleDir, f));
}

function lintFile(filePath: string): { blocks: string[]; warns: string[] } {
  const content = readFileSync(filePath, "utf-8");
  const blocks: string[] = [];
  const warns: string[] = [];

  if (content.includes(ESCAPE_HATCH)) {
    return { blocks, warns };
  }

  for (const rule of rules) {
    if (rule.pattern.test(content)) {
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (rule.pattern.test(lines[i])) {
          const location = `${filePath}:${i + 1}`;
          const msg = `${location}: ${rule.message}`;
          if (rule.severity === "block") {
            blocks.push(msg);
          } else {
            warns.push(msg);
          }
        }
      }
    }
  }

  return { blocks, warns };
}

const isGitHubActions = process.env.CI != null;
const files = getMigrationFiles(process.argv.slice(2));

let hasBlocks = false;

for (const file of files) {
  const { blocks, warns } = lintFile(file);

  for (const warn of warns) {
    if (isGitHubActions) {
      console.log(`::warning::${warn}`);
    } else {
      console.warn(`⚠ WARN: ${warn}`);
    }
  }

  for (const block of blocks) {
    hasBlocks = true;
    if (isGitHubActions) {
      console.log(`::error::${block}`);
    } else {
      console.error(`✘ BLOCK: ${block}`);
    }
  }
}

if (hasBlocks) {
  console.error(
    "\nDestructive operations detected in migration files. " +
      `Add '${ESCAPE_HATCH}' to the migration file to explicitly allow them.`,
  );
  process.exit(1);
}

if (files.length > 0) {
  console.log(`✔ ${files.length} migration file(s) passed destructive operation lint.`);
}
