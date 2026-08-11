# SeventyFive — Loading states (design)

Quiet brand feedback for cold start and in-app navigation — no skeleton lists, no top progress bar, no route-unmount `loading.tsx`.

## Goals

- Cold PWA/open: no blank stare before first paint.
- Page transitions: immediate feedback **without** tearing down the previous screen.
- Tone: paper + olive ember + “75”, matching the existing quiet habit aesthetic.

## In-app navigation

- Keep the current route mounted until the next RSC is ready (default App Router soft nav; **do not** add segment `loading.tsx` that replaces content).
- On pending navigation, show a **soft full-viewport veil** (paper/dark tint ~40–50% opacity) with a **small breathing olive ember + “75”** centered on top.
- Previous content remains visible underneath (readable, not wiped).
- Triggers:
  - Capture same-origin internal `<a>` / `Link` clicks (ignore new-tab, modified clicks, hash-only, external).
  - Explicit `router.push` / `replace` via a thin pending-aware helper (date stepper, sign-in, create/join).
  - Do **not** treat `router.refresh()` as navigation pending.
- Clear pending when `pathname` or search string changes; safety timeout if a nav never commits.
- `prefers-reduced-motion`: static mark, no breathe; veil still shows.
- a11y: `role="status"` / `aria-live="polite"` with a short “Loading” label (i18n).

## Cold start

- Inline boot splash in the root document (HTML + CSS), painted with first response — same paper/dark tokens as the app (respect `data-theme` from `ThemeScript`).
- Mark: larger “75” (display stack / system serif fallback until Figtree/Source Serif load) + soft rise + ember breathe. Optional subtle radial wash matching `body` atmosphere — nice-to-have flourish, keep CSS-only.
- Client dismiss on hydrate: fade out, then remove from DOM so it cannot block interaction.
- PWA `background_color` / viewport themeColor already align with paper; splash bridges OS chrome → first React paint.

## Out of scope

- Skeleton UIs for teams list / board.
- NProgress-style top bars.
- Route-level `loading.tsx` that unmounts the previous page.
- Offline/SW caching splash (SW remains push-only).

## Wiring

- Shared pulse styles in `globals.css` (`.sf-brand-pulse`, boot + overlay variants).
- Client `BootSplash` SSR’d in root layout (first HTML paint); fades out after hydrate and stays unmounted for the session.
- `NavigationPendingProvider` + overlay mounted from root layout (inside i18n; `Suspense` around the `useSearchParams` listener).
- `usePendingRouter()` for programmatic navigations (board date, sign-in, create/join).
- i18n: `loading` → “Loading”.
