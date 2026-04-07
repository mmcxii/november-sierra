import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";

const require = createRequire(import.meta.url);

/**
 * This test exists to remind us to remove the @eslint/compat shim from
 * eslint.config.ts once eslint-plugin-react supports ESLint 10 natively.
 *
 * When this test fails, eslint-plugin-react has been updated — check if it
 * supports ESLint 10, and if so, remove fixupPluginRules from eslint.config.ts
 * and uninstall @eslint/compat.
 */
describe("@eslint/compat shim reminder", () => {
  it("should fail when eslint-plugin-react is updated past v7", () => {
    //* Arrange
    const pkgPath = require.resolve("eslint-plugin-react/package.json");

    const pkg = require(pkgPath) as { version: string };

    //* Act
    const major = Number(pkg.version.split(".")[0]);

    //* Assert
    expect(
      major,
      [
        `eslint-plugin-react has been updated to v${pkg.version}.`,
        "Check if it supports ESLint 10 natively now.",
        "If so, remove fixupPluginRules() from eslint.config.ts and uninstall @eslint/compat.",
      ].join(" "),
    ).toBe(7);
  });
});
