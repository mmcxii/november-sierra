# Anchr

Next.js 16 app with React 19, TypeScript, and Tailwind CSS 4.

## Tooling

- **Package manager**: pnpm (monorepo with pnpm-workspace.yaml)
- **Path alias**: `@/*` maps to `./src/*`
- **Linting/formatting**: ESLint, Prettier (with Tailwind plugin), Sortier — all enforced via lint-staged on pre-commit

## i18n

- All translation keys must be a **camelCased version of the English string** they represent. No dot notation, no abbreviations, no namespacing — the key is the value in camelCase.
- Examples: `signIn` → "Sign in", `somethingWentWrong` → "Something went wrong", `looksLikeYouveDriftedOffCourseThePageYoureLookingForDoesntExistOrHasBeenMoved` → "Looks like you've drifted off course. The page you're looking for doesn't exist or has been moved."
- When a string contains interpolation variables, include the `{{variable}}` placeholder in the key: `helloThere{{name}}` → "Hello there, {{name}}!"

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
