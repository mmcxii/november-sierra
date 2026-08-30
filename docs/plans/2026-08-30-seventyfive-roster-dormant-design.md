# SeventyFive — Hide dormant teammates

## Intent

A teammate who has not finished a challenge day in a long time should disappear from **Your team** and stop blocking “the team finished.” They stay on the team. Completing one full day brings them back. No new database column.

## Dormant

`isDormant` is derived from completions as of a date `D`:

- Walk challenge days **before** `D`.
- If there are fewer than **5** past challenge days, not dormant (pre-start and the first four days).
- Find the latest complete day on or before `D` (required tasks for that member’s mode / photo rule).
- Dormant when that date is missing, or it is older than the 5th most recent past challenge day.

Examples (last complete Sept 1): still listed on Sept 6; hidden on Sept 7. Finishing Sept 7’s checklist — or any complete day on or after Sept 2 — shows them again. Partial checks do not.

## Roster

Hide dormant people from Your team. The viewer always sees themselves. No ghost row or “paused” copy.

REST/MCP `get_board` roster uses the same filter.

## Team-done

`countedTeamMembers` excludes `exited` **and** dormant (evaluated as of that date). Same hook as celebrations, pending board animation, and teammate/team-done push recipients.

If the others already formed a team-complete without the returning person, their comeback finish does not fire a second team-done.

Fewer than two counted members: no team event (unchanged).

## Unchanged

- Membership, settings, `/teams` hub
- Daily reminder cron (still nudge them back)
- Hard failed / Soft off-track / exited rules
