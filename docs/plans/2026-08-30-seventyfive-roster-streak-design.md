# SeventyFive — Roster streak next to each name

## Intent

Show a current consecutive-complete streak beside each person in **Your team**, so a run of on-track days is visible without adding badges, icons, or schema.

## Count

`currentStreak` walks challenge dates backward from today, using the member’s current mode and `progressPhotoEndsOnly` for required tasks.

- Today counts only when every required task for today is checked.
- If today is still open, counting starts at yesterday.
- The first incomplete day stops the walk.
- Dates outside the challenge window do not count.
- Zero is not rendered.

This is a **current** run, not a perfect-from-day-1 badge. A Soft miss last week does not block a new streak. Hard Failed / Soft Off track can still show a number if recent days are complete.

No database column. Derived on the team page from the completions already loaded for the roster.

## UI

Placement **A**: olive tabular number on the name line, after the self dot.

```
Maya·  12
Hard                         (icons)
```

Hover and screen reader use `{{count}}-day streak`. No MCP/REST change.

## Out of scope

- Lifetime / best streak
- Flames, chips, or a third roster column
- Persisted `members.current_streak`
- Streak on the public API
