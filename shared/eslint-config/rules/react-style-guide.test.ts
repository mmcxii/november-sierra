import { RuleTester } from "@typescript-eslint/rule-tester";
import path from "node:path";
import { afterAll, describe, it } from "vitest";
import { reactStyleGuide } from "./react-style-guide.js";

RuleTester.afterAll = afterAll;
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    parserOptions: {
      ecmaFeatures: { jsx: true },
    },
  },
  // Default filename satisfies the fileNaming sub-rule
  settings: {},
});

const validFilename = "src/components/foo-bar/index.tsx";
const validHookFilename = "src/hooks/use-counter/index.ts";

ruleTester.run("react-style-guide", reactStyleGuide, {
  invalid: [
    // 0. fileNaming
    {
      code: `
export const Foo: React.FC = () => {
  return <div />;
};
      `,
      errors: [{ messageId: "fileNaming" }],
      filename: "src/components/Foo.tsx",
      name: "fileNaming — component not in index file",
    },
    {
      code: `
export function useCounter() {
  return 0;
}
      `,
      errors: [{ messageId: "fileNaming" }],
      filename: "src/hooks/useCounter.ts",
      name: "fileNaming — hook not in index file",
    },
    {
      code: `
export const Foo: React.FC = () => {
  return <div />;
};
      `,
      errors: [{ messageId: "fileNaming" }],
      filename: "src/components/FooBar/index.tsx",
      name: "fileNaming — folder not kebab-cased",
    },
    // 1. inlineProps
    {
      code: `
export const Foo: React.FC<{ x: string }> = (props) => {
  return <div />;
};
      `,
      errors: [{ messageId: "inlineProps" }],
      filename: validFilename,
      name: "inlineProps — inline type literal in React.FC",
      output: `
export type FooProps = { x: string };

export const Foo: React.FC<FooProps> = (props) => {
  return <div />;
};
      `,
    },
    // 2. destructuredParams (component)
    {
      code: `
export const Foo: React.FC<FooProps> = ({ x, y }) => {
  return <div />;
};
      `,
      errors: [{ messageId: "destructuredParams" }],
      filename: validFilename,
      name: "destructuredParams — component destructured params",
      output: `
export const Foo: React.FC<FooProps> = (props) => {
  const { x, y } = props;

  return <div />;
};
      `,
    },
    // 3. destructuredParams (hook)
    {
      code: `
export function useFoo({ a }: Options) {
  return a;
}
      `,
      errors: [{ messageId: "destructuredParams" }],
      filename: validHookFilename,
      name: "destructuredParams — hook destructured params",
      output: `
export function useFoo(params: Options) {
  const { a } = params;

  return a;
}
      `,
    },
    // 4. destructuredParams with type annotation on component
    {
      code: `
export const Foo: React.FC<FooProps> = ({ x }: FooProps) => {
  return <div />;
};
      `,
      errors: [{ messageId: "destructuredParams" }],
      filename: validFilename,
      name: "destructuredParams — component with type annotation",
      output: `
export const Foo: React.FC<FooProps> = (props: FooProps) => {
  const { x } = props;

  return <div />;
};
      `,
    },
    // 5. sectionOrder — Effects before State
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* Effects
  React.useEffect(() => {}, []);

  //* State
  const [a, setA] = React.useState(0);

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "sectionOrder" }],
      filename: validFilename,
      name: "sectionOrder — Effects before State",
      output: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  //* Effects
  React.useEffect(() => {}, []);

  return <div>{x}</div>;
};
      `,
    },
    // 6. emptySection
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  //* Refs

  //* Variables
  const b = a + 1;

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "emptySection" }],
      filename: validFilename,
      name: "emptySection — Refs section with no content",
      output: [
        `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);
  //* Variables
  const b = a + 1;

  return <div>{x}</div>;
};
      `,
        `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  //* Variables
  const b = a + 1;

  return <div>{x}</div>;
};
      `,
      ],
    },
    // 7. missingBlankLine — no blank line after destructuring
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;
  //* State
  const [a, setA] = React.useState(0);

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "missingBlankLine" }],
      filename: validFilename,
      name: "missingBlankLine — no blank line after destructuring",
      output: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  return <div>{x}</div>;
};
      `,
    },
    // 8. missingBlankLine — no blank line before section header
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);
  //* Handlers
  const onClick = () => {};

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "missingBlankLine" }],
      filename: validFilename,
      name: "missingBlankLine — no blank line before section header",
      output: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  //* Handlers
  const onClick = () => {};

  return <div>{x}</div>;
};
      `,
    },
    // 9. missingBlankLine — no blank line before early return
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);
  if (a == null) { return null; }

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "missingBlankLine" }],
      filename: validFilename,
      name: "missingBlankLine — no blank line before early return",
      output: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  if (a == null) { return null; }

  return <div>{x}</div>;
};
      `,
    },
    // 10. earlyReturn — if/return before sections
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  if (x == null) { return null; }

  //* State
  const [a, setA] = React.useState(0);

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "earlyReturn" }],
      filename: validFilename,
      name: "earlyReturn — if/return before sections",
    },
    // 11. earlyReturn — if/return between sections
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [a, setA] = React.useState(0);

  if (a == null) { return null; }

  //* Handlers
  const onClick = () => {};

  return <div>{x}</div>;
};
      `,
      errors: [{ messageId: "earlyReturn" }],
      filename: validFilename,
      name: "earlyReturn — if/return between sections",
    },
    // 12. reactNamespaceImport — named import
    {
      code: `
