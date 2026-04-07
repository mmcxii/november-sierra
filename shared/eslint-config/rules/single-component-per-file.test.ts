import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { singleComponentPerFile } from "./single-component-per-file.js";

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

ruleTester.run("single-component-per-file", singleComponentPerFile, {
  invalid: [
    {
      code: `
        export function Button() { return null; }
        export function Card() { return null; }
      `,
      errors: [{ messageId: "extraComponent" }],
      name: "two components",
    },
    {
      code: `
        export function Button() { return null; }
        export const helper = () => {};
      `,
      errors: [{ messageId: "extraDeclaration" }],
      name: "component + helper export",
    },
    {
      code: `
        export function useToggle() { return []; }
        export function useCounter() { return 0; }
      `,
      errors: [{ messageId: "extraHook" }],
      name: "two hooks",
    },
    {
      code: `
        export function useToggle() { return []; }
        export const helper = () => {};
      `,
      errors: [{ messageId: "extraHookDeclaration" }],
      name: "hook + helper export",
    },
  ],
  valid: [
    {
      code: "export function Button() { return null; }",
      name: "single component",
    },
    {
      code: `
        export type ButtonProps = { label: string };
        export function Button(props: ButtonProps) { return null; }
      `,
      name: "component + type",
    },
    {
      code: `
        export const buttonVariants = {};
        export function Button() { return null; }
      `,
      name: "component + variants",
    },
    {
      code: "export function useToggle() { return []; }",
      name: "single hook",
    },
    {
      code: `
        "use client";
        import React from "react";
        export function Button() { return null; }
      `,
      name: 'imports + "use client" + component',
    },
    {
      code: `
        export { Foo } from "./foo";
        export function Button() { return null; }
      `,
      name: "re-exports alongside component",
    },
  ],
});
