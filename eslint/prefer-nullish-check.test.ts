import { RuleTester } from "@typescript-eslint/rule-tester";
import path from "node:path";
import { afterAll, describe, it } from "vitest";
import { preferNullishCheck } from "./prefer-nullish-check.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts"],
        defaultProject: "tsconfig.json",
      },
      tsconfigRootDir: path.resolve(import.meta.dirname, ".."),
    },
  },
});

ruleTester.run("prefer-nullish-check", preferNullishCheck, {
  invalid: [
    {
      code: "declare const value: string | null; if (value) {}",
      errors: [{ messageId: "preferNullishCheck" }],
      name: "string | null in if statement",
      output: "declare const value: string | null; if (value != null) {}",
    },
    {
      code: 'declare const value: string | null; const x = value ? "yes" : "no";',
      errors: [{ messageId: "preferNullishCheck" }],
      name: "string | null in ternary",
      output: 'declare const value: string | null; const x = value != null ? "yes" : "no";',
    },
    {
      code: "declare const value: string | null; declare function doSomething(): void; const x = value && doSomething();",
      errors: [{ messageId: "preferNullishCheck" }],
      name: "string | null in && expression",
      output:
        "declare const value: string | null; declare function doSomething(): void; const x = value != null && doSomething();",
    },
    {
      code: 'declare const value: string | null; const x = value || "fallback";',
      errors: [{ messageId: "preferNullishCheck" }],
      name: "string | null in || expression",
      output: 'declare const value: string | null; const x = value ?? "fallback";',
    },
    {
      code: "declare const count: number | undefined; if (count) {}",
      errors: [{ messageId: "preferNullishCheck" }],
      name: "number | undefined in if statement",
      output: "declare const count: number | undefined; if (count != null) {}",
    },
    {
      code: "declare const value: string | null; if (!value) {}",
      errors: [{ messageId: "preferNullishNegation" }],
      name: "negated string | null in if statement",
      output: "declare const value: string | null; if (value == null) {}",
    },
    {
      code: 'declare const value: string | null; const x = !value ? "yes" : "no";',
      errors: [{ messageId: "preferNullishNegation" }],
      name: "negated string | null in ternary",
      output: 'declare const value: string | null; const x = value == null ? "yes" : "no";',
    },
    {
      code: "declare const value: string | null; declare function doSomething(): void; const x = !value && doSomething();",
      errors: [{ messageId: "preferNullishNegation" }],
      name: "negated string | null in && expression",
      output:
        "declare const value: string | null; declare function doSomething(): void; const x = value == null && doSomething();",
    },
  ],
  valid: [
    {
      code: "declare const flag: boolean; if (flag) {}",
      name: "boolean — idiomatic truthy check",
    },
    {
      code: "declare const flag: boolean | null; if (flag) {}",
      name: "boolean | null — has boolean, so skip",
    },
    {
      code: "declare const str: string; if (str) {}",
      name: "string — non-nullable, nothing to guard",
    },
    {
      code: "declare const x: any; if (x) {}",
      name: "any — too loose to lint",
    },
    {
      code: "declare const x: unknown; if (x) {}",
      name: "unknown — too loose to lint",
    },
    {
      code: "declare function getValue(): string | null; if (getValue()) {}",
      name: "complex expression — not a simple identifier",
    },
    {
      code: "declare const flag: boolean; if (!flag) {}",
      name: "negated boolean in if — idiomatic",
    },
    {
      code: 'declare const flag: boolean; const x = !flag ? "yes" : "no";',
      name: "negated boolean in ternary — idiomatic",
    },
    {
      code: "declare const flag: boolean; declare function doSomething(): void; const x = !flag && doSomething();",
      name: "negated boolean in && — idiomatic",
    },
    {
      code: "declare const flag: boolean | null; if (!flag) {}",
      name: "negated boolean | null in if — has boolean, skip",
    },
    {
      code: 'declare const flag: boolean | null; const x = !flag ? "yes" : "no";',
      name: "negated boolean | null in ternary — has boolean, skip",
    },
    {
      code: "declare const flag: boolean | null; declare function doSomething(): void; const x = !flag && doSomething();",
      name: "negated boolean | null in && — has boolean, skip",
    },
    {
      code: 'declare const isSubmitting: boolean; const x = isSubmitting ? "loading" : "submit";',
      name: "boolean in ternary — skip (prevents isSubmitting != null drift)",
    },
    {
      code: "declare const isSubmitting: boolean; declare function render(): void; const x = isSubmitting && render();",
      name: "boolean in && — skip (prevents isSubmitting != null && <Loader> drift)",
    },
    {
      code: "declare const isSubmitting: boolean; const disabled = isSubmitting || false;",
      name: "boolean in || — skip (prevents isSubmitting ?? false drift)",
    },
    {
      code: "declare const mobileOpen: boolean; if (mobileOpen) {}",
      name: "boolean state in if — skip (prevents mobileOpen != null drift)",
    },
    {
      code: 'declare const mobileOpen: boolean; const icon = mobileOpen ? "close" : "open";',
      name: "boolean state in ternary — skip (prevents mobileOpen != null ternary drift)",
    },
    {
      code: "declare const mobileOpen: boolean; declare function render(): void; const x = mobileOpen && render();",
      name: "boolean state in && — skip (prevents always-visible overlay drift)",
    },
    {
      code: "declare const triggered: boolean; const delay = triggered ? '400ms' : '0ms';",
      name: "boolean in ternary inline style — skip (prevents triggered != null drift)",
    },
  ],
});
