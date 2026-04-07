import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { noImplicitReturnArrow } from "./no-implicit-return-arrow.js";

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

ruleTester.run("no-implicit-return-arrow", noImplicitReturnArrow, {
  invalid: [
    // Variable declaration with implicit return
    {
      code: `const double = (x) => x * 2;`,
      errors: [{ messageId: "noImplicitReturn" }],
    },
    // Assigned handler with implicit return
    {
      code: `const handler = () => doSomething();`,
      errors: [{ messageId: "noImplicitReturn" }],
    },
    // Arrow returning JSX used as callback (JSX is never allowed as implicit return)
    {
      code: `const items = data.map(item => <div>{item}</div>);`,
      errors: [{ messageId: "noImplicitReturn" }],
    },
    // Implicit return in a non-predicate context
    {
      code: `const fn = (a, b) => a + b;`,
      errors: [{ messageId: "noImplicitReturn" }],
    },
  ],
  valid: [
    // Block body arrow (explicit return)
    {
      code: `const double = (x) => { return x * 2; };`,
    },
    // Predicate in .map
    {
      code: `const ids = items.map(item => item.id);`,
    },
    // Predicate in .filter
    {
      code: `const active = items.filter(item => item.active);`,
    },
    // Predicate in .some
    {
      code: `const hasAdmin = users.some(u => u.role === "admin");`,
    },
    // Predicate in .every
    {
      code: `const allValid = items.every(item => item.valid);`,
    },
    // Predicate in .find
    {
      code: `const found = items.find(item => item.id === targetId);`,
    },
    // Predicate in .findIndex
    {
      code: `const idx = items.findIndex(item => item.id === targetId);`,
    },
    // Predicate in .reduce
    {
      code: `const sum = items.reduce((acc, item) => acc + item.value, 0);`,
    },
    // Sort comparator
    {
      code: `const sorted = items.sort((a, b) => a.name.localeCompare(b.name));`,
    },
    // Sort with toSorted
    {
      code: `const sorted = items.toSorted((a, b) => a - b);`,
    },
    // Predicate in .flatMap
    {
      code: `const flat = items.flatMap(item => item.children);`,
    },
    // Block body arrow in map (explicit return with JSX is fine)
    {
      code: `const els = items.map(item => { return <div>{item}</div>; });`,
    },
  ],
});
