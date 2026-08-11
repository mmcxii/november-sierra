# SeventyFive — Teams list rows (design)

Make each `/teams` hub item match the board roster row pattern: identity left, today’s task icons right, progress caption under the name.

## Decisions

### Row layout

- Full-row link to `/teams/[teamId]`.
- **Left:** team name (primary) + caption underneath.
- **Right:** today’s task icons for the signed-in member on that team (Soft/Hard set for their mode).
- Visual language matches `RosterRow` (accent = checked, muted = unchecked). No pre-start pulse on the hub.

### Caption

- Pre-start: `Challenge starts in N days` / `Challenge starts tomorrow`.
- Started: `Day N of 75`.
- No progress bar, Failed, or Off track on the list.

### Data

- Per membership: team name/dates, member mode, today’s checked task IDs in the user’s timezone (`localDateString`).
- Empty hub state and Create/Join actions unchanged.

### Components

- New presentational `TeamListRow` (or shared task-icon strip) so hub and roster don’t diverge on icon markup.

## Out of scope

- Progress ember/bar on the hub
- Failed / Off track status on list rows
- Reordering or pinning teams
