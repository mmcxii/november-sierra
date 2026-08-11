# SeventyFive — Invite modal + join lock (design)

## Invite modal

- Board **Invite** opens a modal (password-reveal overlay pattern: dimmed backdrop, elevated panel, bottom on mobile / centered on `sm+`).
- Primary action: **Copy join link** (accent).
- Secondary action: **Copy team invite password** (bordered), with the invite code shown as mono text.
- Helper copy: join stays open through day 1 (the start date); locked from day 2.
- Dismiss: backdrop click + explicit close control.
- Remove the inline invite panel under the board header.

## When Invite is shown

- Show the ⋯ **Invite** item only while `isJoinAllowed(startDate, todayLocal)` (on or before the start day).
- From day 2 on: hide Invite entirely.

## Join lock

- Keep server `isJoinAllowed` (open through start day; blocked after).
- Replace outdated “before the start date” invite copy.
- Join failure copy: **Joining closed after the first day.** (replaces “Challenge already started” for this path).
