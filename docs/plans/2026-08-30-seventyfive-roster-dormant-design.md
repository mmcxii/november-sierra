# SeventyFive — Hide dormant teammates

## Intent

A teammate who has not checked any task in a long time should disappear from **Your team** and stop blocking “the team finished.” They stay on the team. Finishing **today** in full brings them back. No new database column.

## Dormant

`isDormant` is derived from completions as of a date `D`:

- Walk challenge days **before** `D`.
- If there are fewer than **5** past challenge days, not dormant (pre-start and the first four days).
- A day is inactive only when it has **no** task checks. A partial day is activity and breaks the empty streak.
- Dormant when the last 5 past challenge days are all empty **and** `D` is not fully complete.
- A partial today does not restore them. Only every required task for the current day does.

Examples: last check Sept 1, no checks Sept 2–6 → hidden on Sept 7. A water check on Sept 4 keeps them listed. A water check on Sept 7 does not; finishing Sept 7’s checklist does.

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
