# SeventyFive — Quote of the day

## Intent

A quiet line on the team board for each challenge day. Only real, published quotations. No invented or viral-fake stoic lines.

## Behavior

- Footer under the checklist, above leave-team. Muted, author only (` — Name`).
- Hidden before the start date. No pre-start substitute.
- Each team gets a stable shuffle of the same 75 quotes, seeded from `teamId`. No repeats across that team’s 75 days. Refresh does not reroll.
- The quote follows the **selected challenge date**. Paging the stepper changes it.
- After day 75 there is no extra quote. Paging day 75 still shows that day’s line.
- Not gated on notifications, mode, or status. English only. Not shown on other routes.

## Architecture

- Static `src/lib/challenge/quotes.ts`: 75 `{ author, source, text }`. `source` is citation-only (book + location, or the author’s site).
- `quoteForTeamDay({ teamId, startDate, date })` returns `{ author, text }` or `null` if the date is outside the 75-day window.
- Seeded Fisher–Yates (mulberry32 from a 32-bit hash of `teamId`). No database.
- Team page computes the quote on the server and passes it into `TeamBoard`.

## Quality bar

- Every line checked against the cited edition or the author’s own site.
- Rejected: Seneca “luck / preparation,” Marcus “privilege to be alive,” “you have power over your mind…” paraphrase, and similar.
- Length: one or two sentences. A few may run longer; none are paragraphs.

## Tests

- Hide before start and after the window.
- Day 1 and day 75 resolve.
- Same team + date is stable; two team ids differ.
- One team’s 75-day run has no duplicate texts.
- The list is exactly 75 unique texts.
