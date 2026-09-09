# SeventyFive — Reveal inactive teammates

## Intent

Dormant members stay out of the default Your team list and still do not count toward team-done. When any exist, the section label trails a tappable **N inactive** control. Tapping it shows those rows under the active list. Tapping again hides them.

## Copy

`{{count}} inactive` — not a bare parenthetical. Hidden when the count is 0.

## Behavior

- Inactive = existing `isDormant` and not the viewer (self always stays in the main list).
- Default collapsed. State is local to the board; it does not persist.
- Same `RosterRow` below the active members, slightly muted, no pre-start pulse.
- Refresh stays on the right. Team-done, reminders, REST/MCP hide rules unchanged.

```
YOUR TEAM  2 inactive                 ↻
Maya·  12
Jordan
Sam
Riley
```
