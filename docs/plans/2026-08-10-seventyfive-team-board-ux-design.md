# SeventyFive — Team board UX (design)

Small board/hub polish from interview: teams hub, settings back nav, roster refresh, pre-start pulse.

## Decisions

### `/teams` hub

- Never auto-redirect when the user has exactly one membership.
- Always offer **Create team** + **Join team** (empty and non-empty states).
- Board keeps the **Your teams** header control for everyone.

### Team settings back link

- Replace muted “Your team” with `← {teamName}` linking to `/teams/[teamId]`.

### Roster refresh

- Small refresh icon beside the **Your team** section title.
- On tap: `router.refresh()`; icon spins while the transition is pending.

### Pre-start roster icon pulse

- While `today < startDate`, every roster task icon pulses unchecked ↔ checked **in sync** (all rows/icons share one phase).
- Cycle length: **~1s per day** until start (**30s** at ≥30 days out → **1.2s** the day before).
- Stops when the challenge has started (`daysUntilStart === 0`).
- `prefers-reduced-motion: reduce`: still pulse, but fixed at the slow **30s** rate.

## Out of scope

- Pull-to-refresh gesture
- Offline caching
- Per-row / per-icon stagger
