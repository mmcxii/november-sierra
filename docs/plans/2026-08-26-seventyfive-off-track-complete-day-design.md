# SeventyFive — Clear Off track when the day is complete

## Intent

Soft members who missed a past day keep an **Off track** label even after they finish the day they are looking at. Checking off that day’s last required task should remove the label.

## Behavior

- Off track still means Soft + at least one incomplete **past** challenge day (`hasSoftStumble`).
- The roster hides Off track when the **selected day’s** required tasks are complete.
- Completing today’s last checkbox therefore clears the label immediately. Paging to an incomplete past day still shows Off track if a stumble remains.
- Catching up the last missed past day still clears the flag entirely via `hasSoftStumble`.
- Hard failed / exited still show Failed. No schema change.

## Architecture

`rosterStatusLabel` in the roster-row folder. `RosterRow` derives `dayComplete` with `isDayComplete` (same required-task context as the icon strip).
