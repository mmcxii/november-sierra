# Contributing

Thank you for your interest in contributing to this project.

## License Boundaries

This monorepo contains packages under different licenses. Your contribution is
governed by the license of the package you are modifying:

| Directory          | License           | What this means                                                                  |
| ------------------ | ----------------- | -------------------------------------------------------------------------------- |
| `anchr/`           | AGPL-3.0-or-later | Contributions fall under the AGPL-3.0. Derivative works must remain open-source. |
| `shared/`          | MIT               | Contributions fall under the MIT license.                                        |
| `november-sierra/` | MIT               | Contributions fall under the MIT license.                                        |

### Cross-license imports

AGPL-licensed code in `anchr/` **must not** be imported into MIT-licensed
packages (`shared/`, `november-sierra/`). This is enforced by an ESLint rule
(`anchr/no-cross-license-import`) and will fail CI if violated.

The reverse (MIT code imported into AGPL packages) is fine.

## Development

```bash
# Install dependencies
pnpm install

# Start the Anchr dev server
turbo dev --filter=@november-sierra/anchr-website

# Run all checks
turbo build lint typecheck test
```

## Commit Messages

Commit messages must follow this format:

```
ANC-123: feat(scope): description
NS-123: fix(scope): description
```

- `ANC-*` — Anchr product tickets
- `NS-*` — Company-wide / cross-product tickets

Enforced by commitlint via a pre-commit hook.
