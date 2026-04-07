import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noJsxWhitespaceLiteral } from "./no-jsx-whitespace-literal.js";

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

ruleTester.run("no-jsx-whitespace-literal", noJsxWhitespaceLiteral, {
  invalid: [
    {
      code: '<div>{" "}</div>',
      errors: [{ messageId: "noJsxWhitespaceLiteral" }],
    },
    {
      code: '<div>{"  "}</div>',
      errors: [{ messageId: "noJsxWhitespaceLiteral" }],
    },
  ],
  valid: [{ code: '<div>{"hello"}</div>' }, { code: "<div>{variable}</div>" }],
});
