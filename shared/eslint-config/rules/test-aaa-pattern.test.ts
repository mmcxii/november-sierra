import { RuleTester } from "@typescript-eslint/rule-tester";
import { afterAll, describe, it } from "vitest";
import { testAaaPattern } from "./test-aaa-pattern.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester();

ruleTester.run("test-aaa-pattern", testAaaPattern, {
  invalid: [
    {
      code: `
it("does something", () => {
  const x = 1;
  doThing(x);
  expect(x).toBe(1);
});
`,
      errors: [{ messageId: "missingAct" }, { messageId: "missingAssert" }],
      name: "no section headers → missingAct + missingAssert",
    },
    {
      code: `
it("does something", () => {
  //* Arrange
  const x = 1;

  //* Assert
  expect(x).toBe(1);
});
`,
      errors: [
        { messageId: "missingAct" },
        {
          data: { current: "Assert", expected: "Act", previous: "Arrange" },
          messageId: "invalidSectionOrder",
        },
      ],
      name: "Arrange + Assert without Act → missingAct + invalidSectionOrder",
    },
    {
      code: `
it("does something", () => {
  //* Arrange
  const x = 1;

  //* Act
  doThing(x);
});
`,
      errors: [{ messageId: "missingAssert" }],
      name: "Arrange + Act without Assert → missingAssert",
    },
    {
      code: `
it("does something", () => {
  //* Act
  const result = doThing();

  expect(result).toBe(1);

  //* Assert
  expect(result).toBe(1);
});
`,
      errors: [{ messageId: "expectOutsideAssert" }],
      name: "expect() in Act section → expectOutsideAssert",
    },
    {
      code: `
it("does something", () => {
  //* Arrange
  expect(setup()).toBe(true);

  //* Act
  doThing();

  //* Assert
  expect(1).toBe(1);
});
`,
      errors: [{ messageId: "expectOutsideAssert" }],
      name: "expect() in Arrange section → expectOutsideAssert",
    },
    {
      code: `
it("does something", () => {
  //* Assert
  expect(1).toBe(1);

  //* Arrange
  const x = 1;

  //* Assert
  expect(x).toBe(1);
});
`,
      errors: [
        { messageId: "missingAct" },
        {
          data: { current: "Assert", expected: "Arrange or Act", previous: "start" },
          messageId: "invalidSectionOrder",
        },
        {
          data: { current: "Assert", expected: "Act", previous: "Arrange" },
          messageId: "invalidSectionOrder",
        },
      ],
      name: "Assert → Arrange → Assert (missing Act between) → invalidSectionOrder",
    },
    {
      code: `
it("does something", () => {
  //* Act
  doThing();

  //* Arrange
  const x = 1;

  //* Assert
  expect(x).toBe(1);
});
`,
      errors: [
        {
          data: { current: "Arrange", expected: "Assert", previous: "Act" },
          messageId: "invalidSectionOrder",
        },
        {
          data: { current: "Assert", expected: "Act", previous: "Arrange" },
          messageId: "invalidSectionOrder",
        },
      ],
      name: "Act → Arrange (act not followed by assert) → invalidSectionOrder",
    },
  ],
  valid: [
    {
      code: `
it("does something", () => {
  //* Arrange
  const x = 1;

  //* Act
  const result = doThing(x);

  //* Assert
  expect(result).toBe(1);
});
`,
      name: "all three sections (Arrange, Act, Assert)",
    },
    {
      code: `
it("does something", () => {
  //* Act
  const result = doThing();

  //* Assert
  expect(result).toBe(1);
});
`,
      name: "Act + Assert only (Arrange is optional)",
    },
    {
      code: `
test("does something", () => {
  //* Act
  const result = doThing();

  //* Assert
  expect(result).toBe(1);
});
`,
      name: "test() works the same as it()",
    },
    {
      code: `
it("does multiple things", () => {
  //* Arrange
  const x = 1;

  //* Act
  const result1 = doThing(x);

  //* Assert
  expect(result1).toBe(1);

  //* Act
  const result2 = doOtherThing(x);

  //* Assert
  expect(result2).toBe(2);
});
`,
      name: "multiple AAA sequences: Arrange → Act → Assert → Act → Assert",
    },
    {
      code: `
test("works with trailing descriptions", () => {
  //* Arrange — set up preconditions
  const x = 1;

  //* Act — perform the action
  const result = doThing(x);

  //* Assert — verify outcome
  expect(result).toBe(1);
});
`,
      name: "section headers with trailing descriptions",
    },
  ],
});
