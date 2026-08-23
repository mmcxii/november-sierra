# SeventyFive — Hard progress photo on first and last day only

## Intent

Hard members can opt to require a progress photo only on the team start and end dates. Middle days hide the camera task. Default stays classic Hard: photo every day.

## Ownership and lock

- Each Hard member owns `progressPhotoEndsOnly` in their own team settings.
- Editable only before start, same lock as Hard/Soft.
- After start the checkbox stays visible and is disabled.
- Soft ignores the flag. Hard→Soft does not use it. Soft may still persist the column.

## Domain

- Default **off** = photo required every Hard day.
- Flag **on** = photo required only on team `startDate` and `endDate`. Days 2–74 are complete without a photo.
- Required tasks come from `tasksForDay` / `taskIdsForDay` (date + flag + mode).
- Personal checklist, roster icon strip, teams-hub strip, day-complete, Hard-fail history, progress bar, celebrations, and reminder remaining-task copy all use that list.
- Existing middle-day photo checks stay in the DB and are ignored. No backfill.

## Data

- `members.progress_photo_ends_only` boolean, default `false`, not null.
- New Drizzle migration (`pnpm drizzle-kit generate`). Never `db:push` on deployed DBs.
- Create/join stay default off. Option is only in team settings.

## Errors

- Saving the flag after start is rejected (same as mode: persist the stored value).
- Checking `progressPhoto` on a hidden middle day is ignored (not persisted).

## Tests

- Flag off: 6 Hard tasks every day.
- Flag on: 6 on start/end, 5 on a middle day.
- Cover day-complete, Hard fail, reminder remaining tasks, progress, celebrations.

## Implementation

1. Schema + migration.
2. Date-aware required-task helpers in `tasks.ts`; thread through status, progress, celebrations, task action, reminders.
3. Settings checkbox under the Hard task preview; lock after start.
4. Board checklist + roster/teams icon strips omit camera on middle days.
5. i18n + unit tests.
