# SeventyFive — Personal progress tracker (design)

Replace the plain `Day N of 75` / countdown subtitle with a personal, ambient progress bar under the team name. Position-first: keep day-of framing, expand it with a full-width path.

## Goals

- Personal journey only (not team comparison).
- Ambient only — not a date scrubber; the Whoop date stepper remains the control for selected day.
- Soft track surfaces missed days inside the bar; Hard stays simple (complete the challenge or fail).

## Placement & copy

- Lives under the team name (same slot as today’s challenge progress subtitle), above the date stepper.
- Bar spans the **full content width** (same as the date stepper).
- **Pre-start:** countdown copy (`Challenge starts in N days` / tomorrow) + empty track (no fill).
- **In challenge:** `Day N of 75` for the **selected** board date (same meaning as today), with the bar directly under the label.
- Selected date changes the label only; the bar always reflects real progress through **today** (not the scrubbed date).

## Bar model

- Continuous look: no tick marks, gaps, or visible segment borders.
- Fill advances by calendar day through `min(today, endDate)`: each challenge day = `1/75` of the width. Future days remain empty track.
- Under the hood the fill is day-accurate slices; visually it reads as one bar.

### Soft

- Each **past** elapsed day is a silent slice: complete → primary/accent; missed (incomplete) → muted grey.
- Today incomplete → today’s slice stays empty/unfilled (grey is only for **past** misses).
- Soft with no misses → solid primary through today.

### Hard

- While `active`: solid primary fill through today (no miss coloring — open past misses aren’t possible without failing).
- When `failed`: simple treatment — muted/danger fill through today (no grey checker of individual misses). Existing checklist copy (“fix past days…”) remains the remediation cue.

### After end

- Bar is full width once `today >= endDate`.
- Label still follows the selected stepper date for historical review.

## Data & components

- No new tables. Derive from existing `day_completions` / `task_checks` for the signed-in member via current completeness helpers (`isDayComplete`, mode task lists).
- Team board page passes a compact progress payload (e.g. mode, status, selected day number / countdown, and elapsed-day completeness for Soft — not full roster history).
- New presentational `ChallengeProgress` (name flexible): label + full-width bar; board uses it instead of the plain subtitle string.
- Pre-start skips fill computation (empty track only).

## Accessibility

- Text label remains the primary announcement.
- Bar is decorative; add a short `aria-label` summarizing progress (day N of 75; Soft may include missed-day count). Slices are not focusable.

## Out of scope

- Team comparison / roster history in the bar
- Streaks, heatmaps, tick marks
- Tap/drag to change selected date
- New database fields
