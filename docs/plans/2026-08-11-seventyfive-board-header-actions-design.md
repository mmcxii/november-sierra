# SeventyFive — Board header actions (design)

Give the team name the full content width and collapse board actions into a compact menu.

## Decisions

### Title

- Team name is alone on its row at full content width so wrapping is driven only by the name length.
- Countdown sits on the next row with the actions trigger, so the title never shares horizontal space with chrome.

### Actions menu

- Replace the **Your teams** / **Invite** / **Settings** button cluster with a single `⋯` trigger using the existing shadcn/Radix `DropdownMenu` (same primitive as the theme toggle).
- Menu items:
  - **Your teams** → `/teams`
  - **Invite** → toggles the existing inline invite panel (unchanged)
  - **Settings** → `/teams/[teamId]/settings`
- Trigger sits on the countdown row (`shrink-0`, end-aligned); theme toggle remains in `AppChrome` and is not part of this menu.

### Theme toggle clearance

- The absolute-positioned theme control was covering the old header action buttons (and would compete with any top-right board control).
- `AppChrome` keeps the theme toggle as a normal in-flow top-right chrome row so page content starts **below** it — never underneath.
- Board (and other chrome pages) rely on that reserved strip instead of `min-h-dvh` stacking, so we don’t reintroduce phantom vertical scroll.
- Theme stays out of the board `⋯` menu.

### Out of scope

- Moving Invite into a modal/sheet
- Combining theme toggle into the board actions menu
- Bottom tab bar / navigation shell
