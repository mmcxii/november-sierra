# SeventyFive — Loading states (design)

Quiet brand feedback for cold start and in-app navigation — no skeleton lists, no top progress bar, no route-unmount `loading.tsx`.

## Goals

- Cold PWA/open: no blank stare before first paint.
- Page transitions: immediate feedback **without** tearing down the previous screen.
- Tone: paper + a calm olive ember orb (no wordmark on the cover), matching the quiet habit aesthetic.

## In-app navigation

- Keep the current route mounted until the next RSC is ready (default App Router soft nav; **do not** add segment `loading.tsx` that replaces content).
- On pending navigation, show a **soft full-viewport veil** (paper/dark tint ~40–50% opacity) with a **breathing olive ember orb** centered on top — no “75” text.
- Orb: a bit more prominent than a progress-bar spark; glow should read clearly in a short (~1s) glance without flashing. Breathe ~1s ease-in-out with peak around 40% so a bloom lands in the first ~400ms; soft multi-stop olive halo.
- Previous content remains visible underneath (readable, not wiped).
- Triggers:
  - Capture same-origin internal `<a>` / `Link` clicks (ignore new-tab, modified clicks, hash-only, external).
  - Explicit `router.push` / `replace` via a thin pending-aware helper (date stepper, sign-in, create/join).
  - Do **not** treat `router.refresh()` as navigation pending.
- Clear pending when `pathname` or search string changes; safety timeout if a nav never commits.
- `prefers-reduced-motion`: static orb, no breathe; veil still shows.
- a11y: `role="status"` / screen-reader “Loading” label (i18n); visible cover is orb-only.

## Cold start

- Client `BootSplash` SSR’d in root layout (first HTML paint); same paper/dark tokens (respect `data-theme` from `ThemeScript`).
- Centered ember orb (larger than nav) + soft ambient radial wash; brief enter (~180ms) then the same ~1s breathe (no long delay before motion). No “75” on the splash.
- After hydrate: fade out and unmount for the session (no flash on later navigations).
- PWA `background_color` / viewport themeColor already align with paper; splash bridges OS chrome → first React paint.

## Out of scope

- Skeleton UIs for teams list / board.
- NProgress-style top bars.
- Route-level `loading.tsx` that unmounts the previous page.
- Offline/SW caching splash (SW remains push-only).

## Wiring

- Shared pulse styles in `globals.css` (`.sf-brand-pulse-ember`, boot + overlay variants).
- `NavigationPendingProvider` + overlay mounted from root layout (inside i18n; `Suspense` around the `useSearchParams` listener).
- `usePendingRouter()` for programmatic navigations (board date, sign-in, create/join).
- i18n: `loading` → “Loading”.
