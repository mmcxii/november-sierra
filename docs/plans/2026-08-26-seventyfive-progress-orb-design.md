# SeventyFive — Progress ember sits on filled days

## Intent

The glowing ember was placed on **today’s** calendar mark even while today’s slice was still empty. That left a gap between the solid fill and the orb. Park the ember on the filled edge until today is complete, then scroll the board to the top before the advance animation.

## Behavior

- While today is incomplete (pending / transparent), `data-day` is yesterday’s filled edge (`elapsedDayCount - 1`, floored at 0).
- Completing today moves the ember to today’s mark and fills the slice.
- Hard failed / exited keep the ember on the full elapsed fill (today is filled danger, not pending).
- Pre-start stays at day 0.
- Completing today’s last required task: smooth-scroll to the top of the page, then play the ember bloom / checklist settle. Already at top, or reduced motion, skips the wait (instant jump if needed).
- Incoming team celebration from another member does not steal scroll.

## Architecture

- `emberDay` takes `todayPending` so position is filled-edge, not calendar-today.
- `ChallengeProgress` treats today as pending only when the last elapsed day is today, incomplete, and the member is not hard-failed/exited.
- CSS `left` transitions so the orb advances when `data-day` changes.
- `scrollWindowToTop` in the board utils; last-task celebrate path awaits it before `playCelebration` + `router.refresh()`.
