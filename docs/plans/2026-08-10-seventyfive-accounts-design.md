# SeventyFive — Multi-device accounts (design)

Minimal Better Auth accounts so the same person can use more than one browser/device. Account creation is a background side effect of create/join, not a separate product.

## Goals

- Username + password sign-in across devices (Better Auth)
- One account → many team memberships
- Keep create/join friction low (auto username/password when logged out)
- Clear Settings split: account vs team
- Temporary migration for existing cookie-only members (~two users; shim removable in ~a week)

## Non-goals (this slice)

- Email collection, password recovery, magic links, 2FA
- Per-team display names / nicknames
- Full team-transfer UX (only auto-transfer on account delete)
- Legacy `/team` route compatibility shims
- Formal “last active team” product surface beyond cheapest redirect

## Auth approach

**Library:** Better Auth (already used in Anchr), username + password only.

**Product email:** None. If Better Auth requires an email column, use a non-user-facing placeholder; UI stays username-only.

**Sign-in:** Dedicated `/sign-in` (username + password). Create/join stay focused on team entry; link to sign-in for returning users.

**Session:** Better Auth session replaces the current `sf_session` → `memberId` cookie as the identity root. Active board is selected by URL (`/teams/[teamId]`), not by a single member cookie.

## Account creation (background)

### Logged out → create or join

1. User completes today’s team fields (plus display name / timezone as profile seeds).
2. System creates Better Auth user:
   - **Username:** `displayName` coerced to lowercase; append random digits on conflict
   - **Password:** auto-generated (hashed by Better Auth)
   - **Display name + timezone:** stored on the user (global)
3. Create membership linked to `userId`, set session, continue flow.
4. **One-time credential step** before continuing:
   - Show username + generated password (copy controls)
   - On create only: also show team invite block (existing invite UX)
   - On join: credentials only (invite already used)
   - Required ack checkbox: “I saved my password”
   - Continue disabled until ack

### Logged in → create or join

- Skip account creation.
- Collect **team-only** fields (team name/start or invite code + challenge mode).
- Display name + timezone come from the account profile.
- Add membership; navigate to `/teams/[teamId]`.

## Username / password after creation

- Username and display name are **independent** after first derive.
- Settings can change username, display name, timezone, password.
- Passwords are hashed — **no reveal of an existing password**.
- Settings supports **change password** and **generate new password** (new value shown once + copy).
- No recover/reveal of the original auto password after the create/join (or migration) one-time step.

## Routing

| Route                      | Purpose                                                                       |
| -------------------------- | ----------------------------------------------------------------------------- |
| `/`                        | Marketing / entry; signed-in users redirect to a team if cheap, else `/teams` |
| `/sign-in`                 | Username + password                                                           |
| `/create`, `/join`         | Team entry (+ background account if logged out)                               |
| `/teams`                   | Simple membership picker                                                      |
| `/teams/[teamId]`          | Team board                                                                    |
| `/settings`                | Account: username, password, display name, timezone, sign out, delete account |
| `/teams/[teamId]/settings` | Team + membership: mode, reminders, owner team controls, leave/delete team    |

No legacy `/team` redirects.

**Bare `/teams` / signed-in `/`:** If the user has one membership (or a single obvious most-recent), redirect there; otherwise show `/teams` picker. Do not invent last-active machinery beyond what’s free from a simple query.

## Data model changes (conceptual)

### Better Auth tables

Standard BA user / session / account (/ verification if required by setup). Username on user (plugin). No product email.

### `members`

- Add `userId` → BA user (required for new rows; backfilled by migration)
- **Remove** (or stop using) member-level `displayName` and `timeZone` as product source of truth — roster and scheduling read from the user profile
- Keep per-membership: `mode`, `status`, `reminderEnabled`, `reminderTime`, `lastReminderDate`, `isOwner`, `joinedAt`

### `push_subscriptions`

- Tie device endpoints to **user** (multi-device)
- Reminder prefs remain on **membership**
- Cron: for due memberships, notify all push endpoints for that membership’s user

### Teams

Unchanged invite capability secret (`inviteCode`). Owner still `ownerMemberId` (or equivalent), updated on ownership transfer.

## Leave / sign out / delete account

- **Leave team:** delete that membership; stay signed in; go to `/teams` (or redirect rules above).
- **Sign out:** end Better Auth session on this device.
- **Delete account:**
  1. For each owned team: transfer ownership to oldest remaining member (`joinedAt` asc); if none, delete the team
  2. Delete user (cascades memberships, sessions, push subs)
  3. Strong confirm copy in `/settings`

Owner **delete team** remains on team settings (destroys team + memberships; does not delete the BA user).

## Reminders + push

- Prefs (enabled + time) per membership (team settings)
- Push subscription registered per browser/device on the user (account or team settings save path — implementation detail)
- Cron fans out: due incomplete/countdown for a membership → all of that user’s device endpoints

## Migration shim (temporary)

For existing cookie-only members (currently ~2 users):

1. On next authenticated request, if member has no `userId`:
   - Create BA user (username from display name rules, random password)
   - Link membership(s)
   - Establish BA session; drop `sf_session`
   - Show one-time password modal (username + password + ack checkbox) at app shell
2. Remove shim after both users converted (~one week)

## UX copy / confusion to avoid

- Label **login password** vs **team invite password** distinctly wherever both appear (create success).
- Migration modal and create/join credential step share the same “save now — we can’t show this again” + ack pattern.

## Open implementation details (non-blocking)

- Exact username charset / max length and random-suffix format
- Auto-password entropy / length
- Whether timezone edits on `/settings` immediately affect all membership reminder local times (yes, if timezone is user-global)
- Synthetic email format if BA requires a column

## Out of scope follow-ups

- Password recovery / email
- Passkeys
- Team roster nicknames
- Rich last-active team memory
- Removing migration shim (chore after both users convert)
