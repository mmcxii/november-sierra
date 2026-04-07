import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noInlineStyle } from "./no-inline-style.js";

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

ruleTester.run("no-inline-style", noInlineStyle, {
  invalid: [
    {
      code: '<div style={{ color: "red" }} />',
      errors: [{ messageId: "noInlineStyle" }],
    },
    {
      code: "<Component style={{ margin: 0 }} />",
      errors: [{ messageId: "noInlineStyle" }],
    },
  ],
  valid: [{ code: '<div className="foo" />' }, { code: "<div />" }],
});
