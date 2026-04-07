import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noRawStringJsx } from "./no-raw-string-jsx.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
});

ruleTester.run("no-raw-string-jsx", noRawStringJsx, {
  valid: [
    // Translated with t()
    {
      code: `<p>{t("hello")}</p>`,
    },
    // Inside Trans component
    {
      code: `<Trans i18nKey="hello">Hello</Trans>`,
    },
    // String prop, not children
    {
      code: `<button type="submit" />`,
    },
    // Whitespace-only
    {
      code: `<p>  </p>`,
    },
    // Single separator character
    {
      code: `<span>/</span>`,
    },
    // Single separator character (middle dot)
    {
      code: `<span>·</span>`,
    },
    // Single separator character (em dash)
    {
      code: `<span>—</span>`,
    },
    // Single separator character (bullet)
    {
      code: `<span>•</span>`,
    },
    // Single separator character (plus)
    {
      code: `<span>+</span>`,
    },
    // Single separator character (times)
    {
      code: `<span>×</span>`,
    },
    // Expression reference, not string
    {
      code: `<p>{count}</p>`,
    },
    // Variable reference
    {
      code: `<p>{someVar}</p>`,
    },
    // Numeric string
    {
      code: `<p>{"3.14"}</p>`,
    },
    // Template literal (typically computed)
    {
      code: "<p>{`hello ${name}`}</p>",
    },
    // Nested inside Trans
    {
      code: `<Trans i18nKey="greeting"><strong>Hello</strong> world</Trans>`,
    },
  ],

  invalid: [
    // Raw text
    {
      code: `<p>Hello world</p>`,
      errors: [{ messageId: "noRawStringJsx" }],
    },
    // String literal in expression container
    {
      code: `<p>{"Submit form"}</p>`,
      errors: [{ messageId: "noRawStringJsx" }],
    },
    // Heading text
    {
      code: `<h1>Welcome back</h1>`,
      errors: [{ messageId: "noRawStringJsx" }],
    },
    // Link text
    {
      code: `<span>Click here</span>`,
      errors: [{ messageId: "noRawStringJsx" }],
    },
    // Single word (not a single character — must be translated)
    {
      code: `<p>Hello</p>`,
      errors: [{ messageId: "noRawStringJsx" }],
    },
    // Single word in expression container
    {
      code: `<p>{"Submit"}</p>`,
      errors: [{ messageId: "noRawStringJsx" }],
    },
  ],
});
