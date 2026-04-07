import { describe, expect, it } from "vitest";
import { isMigrationFile, isSchemaFile, validateSchemaMigrationSync } from "./validate-schema-migrations";

const WORKSPACE = "anchr/website";

// ─── isMigrationFile ─────────────────────────────────────────────────────────

describe("isMigrationFile", () => {
  it("accepts a SQL migration file in drizzle/", () => {
    //* Act
    const result = isMigrationFile("anchr/website/drizzle/0005_add-api-keys-table.sql", WORKSPACE);

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects files in drizzle/meta/ (snapshots)", () => {
    //* Act
    const result = isMigrationFile("anchr/website/drizzle/meta/0005_snapshot.json", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects the journal file", () => {
    //* Act
    const result = isMigrationFile("anchr/website/drizzle/meta/_journal.json", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects JSON files in drizzle/ root", () => {
    //* Act
    const result = isMigrationFile("anchr/website/drizzle/some-config.json", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects files outside drizzle/", () => {
    //* Act
    const result = isMigrationFile("anchr/website/src/lib/db/schema/user.ts", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects unrelated files", () => {
    //* Act
    const result = isMigrationFile("package.json", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });
});

// ─── isSchemaFile ────────────────────────────────────────────────────────────

describe("isSchemaFile", () => {
  it("accepts a file in src/lib/db/schema/", () => {
    //* Act
    const result = isSchemaFile("anchr/website/src/lib/db/schema/user.ts", WORKSPACE);

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts a file in a subdirectory of schema/", () => {
    //* Act
    const result = isSchemaFile("anchr/website/src/lib/db/schema/tables/api-key.ts", WORKSPACE);

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects files outside the schema directory", () => {
    //* Act
    const result = isSchemaFile("anchr/website/src/lib/db/client.ts", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects migration files", () => {
    //* Act
    const result = isSchemaFile("anchr/website/drizzle/0005_add-api-keys-table.sql", WORKSPACE);

    //* Assert
    expect(result).toBe(false);
  });
});

// ─── validateSchemaMigrationSync ─────────────────────────────────────────────

describe("validateSchemaMigrationSync", () => {
  // ─── Accept cases ────────────────────────────────────────────────────────

  it("accepts when both schema and migration files are present", () => {
    //* Arrange
    const files = ["anchr/website/src/lib/db/schema/api-key.ts", "anchr/website/drizzle/0005_add-api-keys-table.sql"];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({ migrationCount: 1, schemaCount: 1, valid: true });
  });

  it("accepts when multiple schema files are paired with multiple migrations", () => {
    //* Arrange
    const files = [
      "anchr/website/src/lib/db/schema/api-key.ts",
      "anchr/website/src/lib/db/schema/user.ts",
      "anchr/website/drizzle/0005_add-api-keys-table.sql",
      "anchr/website/drizzle/0006_update-users.sql",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({ migrationCount: 2, schemaCount: 2, valid: true });
  });

  it("accepts when no schema or migration files are present", () => {
    //* Arrange
    const files = ["anchr/website/src/app/page.tsx", "package.json", "README.md"];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({ migrationCount: 0, schemaCount: 0, valid: true });
  });

  it("accepts an empty file list", () => {
    //* Act
    const result = validateSchemaMigrationSync([], WORKSPACE);

    //* Assert
    expect(result).toEqual({ migrationCount: 0, schemaCount: 0, valid: true });
  });

  it("accepts schema + migration alongside unrelated files", () => {
    //* Arrange
    const files = [
      "anchr/website/src/lib/db/schema/api-key.ts",
      "anchr/website/drizzle/0005_add-api-keys-table.sql",
      "anchr/website/src/app/page.tsx",
      "package.json",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({ migrationCount: 1, schemaCount: 1, valid: true });
  });

  it("ignores drizzle/meta/ snapshot files when counting migrations", () => {
    //* Arrange
    const files = [
      "anchr/website/src/lib/db/schema/api-key.ts",
      "anchr/website/drizzle/0005_add-api-keys-table.sql",
      "anchr/website/drizzle/meta/0005_snapshot.json",
      "anchr/website/drizzle/meta/_journal.json",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({ migrationCount: 1, schemaCount: 1, valid: true });
  });

  // ─── Reject cases ───────────────────────────────────────────────────────

  it("rejects schema change without a migration", () => {
    //* Arrange
    const files = ["anchr/website/src/lib/db/schema/api-key.ts"];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({
      error: "schema-without-migration",
      schemaFiles: ["anchr/website/src/lib/db/schema/api-key.ts"],
      valid: false,
    });
  });

  it("rejects multiple schema changes without a migration", () => {
    //* Arrange
    const files = [
      "anchr/website/src/lib/db/schema/api-key.ts",
      "anchr/website/src/lib/db/schema/user.ts",
      "anchr/website/src/app/page.tsx",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({
      error: "schema-without-migration",
      schemaFiles: ["anchr/website/src/lib/db/schema/api-key.ts", "anchr/website/src/lib/db/schema/user.ts"],
      valid: false,
    });
  });

  it("rejects schema change when only meta/snapshot files are in drizzle/", () => {
    //* Arrange
    const files = [
      "anchr/website/src/lib/db/schema/api-key.ts",
      "anchr/website/drizzle/meta/0005_snapshot.json",
      "anchr/website/drizzle/meta/_journal.json",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({
      error: "schema-without-migration",
      schemaFiles: ["anchr/website/src/lib/db/schema/api-key.ts"],
      valid: false,
    });
  });

  it("rejects migration without a schema change", () => {
    //* Arrange
    const files = ["anchr/website/drizzle/0005_add-api-keys-table.sql"];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({
      error: "migration-without-schema",
      migrationFiles: ["anchr/website/drizzle/0005_add-api-keys-table.sql"],
      valid: false,
    });
  });

  it("rejects multiple migrations without a schema change", () => {
    //* Arrange
    const files = [
      "anchr/website/drizzle/0005_add-api-keys-table.sql",
      "anchr/website/drizzle/0006_update-users.sql",
      "package.json",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({
      error: "migration-without-schema",
      migrationFiles: [
        "anchr/website/drizzle/0005_add-api-keys-table.sql",
        "anchr/website/drizzle/0006_update-users.sql",
      ],
      valid: false,
    });
  });

  it("rejects migration alongside unrelated src/ files (not schema)", () => {
    //* Arrange
    const files = [
      "anchr/website/drizzle/0005_add-api-keys-table.sql",
      "anchr/website/src/lib/db/client.ts",
      "anchr/website/src/app/page.tsx",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files, WORKSPACE);

    //* Assert
    expect(result).toEqual({
      error: "migration-without-schema",
      migrationFiles: ["anchr/website/drizzle/0005_add-api-keys-table.sql"],
      valid: false,
    });
  });
});
