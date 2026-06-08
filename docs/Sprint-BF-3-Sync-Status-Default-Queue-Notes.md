# Sprint BF-3 — Sync Status Truthfulness + Default Entity Queue Notes

## Scope

- Enqueue default categories, payment methods, and expense categories so default local-v2 records are visible in sync state.
- Avoid duplicate active queue rows by using the existing queue upsert behavior.
- Make manual sync messaging account for remaining pending/syncing/failed/conflict queue rows after a run.
- Stop counting profile/store bootstrap as user-data synced on every manual sync run.

## Changes

- `ensureDefaultCategories()` now queues default category creates/updates when records are not synced or have no remote ID.
- `ensureDefaultPaymentMethods()` now ensures the four built-in methods exist and queues unsynced/default remote-link work.
- `ensureDefaultExpenseCategories()` now queues default expense category creates/updates when records are not synced or have no remote ID.
- `runSimpleEntitySync()` now returns `remaining` queue counts after the sync run.
- Profile bootstrap is reported as skipped, and store bootstrap is only counted as synced when the local store needed initial/repair sync.
- Manual sync toast no longer says everything is safe when active queue rows remain.

## Verification

Passed locally before PR:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev`
- `git diff --check`

Known non-blocking warning:

- Vite large chunk warning from existing export/receipt libraries remains.

## Out of Scope

- Payment method selection UI.
- Background sync worker.
- Pull sync / conflict resolver UI.
- Production Supabase migration or data mutation.