import { useState } from "react";
export const Foo: React.FC = () => {
  const [a, setA] = useState(0);
  return <div />;
};
      `,
      errors: [{ messageId: "reactNamespaceImport" }],
      filename: validFilename,
      name: "reactNamespaceImport — named import",
      output: `
import * as React from "react";
export const Foo: React.FC = () => {
  const [a, setA] = React.useState(0);
  return <div />;
};
      `,
    },
    // 13. reactNamespaceImport — mixed type and value specifiers
    {
      code: `
import { type RefCallback, useCallback } from "react";
export const Foo: React.FC = () => {
  const cb: RefCallback<HTMLDivElement> = useCallback(() => {}, []);
  return <div />;
};
      `,
      errors: [{ messageId: "reactNamespaceImport" }],
      filename: validFilename,
      name: "reactNamespaceImport — mixed type and value specifiers",
      output: `
import * as React from "react";
export const Foo: React.FC = () => {
  const cb: React.RefCallback<HTMLDivElement> = React.useCallback(() => {}, []);
  return <div />;
};
      `,
    },
    // 14. reactNamespaceImport — named component import
    {
      code: `
import { Suspense } from "react";
export const Foo: React.FC = () => {
  return <Suspense fallback={null}><div /></Suspense>;
};
      `,
      errors: [{ messageId: "reactNamespaceImport" }],
      filename: validFilename,
      name: "reactNamespaceImport — named component import (Suspense)",
      output: `
import * as React from "react";
export const Foo: React.FC = () => {
  return <React.Suspense fallback={null}><div /></React.Suspense>;
};
      `,
    },
    // 15. reactNamespaceImport — default import
    {
      code: `
import React from "react";
export const Foo: React.FC = () => {
  return <div />;
};
      `,
      errors: [{ messageId: "reactNamespaceImport" }],
      filename: validFilename,
      name: "reactNamespaceImport — default import",
      output: `
