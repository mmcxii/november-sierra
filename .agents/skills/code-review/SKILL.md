---
name: code-review
description: "Review code as though it were written by another engineer. Audit for over-engineering, simplification opportunities, test coverage gaps, and useless tests. Triggers on: 'code review', 'review this PR', 'review the code', 'audit this', or when the user says '/code-review'."
---

# Code Review

Review the code in the current PR (or specified changeset) as though it were written by another engineer. Be BRUTAL. Fix anything that needs to be fixed and update the existing PR if it hasn't been merged yet.

## Review Checklist

### 1. Over-engineering

- Are there abstractions that only serve one call site?
- Are there separate state variables that always change together? (Collapse into one object.)
- Are there sentinel values (undefined vs null vs value) when a simpler type would work?
- Are there explicit type annotations that TypeScript already infers?
- Are there unnecessary exports?

### 2. Simplification

- Are there duplicate handlers or functions that do the same thing? (Collapse into one.)
- Are there redundant intermediate variables?
- Can the data flow be made more direct?
- Are there unnecessary wrapper types that just re-export fields from another type?

### 3. Correctness

- Do existing tests still pass with the changes? Look for tests that assert behavior the PR changed — those tests are now broken.
- Are there race conditions, especially in async flows?
- Are error paths handled, or silently swallowed?
- Do conditional renders match the intended behavior for all prop combinations?

### 4. Test Coverage Audit

Audit unit, integration, AND e2e tests. For each:

- **Identify broken tests**: Tests that assert old behavior the PR changed. These are bugs, not just gaps.
- **Identify gaps**: New behavior paths with no test coverage. Prioritize paths that are user-facing or involve data mutations.
- **Identify useless tests**: Tests that don't assert meaningful behavior, duplicate other tests, or test implementation details rather than outcomes.
- **Maximize value per test**: Prefer fewer tests that cover more meaningful paths over many shallow tests. Every test should justify its existence.

### 5. API Design

- Are component prop interfaces minimal and hard to misuse?
- Do server action return types contain only what callers need?
- Are prop names consistent with existing patterns in the codebase?

## Process

1. Read ALL changed files in the PR/changeset.
2. Read ALL related test files (unit, integration, e2e).
3. Identify issues against the checklist above.
4. Present findings as a numbered list with severity and file:line references.
5. Fix every issue directly — do not just report them.
6. Amend the existing commit (single commit per branch) and force push.
