# Sprint BF-5 — Legacy localStorage Fallback Cleanup Notes

## Scope

- Remove the legacy `warkopkuu_local_v1` / `warkop_session` browser-auth fallback from the visible app flow.
- Make missing or invalid Supabase configuration explicit instead of silently creating local browser accounts.
- Keep operational POS data on the current Dexie local-v2 path for authenticated users.

## Changes

- Removed legacy localStorage account helpers from `src/app/App.tsx`:
  - `LOCAL_KEY`
  - `readLocal()`
  - `writeLocal()`
  - `hashPassword()`
  - `warkop_session` handling
  - `warkop-local-change` event handling
- `useAuth()` now only uses Supabase Auth.
- If Supabase is missing or the develop branch points to the wrong project, login/register is disabled with an explicit config error.
- Auth screen copy now states that there is no browser-local account fallback.

## Verification

Passed locally before PR:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev`
- `git diff --check`

Additional inspection:

- Grep confirmed no runtime references remain for `LOCAL_KEY`, `warkop_session`, `readLocal`, `writeLocal`, `hashPassword`, `warkopkuu_local_v1`, or `warkop-local-change` under `src/`.

Known non-blocking warning:

- Vite large chunk warning from existing export/receipt libraries remains.

## Out of Scope

- Legacy v1 localStorage data migration/import.
- Anonymous/demo account mode.
- Production Supabase migration or data mutation.
