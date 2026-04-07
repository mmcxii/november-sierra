/**
 * Validates that schema changes are accompanied by migration changes and vice versa.
 *
 * Checks staged files (git diff --cached) to ensure:
 * - If any file in <workspace>/src/lib/db/schema/ changed, at least one file in <workspace>/drizzle/ also changed
 * - If any migration file in <workspace>/drizzle/ changed, at least one file in <workspace>/src/lib/db/schema/ also changed
 *
 * Usage:
 *   node --no-warnings scripts/validate-schema-migrations.ts <workspace-root>
 *   Example: node --no-warnings scripts/validate-schema-migrations.ts anchr/website
 *
 * Exit code 0 = valid, 1 = mismatch found.
 */

import { execSync } from "node:child_process";

// ─── Core logic (exported for testing) ───────────────────────────────────────

export function schemaDir(workspaceRoot: string): string {
  return `${workspaceRoot}/src/lib/db/schema/`;
}

export function migrationsDir(workspaceRoot: string): string {
  return `${workspaceRoot}/drizzle/`;
}

// Files to ignore in the migrations directory (not actual migration content)
export function ignoredMigrationPatterns(workspaceRoot: string): RegExp[] {
  return [new RegExp(`^${workspaceRoot}/drizzle/meta/`), new RegExp(`^${workspaceRoot}/drizzle/.*\\.json$`)];
}

export function isMigrationFile(file: string, workspaceRoot: string): boolean {
  if (!file.startsWith(migrationsDir(workspaceRoot))) {
    return false;
  }
  return !ignoredMigrationPatterns(workspaceRoot).some((pattern) => pattern.test(file));
}

export function isSchemaFile(file: string, workspaceRoot: string): boolean {
  return file.startsWith(schemaDir(workspaceRoot));
}

export type ValidationResult =
  | { error: "migration-without-schema"; migrationFiles: string[]; valid: false }
  | { error: "schema-without-migration"; schemaFiles: string[]; valid: false }
  | { migrationCount: number; schemaCount: number; valid: true };

export function validateSchemaMigrationSync(files: string[], workspaceRoot: string): ValidationResult {
  const schemaFiles = files.filter((f) => isSchemaFile(f, workspaceRoot));
  const migrationFiles = files.filter((f) => isMigrationFile(f, workspaceRoot));

  if (schemaFiles.length > 0 && migrationFiles.length === 0) {
    return { error: "schema-without-migration", schemaFiles, valid: false };
  }

  if (migrationFiles.length > 0 && schemaFiles.length === 0) {
    return { error: "migration-without-schema", migrationFiles, valid: false };
  }

  return { migrationCount: migrationFiles.length, schemaCount: schemaFiles.length, valid: true };
}

// ─── Main (only runs when executed directly, not when imported) ──────────────

const isDirectExecution = process.argv[1]?.endsWith("validate-schema-migrations.ts") ?? false;

if (isDirectExecution) {
  const workspaceRoot = process.argv[2];

  if (!workspaceRoot) {
    console.error("Usage: node scripts/validate-schema-migrations.ts <workspace-root>");
    console.error("Example: node scripts/validate-schema-migrations.ts anchr/website");
    process.exit(1);
  }

  const output = execSync("git diff --cached --name-only --diff-filter=ACMR", {
    encoding: "utf-8",
  });
  const staged = output.trim().split("\n").filter(Boolean);
  const result = validateSchemaMigrationSync(staged, workspaceRoot);

  if (!result.valid) {
    if (result.error === "schema-without-migration") {
      console.error("✗ Schema files changed without a corresponding migration:");
      for (const f of result.schemaFiles) {
        console.error(`    ${f}`);
      }
      console.error("");
      console.error('  Run "pnpm drizzle-kit generate" to create a migration, then stage it.');
    } else {
      console.error("✗ Migration files changed without a corresponding schema change:");
      for (const f of result.migrationFiles) {
        console.error(`    ${f}`);
      }
      console.error("");
      console.error("  Migrations should be generated from schema changes, not edited directly.");
    }
    process.exit(1);
  } else if (result.schemaCount > 0 && result.migrationCount > 0) {
    console.log(
      `✓ Schema and migration changes in sync (${result.schemaCount} schema, ${result.migrationCount} migration).`,
    );
  }
}
