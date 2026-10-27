---
name: swift-code-review
description: "Enforce Swift/SwiftUI code style rules. Run proactively after writing or modifying any .swift file (views, view models, intents, widgets, tests). Also run when the user explicitly invokes this skill. Auto-fix all violations found. Triggers on: creating views, editing Swift files, writing Swift tests, refactoring, or when user says 'review my Swift', 'check style', 'swift-code-review'."
---

# Swift Code Review

Swift counterpart of `react-code-review`. Most rules are enforced by tools, so run them first and fix what they report:

```bash
swift format --in-place --recursive <paths>
swift format lint --strict --recursive <paths>
swift run --package-path shared/swift-style swift-style --fix <paths>
```

The pre-commit hook (`scripts/swift-lint-staged.sh`) and the `Swift Style` CI workflow run the same commands. `--fix` reorders view members and writes section headers; everything else it reports must be fixed by hand.

## Rules

### 1. Formatting (`swift format`, config in `/.swift-format`)

- 2-space indent, 120 columns, ordered imports.
- No force unwraps (`!`), `try!`, or implicitly unwrapped optionals outside tests. Use `guard let`, `URL(literal:)` for URLs written in source, or `try #require` in tests.
- No retroactive conformances. Conform types in the module that owns them.

### 2. One view per file (`one-view-per-file`)

- A file with a SwiftUI `View` or `ViewModifier` is named after it: `HeaderView.swift`.
- It may also hold extensions of that view, `#Preview`, and `private` helpers. A modifier's `extension View` convenience method stays with the modifier.
- Shared types, other views, and extensions of other types go in their own files. Group related files in folders (`Views/Settings/`, `Widgets/Header/`).

### 3. View template (`view-sections`)

Members appear in this order, each section under a `// MARK:` header once the view has State or Handlers. Omit empty sections.

```swift
struct LauncherRow: View {
  // MARK: Types
  enum Style { case plain, compact }

  // MARK: Inputs
  let item: LauncherItem
  @Binding var isEditing: Bool

  // MARK: State
  @Environment(AppModel.self) private var model
  @AppStorage("compact") private var isCompact = false
  @State private var isRenaming = false

  // MARK: Variables
  private var title: String { item.label }

  // MARK: Body
  var body: some View {
    Text(title)
      .sheet(isPresented: $isRenaming) { RenameView(item: item) }
      .task { await model.refresh() }
  }

  // MARK: Handlers
  private func rename(to label: String) {}
}
```

| What                                                                                                    | Section   |
| ------------------------------------------------------------------------------------------------------- | --------- |
| Nested types and typealiases                                                                            | Types     |
| Non-private stored properties, `@Binding`, `@Bindable`, `init`                                          | Inputs    |
| `@Environment`, then `@Query`/`@AppStorage`/`@ObservedObject`, then `@State`/`@FocusState`/`@Namespace` | State     |
| Computed properties, `static` members, private constants                                                | Variables |
| `body` (or `body(content:)` in a `ViewModifier`)                                                        | Body      |
| Functions                                                                                               | Handlers  |

State goes from most external to most local, like the React rule.

### 4. Effects come last (`view-effects-last`)

SwiftUI effects are modifiers: `.task`, `.onAppear`, `.onDisappear`, `.onChange`, `.onReceive`, `.onOpenURL`, `.onPreferenceChange`, `.onContinueUserActivity`. They are the last modifiers on `body`'s outermost view, after layout, styling, and presentation modifiers.

### 5. Expressions

- No nested ternaries (`no-nested-ternary`). Use `if`/`switch` expressions.
- No `as!` (`no-force-cast`).

### 6. Tests (`test-arrange-act-assert`)

Swift Testing `@Test` functions use `// Arrange` (optional), `// Act`, and `// Assert` comments, in that order. Act and Assert pairs may repeat. `#expect` only appears under `// Assert`; `try #require` may appear anywhere.

```swift
@Test func handoffIsConsumedOnce() {
  // Arrange
  store.stageLaunch(appName: "Camera", now: now)

  // Act
  let first = store.consumePendingLaunch(now: now)

  // Assert
  #expect(first == "Camera")
}
```

### 7. Compiler

App targets use Swift 6 language mode with warnings as errors. Fix concurrency diagnostics rather than suppressing them; `nonisolated(unsafe)` needs a comment explaining why it is safe.

## Escape hatch

`// swift-style:ignore <rule-id>` on the line above (or at the end of the line) silences one violation. Use it only with a reason the reviewer can see.

## Review Process

1. Identify all `.swift` files that were created or modified.
2. Run the three commands above on them and fix every remaining violation.
3. Check the rules the tools can't see: section assignment makes sense, folders group related files, and no logic hides in `body` that belongs in a handler.
4. Briefly summarize what was changed and why.
