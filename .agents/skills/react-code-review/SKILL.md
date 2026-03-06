---
name: react-code-review
description: "Enforce React/TypeScript code style rules. Run proactively after writing or modifying any React component, hook, or related file (.tsx, .ts in component/hook directories). Also run when the user explicitly invokes this skill. Auto-fix all violations found. Triggers on: creating components, writing hooks, editing React files, refactoring, or when user says 'review my code', 'code review', 'check style', 'react-code-review'."
---

# React Code Review

Enforce strict React/TypeScript code style. Review all changed React files, identify violations, and auto-fix them.

## Rules

### 1. React Import

Always use namespace import:

```tsx
// CORRECT
import * as React from "react";

// WRONG
import React from "react";
import { useState, useEffect } from "react";
```

### 2. File Structure

Components and hooks always use a folder with `index.tsx`:

```
my-component/
  index.tsx
  utils.ts          (optional — local helpers/constants)
  use-my-hook/      (optional — local hook)
    index.tsx

use-my-hook/
  index.tsx
  utils.ts          (optional)
```

- Subcomponents nest inside the parent component folder.
- Local utility functions and constants go in a `utils.ts` file in the component/hook folder.
- Props types are the ONLY types allowed in `index.tsx` alongside the component. All other types go in separate files.

### 3. Exports

- Named exports only. Never `export default` (ESLint handles Next.js-specific exceptions).

### 4. Types

- Use `type` over `interface` unless `interface` is absolutely required for a specific syntax edge case.
- Component props type is always exported and named `<ComponentName>Props`.
- Hook return types are required for non-trivial returns (a hook returning `null | string` doesn't need one).

### 5. Component Template

This is the canonical ordering. Every component MUST follow this structure:

```tsx
import * as React from "react";
import { useTranslation } from "react-i18next";
import { useSomeCustomEffect } from "./use-some-custom-effect";

export type MyComponentProps = {
  someProp: null | string;
};

export const MyComponent: React.FC<MyComponentProps> = (props) => {
  const { someProp } = props;

  //* State
  const { t } = useTranslation();
  const queryResult = useSomeQuery();
  const [someState, setSomeState] = React.useState();

  //* Refs
  const someRef = React.useRef();

  //* Variables
  const isSomething = someProp != null;
  const memoizedValue = React.useMemo(() => compute(someProp), [someProp]);

  //* Handlers
  const doSomething = () => {};
  const memoizedHandler = React.useCallback(() => {}, []);

  //* Effects
  useSomeCustomEffect();
  React.useEffect(() => {}, []);

  if (someProp == null) {
    return null;
  }

  return <div>...</div>;
};
```

### 6. Hook Template

Hooks use the same section ordering but `export function` syntax:

```tsx
import * as React from "react";

export type UseSomethingResult = {
  value: string;
  update: (v: string) => void;
};

export function useSomething(input: string): UseSomethingResult {
  //* State
  const [value, setValue] = React.useState(input);

  //* Refs
  const prevRef = React.useRef(input);

  //* Variables
  const isChanged = value !== prevRef.current;

  //* Handlers
  const update = React.useCallback((v: string) => setValue(v), []);

  //* Effects
  React.useEffect(() => {
    prevRef.current = input;
  }, [input]);

  return { value, update };
}
```

### 7. Section Header Rules

Headers use the `//*` comment style (double-slash asterisk, for better-comments extension):

```tsx
//* State
//* Refs
//* Variables
//* Handlers
//* Effects
```

- If a section would be empty, OMIT the header entirely.
- Sections appear in exactly this order: State → Refs → Variables → Handlers → Effects.
- Early returns (guard clauses) go AFTER Effects and BEFORE the main `return`. No section header for these.

### 8. Section Assignment

| What                                       | Section   |
| ------------------------------------------ | --------- |
| `useTranslation()`, `useContext()`         | State     |
| `React.useState()`                         | State     |
| react-query / data fetching hooks          | State     |
| `React.useRef()`                           | Refs      |
| Derived/computed values                    | Variables |
| `React.useMemo()`                          | Variables |
| Custom hooks returning non-stateful values | Variables |
| Event handlers, callbacks                  | Handlers  |
| `React.useCallback()`                      | Handlers  |
| `React.useEffect()`                        | Effects   |
| Custom effect hooks                        | Effects   |

Within State, order from most external (data fetching, context) to most internal (local UI state like modal open/close).

### 9. Props Destructuring

Always destructure props on the first line of the component body:

```tsx
export const MyComponent: React.FC<MyComponentProps> = (props) => {
  const { someProp, otherProp } = props;
  // ...
};
```

## Review Process

1. Identify all `.tsx` and `.ts` files that were created or modified.
2. For each file, check every rule above.
3. Auto-fix all violations directly in the file.
4. After fixing, briefly summarize what was changed and why.
