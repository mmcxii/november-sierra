# November Sierra

Monorepo for November Sierra products and shared tooling.

## Structure

```
├── anchr/
│   ├── website/        @november-sierra/anchr-website    AGPL-3.0
│   └── docs/           Anchr brand guidelines
├── shared/
│   └── eslint-config/  @november-sierra/eslint-config    MIT
├── november-sierra/    (future: company website)
└── scripts/            Shared validation and build scripts
```

## Development

```bash
pnpm install

# Start the Anchr dev server
turbo dev --filter=@november-sierra/anchr-website

# Run all checks
turbo build lint typecheck test

# Run checks for a specific product
turbo build --filter=./anchr/*
```

## Testing

```bash
turbo test             # unit tests (all workspaces)
turbo test:e2e         # e2e tests
```

## Licensing

This repository contains packages under different licenses:

| Directory          | License           |
| ------------------ | ----------------- |
| `anchr/`           | AGPL-3.0-or-later |
| `shared/`          | MIT               |
| `november-sierra/` | MIT               |

Each workspace package has its own `LICENSE` file. See [CONTRIBUTING.md](./CONTRIBUTING.md) for license boundary guidance.