import * as React from "react";
export const Foo: React.FC = () => {
  return <div />;
};
      `,
    },
    // 16. sectionAssignment — React.useRef() in State → should be Refs
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const ref = React.useRef(null);

  return <div />;
};
      `,
      errors: [
        { data: { actual: "State", description: "React.useRef()", expected: "Refs" }, messageId: "sectionAssignment" },
      ],
      filename: validFilename,
      name: "sectionAssignment — React.useRef() in State",
    },
    // 17. sectionAssignment — React.useEffect() in Handlers → should be Effects
    {
      code: `
export const Foo: React.FC = () => {
  //* Handlers
  React.useEffect(() => {}, []);

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Handlers", description: "React.useEffect()", expected: "Effects" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — React.useEffect() in Handlers",
    },
    // 18. sectionAssignment — arrow function in Variables → should be Handlers
    {
      code: `
export const Foo: React.FC = () => {
  //* Variables
  const onClick = () => {};

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Variables", description: "Function assignment", expected: "Handlers" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — arrow function in Variables",
    },
    // 19. sectionAssignment — React.useMemo() in Handlers → should be Variables
    {
      code: `
export const Foo: React.FC = () => {
  //* Handlers
  const memo = React.useMemo(() => 42, []);

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Handlers", description: "React.useMemo()", expected: "Variables" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — React.useMemo() in Handlers",
    },
    // 20. sectionAssignment — React.useCallback() in Refs → should be Handlers
    {
      code: `
export const Foo: React.FC = () => {
  //* Refs
  const onClick = React.useCallback(() => {}, []);

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Refs", description: "React.useCallback()", expected: "Handlers" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — React.useCallback() in Refs",
    },
    // 21. sectionAssignment — derived value in Handlers → should be Variables
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const [count, setCount] = React.useState(0);

  //* Handlers
  const doubled = count * 2;

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Handlers", description: "Derived value", expected: "Variables" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — derived value (count * 2) in Handlers",
    },
    // 22. hookDeclaration — arrow with block body
    {
      code: `
export const useFoo = () => { return 0; };
      `,
      errors: [{ data: { name: "useFoo" }, messageId: "hookDeclaration" }],
      filename: validHookFilename,
      name: "hookDeclaration — arrow with block body",
      output: `
export function useFoo() { return 0; }
      `,
    },
    // 23. hookDeclaration — arrow with expression body
    {
      code: `
export const useFoo = () => value;
      `,
      errors: [{ data: { name: "useFoo" }, messageId: "hookDeclaration" }],
      filename: validHookFilename,
      name: "hookDeclaration — arrow with expression body",
      output: `
export function useFoo() { return value; }
      `,
    },
    // 24. componentDeclaration — function declaration component
    {
      code: `
export function Foo() { return <div />; }
      `,
      errors: [{ data: { name: "Foo" }, messageId: "componentDeclaration" }],
      filename: validFilename,
      name: "componentDeclaration — export function Foo()",
    },
    // 25–29. sectionAssignment — new classification invalid tests
    {
      code: `
export const Foo: React.FC = () => {
  //* Handlers
  const [x, setX] = React.useState(0);

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Handlers", description: "React.useState()", expected: "State" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — React.useState() in Handlers",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Variables
  const ctx = React.useContext(Ctx);

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Variables", description: "React.useContext()", expected: "State" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — React.useContext(Ctx) in Variables",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Variables
  const { t } = useTranslation();

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Variables", description: "useTranslation()", expected: "State" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — useTranslation() in Variables",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Handlers
  useSomeCustomEffect();

  return <div />;
};
      `,
      errors: [
        {
          data: { actual: "Handlers", description: "useSomeCustomEffect()", expected: "Effects" },
          messageId: "sectionAssignment",
        },
      ],
      filename: validFilename,
      name: "sectionAssignment — useSomeCustomEffect() bare call in Handlers",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const fooRef = useFooRef();

  return <div />;
};
      `,
      errors: [
        { data: { actual: "State", description: "useFooRef()", expected: "Refs" }, messageId: "sectionAssignment" },
      ],
      filename: validFilename,
      name: "sectionAssignment — useFooRef() in State",
    },
    // 30. propsDestructuringLocation — statement before destructuring
    {
      code: `
export const Foo: React.FC<FooProps> = (props) => {
  const x = 1;
  const { foo } = props;

  return <div />;
};
      `,
      errors: [{ messageId: "propsDestructuringLocation" }],
      filename: validFilename,
      name: "propsDestructuringLocation — statement before destructuring",
    },
    // 31. propsTypeNaming — wrong props type name
    {
      code: `
export const Foo: React.FC<WrongName> = (props) => {
  return <div />;
};
      `,
      errors: [{ data: { actual: "WrongName", expected: "FooProps" }, messageId: "propsTypeNaming" }],
      filename: validFilename,
      name: "propsTypeNaming — React.FC<WrongName> on component Foo",
    },
    // 32. missingFCAnnotation — PascalCase arrow without React.FC
    {
      code: `
export const Foo = () => {
  return <div />;
};
      `,
      errors: [{ data: { name: "Foo" }, messageId: "missingFCAnnotation" }],
      filename: validFilename,
      name: "missingFCAnnotation — export const Foo = () => in .tsx",
    },
  ],
  valid: [
    {
      code: `
export type FooProps = { x: string };
export const Foo: React.FC<FooProps> = (props) => {
  const { x } = props;

  //* State
  const [count, setCount] = React.useState(0);

  //* Refs
  const ref = React.useRef(null);

  //* Variables
  const doubled = count * 2;

  //* Handlers
  const onClick = () => setCount(count + 1);

  //* Effects
  React.useEffect(() => {}, []);

  if (count > 10) { return null; }

  return <div>{x}</div>;
};
      `,
      filename: validFilename,
      name: "canonical component with all sections",
    },
    {
      code: `
import * as React from "react";
export const Foo: React.FC = () => {
  return <div />;
};
      `,
      filename: validFilename,
      name: "namespace import — import * as React from react",
    },
    {
      code: `
export const Foo: React.FC = () => {
  return <div />;
};
      `,
      filename: validFilename,
      name: "no react import at all",
    },
    {
      code: `
export type BarProps = { label: string };
export const Bar: React.FC<BarProps> = (props) => {
  const { label } = props;

  return <span>{label}</span>;
};
      `,
      filename: validFilename,
      name: "minimal component without sections",
    },
    {
      code: `
export function useCounter(initialCount: number) {
  //* State
  const [count, setCount] = React.useState(initialCount);

  //* Handlers
  const increment = () => setCount(c => c + 1);

  return { count, increment };
}
      `,
      filename: validHookFilename,
      name: "hook with correct section order",
    },
    {
      code: `
export type BazProps = { id: string };
export const Baz: React.FC<BazProps> = (props) => {
  const { id } = props;

  //* State
  const [open, setOpen] = React.useState(false);

  //* Handlers
  const toggle = () => setOpen(o => !o);

  return <div>{id}</div>;
};
      `,
      filename: validFilename,
      name: "partial sections — only State + Handlers",
    },
    {
      code: `
export const Empty: React.FC = () => {
  return <div />;
};
      `,
      filename: validFilename,
      name: "React.FC with no type arguments",
    },
    {
      code: `
export type MultiProps = { a: string };
export const Multi: React.FC<MultiProps> = (props) => {
  const { a } = props;

  //* State
  const [x, setX] = React.useState(0);
  const [y, setY] = React.useState(0);
  const [z, setZ] = React.useState(0);

  return <div>{a}</div>;
};
      `,
      filename: validFilename,
      name: "multiple items within a section without blank lines",
    },
    // sectionAssignment — valid placements
    {
      code: `
export const Foo: React.FC = () => {
  //* Refs
  const ref = React.useRef(null);

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — React.useRef() in Refs",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const [count, setCount] = React.useState(0);

  //* Variables
  const doubled = count * 2;

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — derived value in Variables",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Variables
  const memo = React.useMemo(() => 42, []);

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — React.useMemo() in Variables",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Handlers
  const onClick = () => {};

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — arrow function in Handlers",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Handlers
  const onClick = React.useCallback(() => {}, []);

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — React.useCallback() in Handlers",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Effects
  React.useEffect(() => {}, []);

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — React.useEffect() in Effects",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const { t } = useTranslation();

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — useTranslation() in State",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Variables
  const result = computeValue();

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — non-hook call in Variables",
    },
    {
      code: `
export function useFoo() { return 0; }
      `,
      filename: validHookFilename,
      name: "hookDeclaration — function declaration hook",
    },
    // sectionAssignment — new classification valid tests
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const [x, setX] = React.useState(0);

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — React.useState() in State",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const ctx = React.useContext(SomeContext);

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — React.useContext(SomeContext) in State",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Effects
  useSomeCustomEffect();

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — useSomeCustomEffect() bare call in Effects",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* Refs
  const fooRef = useFooRef();

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — useFooRef() in Refs",
    },
    {
      code: `
export const Foo: React.FC = () => {
  //* State
  const data = useSomeQuery();

  return <div />;
};
      `,
      filename: validFilename,
      name: "sectionAssignment — useSomeQuery() in State (custom assigned hook, skipped)",
    },
    // missingFCAnnotation — valid (.ts file skipped)
    {
      code: `
export const Foo = () => {};
      `,
      filename: "src/lib/foo-bar/index.ts",
      name: "missingFCAnnotation — .ts file is skipped",
    },
    // propsDestructuringLocation — valid
    {
      code: `
export const Foo: React.FC = () => {
  return <div />;
};
      `,
      filename: validFilename,
      name: "propsDestructuringLocation — component with no params",
    },
    // componentDeclaration — valid (function declaration hook is allowed)
    {
      code: `
export function useBar() { return 1; }
      `,
      filename: validHookFilename,
      name: "componentDeclaration — function declaration hook is allowed",
    },
  ],
});

