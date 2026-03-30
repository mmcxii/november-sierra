import { describe, expect, it } from "vitest";
import { isMigrationFile, isSchemaFile, validateSchemaMigrationSync } from "./validate-schema-migrations";

// ─── isMigrationFile ─────────────────────────────────────────────────────────

describe("isMigrationFile", () => {
  it("accepts a SQL migration file in drizzle/", () => {
    //* Act
    const result = isMigrationFile("drizzle/0005_add-api-keys-table.sql");

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects files in drizzle/meta/ (snapshots)", () => {
    //* Act
    const result = isMigrationFile("drizzle/meta/0005_snapshot.json");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects the journal file", () => {
    //* Act
    const result = isMigrationFile("drizzle/meta/_journal.json");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects JSON files in drizzle/ root", () => {
    //* Act
    const result = isMigrationFile("drizzle/some-config.json");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects files outside drizzle/", () => {
    //* Act
    const result = isMigrationFile("src/lib/db/schema/user.ts");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects unrelated files", () => {
    //* Act
    const result = isMigrationFile("package.json");

    //* Assert
    expect(result).toBe(false);
  });
});

// ─── isSchemaFile ────────────────────────────────────────────────────────────

describe("isSchemaFile", () => {
  it("accepts a file in src/lib/db/schema/", () => {
    //* Act
    const result = isSchemaFile("src/lib/db/schema/user.ts");

    //* Assert
    expect(result).toBe(true);
  });

  it("accepts a file in a subdirectory of schema/", () => {
    //* Act
    const result = isSchemaFile("src/lib/db/schema/tables/api-key.ts");

    //* Assert
    expect(result).toBe(true);
  });

  it("rejects files outside the schema directory", () => {
    //* Act
    const result = isSchemaFile("src/lib/db/client.ts");

    //* Assert
    expect(result).toBe(false);
  });

  it("rejects migration files", () => {
    //* Act
    const result = isSchemaFile("drizzle/0005_add-api-keys-table.sql");

    //* Assert
    expect(result).toBe(false);
  });
});

// ─── validateSchemaMigrationSync ─────────────────────────────────────────────

describe("validateSchemaMigrationSync", () => {
  // ─── Accept cases ────────────────────────────────────────────────────────

  it("accepts when both schema and migration files are present", () => {
    //* Arrange
    const files = ["src/lib/db/schema/api-key.ts", "drizzle/0005_add-api-keys-table.sql"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({ migrationCount: 1, schemaCount: 1, valid: true });
  });

  it("accepts when multiple schema files are paired with multiple migrations", () => {
    //* Arrange
    const files = [
      "src/lib/db/schema/api-key.ts",
      "src/lib/db/schema/user.ts",
      "drizzle/0005_add-api-keys-table.sql",
      "drizzle/0006_update-users.sql",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({ migrationCount: 2, schemaCount: 2, valid: true });
  });

  it("accepts when no schema or migration files are present", () => {
    //* Arrange
    const files = ["src/app/page.tsx", "package.json", "README.md"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({ migrationCount: 0, schemaCount: 0, valid: true });
  });

  it("accepts an empty file list", () => {
    //* Act
    const result = validateSchemaMigrationSync([]);

    //* Assert
    expect(result).toEqual({ migrationCount: 0, schemaCount: 0, valid: true });
  });

  it("accepts schema + migration alongside unrelated files", () => {
    //* Arrange
    const files = [
      "src/lib/db/schema/api-key.ts",
      "drizzle/0005_add-api-keys-table.sql",
      "src/app/page.tsx",
      "package.json",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({ migrationCount: 1, schemaCount: 1, valid: true });
  });

  it("ignores drizzle/meta/ snapshot files when counting migrations", () => {
    //* Arrange
    const files = [
      "src/lib/db/schema/api-key.ts",
      "drizzle/0005_add-api-keys-table.sql",
      "drizzle/meta/0005_snapshot.json",
      "drizzle/meta/_journal.json",
    ];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({ migrationCount: 1, schemaCount: 1, valid: true });
  });

  // ─── Reject cases ───────────────────────────────────────────────────────

  it("rejects schema change without a migration", () => {
    //* Arrange
    const files = ["src/lib/db/schema/api-key.ts"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({
      error: "schema-without-migration",
      schemaFiles: ["src/lib/db/schema/api-key.ts"],
      valid: false,
    });
  });

  it("rejects multiple schema changes without a migration", () => {
    //* Arrange
    const files = ["src/lib/db/schema/api-key.ts", "src/lib/db/schema/user.ts", "src/app/page.tsx"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({
      error: "schema-without-migration",
      schemaFiles: ["src/lib/db/schema/api-key.ts", "src/lib/db/schema/user.ts"],
      valid: false,
    });
  });

  it("rejects schema change when only meta/snapshot files are in drizzle/", () => {
    //* Arrange
    const files = ["src/lib/db/schema/api-key.ts", "drizzle/meta/0005_snapshot.json", "drizzle/meta/_journal.json"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({
      error: "schema-without-migration",
      schemaFiles: ["src/lib/db/schema/api-key.ts"],
      valid: false,
    });
  });

  it("rejects migration without a schema change", () => {
    //* Arrange
    const files = ["drizzle/0005_add-api-keys-table.sql"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({
      error: "migration-without-schema",
      migrationFiles: ["drizzle/0005_add-api-keys-table.sql"],
      valid: false,
    });
  });

  it("rejects multiple migrations without a schema change", () => {
    //* Arrange
    const files = ["drizzle/0005_add-api-keys-table.sql", "drizzle/0006_update-users.sql", "package.json"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({
      error: "migration-without-schema",
      migrationFiles: ["drizzle/0005_add-api-keys-table.sql", "drizzle/0006_update-users.sql"],
      valid: false,
    });
  });

  it("rejects migration alongside unrelated src/ files (not schema)", () => {
    //* Arrange
    const files = ["drizzle/0005_add-api-keys-table.sql", "src/lib/db/client.ts", "src/app/page.tsx"];

    //* Act
    const result = validateSchemaMigrationSync(files);

    //* Assert
    expect(result).toEqual({
      error: "migration-without-schema",
      migrationFiles: ["drizzle/0005_add-api-keys-table.sql"],
      valid: false,
    });
  });
});
