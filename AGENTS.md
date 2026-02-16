# Anchr

Next.js 16 app with React 19, TypeScript, and Tailwind CSS 4.

## Tooling

- **Package manager**: pnpm (monorepo with pnpm-workspace.yaml)
- **Path alias**: `@/*` maps to `./src/*`
- **Linting/formatting**: ESLint, Prettier (with Tailwind plugin), Sortier — all enforced via lint-staged on pre-commit

## Git Conventions

- Always use `git add -A` when adding all unstaged files.

### Branches

All branches must match: `<username>/TICKET-NUMBER--optional-description`.

#### Example Branch Name

- `nsecord/ANC-95`
- `nsecord/ANC-95--setup-agents`

### Commits

- Message structure is enforced by commitlint via husky pre-commit hook.
- Always use a single commit per feature branch, no exceptions.

#### Example Commit Message

```
ANC-95: feat(agents): add initial skills and initialize AGENTS.md
- add brainstorming, copywriting, frontend-design, skill-creator, and vercel-react-best-practices skills.
- add Tooling and Git Conventions sections to AGENTS.md
```
