# Seventy Five — v0.1 Design

Accountability tracker for 75 Hard / 75 Soft private groups. No signup: group secret password + display name. Installable PWA with one daily reminder. Production domain: `https://seventyfive.team`.

## Goals

- Private groups via auto-generated 64-char password
- Mixed Hard/Soft members in one group
- Daily task checkoffs; Hard fail → readonly until retroactive fix; Soft stumble (visual only)
- PWA install + one opt-in daily web push listing remaining tasks
- No persistent user accounts or long-term history product surface in v0.1

## Non-goals (v0.1)

- Per-task notification toggles
- Photo upload for progress pics
- Multi-group membership per browser
- Late join after start date
- Redis/Upstash or other infra beyond one Postgres DB
- Offline-first sync

## Architecture

**Approach:** Server-owned challenge state.

- Package: `seventyfive/website` (`@november-sierra/seventyfive-website`)
- Stack: Next.js App Router, React 19, Drizzle, Neon Postgres, Tailwind, Zod, Vitest, shared ESLint
- Auth: HttpOnly cookie binding browser → one `memberId` (one active group per browser)
- Separate DB/env from Anchr
- Challenge task definitions in app-level config (easy Soft amendments, no per-group config)

## Data model

### `groups`

- `id`, `name`, `inviteCode` (unique 64-char secret), `startDate`, `endDate` (= start + 74 days), `createdAt`
- `ownerMemberId`

Invite code is a high-entropy capability secret stored so any member can copy password/link from the invite sheet.

### `members`

- `id`, `groupId`, `displayName`, `mode` (`hard` | `soft`), `timezone` (IANA)
- `isOwner`, `status` (`active` | `failed`) — Soft always `active`; stumble is derived
- `reminderEnabled` (default false), `reminderTime` (default `20:00`)
- `lastReminderDate` (dedupe push)
- `joinedAt`

### `day_completions`

- `id`, `memberId`, `date` (calendar date in member TZ)
- Unique `(memberId, date)`

### `task_checks`

- `id`, `dayCompletionId`, `taskId` (stable keys from config)
- `checkedAt`
- Unique `(dayCompletionId, taskId)`

### `push_subscriptions`

- `id`, `memberId`, endpoint + keys, `createdAt`

### `sessions` (optional table or signed cookie)

- Cookie carries signed `memberId` or opaque session id mapped to member

## Task config (app-level)

**Hard**

1. `workout` — Workout (45 min)
2. `outdoorWorkout` — Outdoor workout (45 min)
3. `water` — Drink 1 gallon of water
4. `diet` — Follow diet (no alcohol / cheat meals)
5. `progressPhoto` — Take progress photo (checkbox only)

**Soft**

1. `workout` — 45 min exercise
2. `diet` — Nutritious meals; no alcohol unless social (self-defined standards)
3. `water` — Drink 3 liters of water
4. `reading` — Read 10 pages

## Domain rules

- Group created before start; start ≠ created. No joins after start.
- Owner: edit name + start date until start has passed; end recomputed.
- Any member can invite (copy password + `/join?code=`).
- Day picker: view start→end; edit today + past only; future disabled.
- Hard: past incomplete day ⇒ `failed`, today locked until history fixed; retroactive checks restore `active`.
- Soft: never readonly; incomplete past days ⇒ stumble/off-track visual.
- Hard↔Soft switchable only before group start. Display name, TZ, reminder prefs anytime.
- Replacing session (create/join while already in a group) requires confirm.

## Routes

| Route       | Purpose                                               |
| ----------- | ----------------------------------------------------- |
| `/`         | Landing — Create / Join                               |
| `/create`   | Name + start date → creator profile → group           |
| `/join`     | Password/`code` → profile → group                     |
| `/group`    | Board: day picker, roster, personal checklist, invite |
| `/settings` | Member prefs + reminder                               |

## PWA & notifications

- Manifest + service worker; standalone; light + dark themes (system-aware)
- Opt-in reminder default 20:00 local; push body lists remaining task labels for today
- Cron scans DB only (no Redis): eligible active members, incomplete today, not yet reminded today
- Failed Hard members: no reminder
- Hobby-compatible scheduling: 24 daily Vercel crons (one per UTC hour) instead of `*/15`, since Hobby only allows once-per-day expressions

## UI

- Calm stoic utility: stone/ink neutrals, restrained accent, paper atmosphere
- Light and dark out of the box via CSS variables
- Brand “Seventy Five” hero on landing
- Board: simple roster list (not cards) + checklist rows; failed stark, Soft stumble quiet
- All copy via camelCase i18n keys (English only for v0.1)

## Security (simple)

- HTTPS; HttpOnly signed session cookie
- Authorize every mutation via session member
- Postgres only — no Redis/Upstash rate limiting in v0.1

## Testing

- Unit: task config, end date, fail/stumble recompute, reminder eligibility + remaining-task copy
- E2E smoke optional / later

## License / monorepo

- New top-level `seventyfive/` (MIT unless decided otherwise — align with company apps)
- Update `pnpm-workspace.yaml`, root README, CONTRIBUTING license table
