# SeventyFive — Off track consecutive-day count

## Intent

When the roster shows **Off track**, append how many consecutive past challenge days that miss streak covers: `Off track (3)`.

## Count

`softOffTrackDays` is 0 unless `hasSoftStumble` is true (yesterday incomplete, today not done).

Then walk challenge days backward from yesterday and count consecutive incomplete Soft days. Today does not increment the number — finishing today still clears the label entirely.

Day 1 stays unlabeled. No schema or API change.
