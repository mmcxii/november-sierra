# SeventyFive — Task / day / finale celebrations (design)

Warm, understated acknowledgments when checking tasks, finishing a day, and completing day 75 — plus a progress-bar “ember” orb that grows with the journey.

## Tone

Warm acknowledgment, not gamey: enough signal to mark the habit; dignified and quiet day-to-day; ceremonial only for the finale.

## Celebration tiers

### Single task

- Fires on a successful **check** (not uncheck) for any editable day.
- **Board only:** keep/enhance existing `sf-check-pop`; optional brief accent flash on the row.
- No toast.

### Day complete (today only)

- Fires when the check that finishes **today’s** last required Soft/Hard task succeeds (`isDayComplete` flips false → true for today).
- **Board:** short checklist settle + progress bar / ember reacts (gentle brighten).
- **Toast (Sonner):** `Day {{day}} complete. {{count}} more to go.`
  - `day` = challenge day number for today.
  - `count` = remaining challenge days after today (`75 - day`).
- Catch-up on past days: task motion only — no day toast.

### Challenge complete (day 75)

- Fires when today’s last task finishes and today is the challenge **end date** (day 75).
- Fuller board moment (longer ember bloom / bar settle).
- **Toast:** `Challenge completed, congratulations!` (no “more to go”).

### Non-triggers

- Unchecking never celebrates.
- Already-complete on load: no mount toast (check-triggered only).
- Pre-start: no day/finale path.
- Optional session guard: don’t re-toast if the user unchecks and re-completes the same today in one sitting.

### Reduced motion

- `prefers-reduced-motion`: skip or shorten board motion; toasts still show; ember is static at the correct size/brightness.

## Progress ember (leading orb)

- Small orb on the **leading edge** of the elapsed progress fill (time frontier), not over empty future track.
- Pre-start: faint ember at the start of the track so the metaphor is visible early.
- Growth: size, brightness, and soft glow scale with `elapsedDays / 75` — tiny spark → calm glow by day 75. No pulse spam; optional very slow breathe only if it stays subtle.
- **Color:** `sf-accent` (same as completed roster task icons) for theme consistency. Hard `failed`: cool to `sf-danger` with the failed fill.
- Soft grey miss slices stay behind the orb; orb tracks calendar progress, not perfect-day count.
- Day-complete / finale: one-shot gentle brighten, then settle.
- Understated: low-opacity glow, small vs the bar — glanceable, not a second hero.

## Wiring

- Detect day-complete client-side on the board after a successful `setTaskCheckedAction` when today was selected and completeness flips.
- Reuse Sonner; CSS-only motion (no confetti/lottie/framer dependency).
- Ember implemented inside `ChallengeProgress`.
- i18n keys (camelCase of English):
  - `day{{day}}Complete{{count}}MoreToGo` → “Day {{day}} complete. {{count}} more to go.”
  - `challengeCompletedCongratulations` → “Challenge completed, congratulations!”

## Out of scope (v1)

- Confetti libraries, full-screen overlays, sound, haptics
- Team-wide “someone finished” fanfare
- Streak celebrations
- Celebrating Soft catch-up / Hard recovery days with day toasts
