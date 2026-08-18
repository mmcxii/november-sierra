# SeventyFive — Soft tasks + Hard fail modal

## Soft checklist

Hard tasks stay the same. Soft becomes five checkable items:

1. `workout` — 45 min exercise
2. `diet` — Nutritious meals
3. `alcohol` — No alcohol
4. `water` — Drink 3 liters of water
5. `reading` — Read 10 pages

`diet` keeps its id (meals only). `alcohol` is new. No historical Soft check migration (challenge has not started).

## Hard miss

`refreshMemberStatus` still marks Hard `failed` when a past challenge day is incomplete. It does **not** auto-switch mode.

On the board, Hard + `failed` (and not `exited`) opens a blocking modal:

1. **I still have checks to log** — stay Hard; jump the stepper to the first incomplete past day. Today stays locked until history is complete.
2. **Move to Soft** — `mode: soft`, `status: active`, store `hardCompletedDays`, seed `alcohol` on days where Hard `diet` was checked.
3. **Fail and exit** — `status: exited`. All days read-only, reminders skipped, roster shows Failed.

Backdrop cannot dismiss the modal.

## Roster

Soft members with `hardCompletedDays` set show **Soft · {{count}} days on Hard** (singular **day** when the count is 1) on their roster row.

## Status

`active` | `failed` | `exited`. Soft is never `failed`. `exited` is sticky until they leave the team.