// --- Type-aware tests for hookReturnType ---
const typeAwareRuleTester = new RuleTester({
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

typeAwareRuleTester.run("react-style-guide (hookReturnType)", reactStyleGuide, {
  invalid: [
    // hookReturnType should NOT fire — has explicit return type annotation (only fileNaming fires)
    {
      code: `
type UseFooResult = { x: number };
export function useFoo(): UseFooResult { return { x: 1 }; }
      `,
      errors: [{ messageId: "fileNaming" }],
      name: "hookReturnType — has explicit return type annotation",
    },
    // hookReturnType should NOT fire — scalar return (only fileNaming fires)
    {
      code: `
export function useFoo() { return "hello"; }
      `,
      errors: [{ messageId: "fileNaming" }],
      name: "hookReturnType — scalar return (string)",
    },
    {
      code: `
export function useFoo() { return null; }
      `,
      errors: [{ messageId: "fileNaming" }],
      name: "hookReturnType — scalar return (null)",
    },
    // hookReturnType SHOULD fire — non-scalar returns without annotation
    {
      code: `
export function useFoo() { return { x: 1 }; }
      `,
      errors: [{ messageId: "fileNaming" }, { messageId: "hookReturnType" }],
      name: "hookReturnType — object return without annotation",
    },
    {
      code: `
export function useFoo() { return [1, 2]; }
      `,
      errors: [{ messageId: "fileNaming" }, { messageId: "hookReturnType" }],
      name: "hookReturnType — array return without annotation",
    },
  ],
  valid: [],
});
