# SeventyFive — Teammate finish + team-done day

## Intent

Notify teammates when someone finishes their local today. When the last counted member finishes that date, escalate to a team-done push and a one-time board celebration that scales with challenge day.

## Opt-in

The existing reminder switch becomes **Enable notifications**. Same push subscription flow. It gates daily nudges and teammate/team-done **pushes**. The board animation is not gated on the toggle.

## Events

Only a successful check that flips the actor’s **local today** incomplete → complete. Uncheck, catch-up, already-complete, pre-start, and exited actors never fire.

The date is the calendar `YYYY-MM-DD` just completed. Other members are done if they completed **that same date**.

Counted for team-done: `active` (Hard or Soft, including Hard→Soft) and Hard `failed`. Exited are ignored. Solo counted member: no teammate push, no team animation.

## Push

`setTaskCheckedAction` detects the flip, then `after()` sends web-push. Recipients: other counted members with notifications on. The actor never gets this push.

- Someone still incomplete → `{{name}} finished today.`
- This check was last → that push is replaced by team-done (`The team finished day {{day}}.` / challenge-complete variant on day 75).

Failed send does not roll back the check. 404/410 subscriptions are dropped.

## Board

Last completer plays the team animation immediately (replaces personal day toast). Day 75 keeps the finale ember. Everyone else plays it the first time they open that team’s board after the team is done for that date.

Once per member per team-complete date via `members.last_team_celebration_date`. Latest unseen team-complete date (among dates ≤ viewer today) wins. Uncheck does not un-stamp.

## Data

- `members.last_team_celebration_date` nullable date
- Migration `0004_last_team_celebration_date`. Production `pnpm db:migrate` after merge. Never `db:push` on deployed DBs.

## Implementation

1. Domain helpers + tests (`resolveTeamDayEvent`, `pendingTeamCelebrationDate`).
2. Schema + migration.
3. Check action: detect flip, stamp actor if last, `after()` notify.
4. Board page: pending flag + stamp after response.
5. Settings copy, board/ember, i18n.
