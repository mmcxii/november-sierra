# SeventyFive — Off track is yesterday’s miss until today is done

## Intent

Off track is a live Soft status, not a record of every past miss. Show it only after a failed **previous** challenge day, and drop it as soon as **today** is complete. Completing yesterday also clears it, even if an older day was missed.

## Behavior

- `hasSoftStumble` is true only when:
  - today is a challenge day,
  - yesterday is a challenge day and is incomplete, and
  - today is not yet complete.
- Day 1 has no previous challenge day, so there is no Off track.
- Missed two days ago + completed yesterday → no Off track today, even if today is still open.
- Completing today’s last required Soft task clears Off track immediately, even if yesterday stays incomplete.
- The roster label follows that flag. Hard failed / exited still show Failed. No schema change.
