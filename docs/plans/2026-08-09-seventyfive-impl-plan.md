# Seventy Five — v0.1 Implementation Plan

## 1. Scaffold package

- Add `seventyfive/website` Next.js app mirroring Anchr tooling (Tailwind 4, ESLint shared config, Vitest, `reactCompiler`, t3 env)
- Register in `pnpm-workspace.yaml`, root README, CONTRIBUTING license table (MIT)
- Base layout: CSS variables for light/dark, fonts, i18n wiring (en)

## 2. Domain config + DB

- `src/lib/challenge/tasks.ts` — Hard/Soft task lists and labels
- Drizzle schema: groups, members, day_completions, task_checks, push_subscriptions, sessions
- `drizzle-kit generate` migration; local `db:push` OK, migrate for deployed
- Helpers: `endDateFromStart`, `recomputeMemberStatus`, `dayStatus`, reminder eligibility + remaining tasks copy

## 3. Auth session (cookie)

- Create session on create/join; HttpOnly cookie
- `getSessionMember()` for RSC/actions
- Confirm dialog path when replacing existing session

## 4. Create / join flows

- `/`, `/create`, `/join`
- Generate 64-char password; store hash; return raw once for invite UI
- Reject join if `today(group TZ or UTC date compare on startDate) >= start` — use date-only start, reject when local/UTC calendar date ≥ start (group start is a date; “passed” = current UTC date > start or ≥ start at beginning of that day — **rule:** join allowed while `utcToday < startDate`)

## 5. Group board

- `/group` with day picker, roster for selected day, personal checklist
- Server actions: `setTaskChecked`, owner `updateGroup`, invite data
- Enforce edit rules (past/today, Hard failed locks today)

## 6. Settings

- `/settings` — name, TZ, reminder on/off + time, mode pre-start only
- Push permission + store subscription when enabling reminder

## 7. PWA + cron reminder

- Manifest, icons, service worker
- `GET /api/cron/reminders` secured by `CRON_SECRET`
- Push body: remaining task labels; `lastReminderDate` dedupe
- `vercel.json`: 24 once-daily crons (hourly UTC coverage) for Hobby plan limits

## 8. Tests + polish hygiene

- Unit tests for domain helpers
- Smoke typecheck/lint/build for the new package

## Vertical slices (build order)

1. Scaffold + schema + task config + unit tests for pure helpers
2. Create/join + session + empty board shell
3. Checklist + fail/stumble recompute + roster
4. Owner edit + invite UI + settings
5. PWA + reminder cron
6. Polish light/dark + landing

## Simplicity constraints

- One Postgres DB only — no Redis/Upstash
- No e2e suite required for first merge
- Checkbox-only progress photo
