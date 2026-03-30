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

## Database

- **Never use `drizzle-kit push` (or `pnpm db:push`) against deployed databases** (stage, production). It computes a runtime diff and can silently skip changes.
- Use **`drizzle-kit migrate` (`pnpm db:migrate`)** for all deployed environments. Migrations are versioned SQL files in `drizzle/` and are idempotent.
- After modifying any schema file in `src/lib/db/schema/`, run `pnpm drizzle-kit generate` to create a new migration file, and commit it alongside the schema change.
- `db:push` is acceptable **only** for local development and CI ephemeral databases (e.g., Neon E2E branches).

## Corrections

**Always be looking for ways to automate corrections via ESLint rules. Whenver you are corrected, changes to code style are requested, etc, consider how you could enforce that preference with an automated code quality tool. The goal is to prevent solving the same issue twice.**
