# Sprint 14B — Local v2 UI Cutover Notes

## Gate
Approved Sprint 14B execution only: local Dexie/local-v2 UI cutover from `develop`.

## Source of Truth
- `docs/PRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- `docs/Sprint-14-v2-Architecture-Cutover-Plan.md`

## Scope Implemented
- Added a local app adapter module at `src/features/local-app/index.ts`.
- Bootstraps a local v2 store in Dexie for the signed-in user.
- Ensures baseline local v2 categories, payment methods, expense categories, and onboarding state.
- Cuts visible menu/product data over to local v2 products/categories.
- Adds HPP/modal input and display in the menu UI.
- Cuts checkout over to `checkoutLocal()` so transactions, transaction items, stock updates, receipt numbers, and sync queue behavior use local v2 foundations.
- Cuts expenses over to local v2 expense and expense category tables.
- Adapts transaction and expense data back into the existing dashboard/report/export/receipt UI shape.
- Adds a minimal truthful local sync status pill based on local sync queue counts.

## Explicitly Out of Scope
- Supabase migration application.
- Live Supabase v2 schema cutover.
- Checkout RPC live execution.
- Full conflict resolution UI.
- Full cloud sync worker completion.

## Migration Safety
No Supabase migrations were applied in this sprint. The following files remain unapplied until explicit later approval:
- `supabase/migrations/002_warungin_v2_schema.sql`
- `supabase/migrations/003_checkout_rpc_stock_safety.sql`

## Verification
Passed after implementation:
- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev` → 0 vulnerabilities
- `git diff --check`

Additional route smoke against Vite preview:
- `/` → 200 HTML shell
- `/login` → 200 HTML shell
- `/login?mode=register` → 200 HTML shell

Known non-blocking warning:
- Vite still reports a large chunk warning from export/receipt libraries. This was already known before Sprint 14B.

## Current Preview Status
Sprint 14B moves the visible app materially closer to the Warungin v2 foundation by making the operational UI local-v2/Dexie-first. It is still not a public/external release gate because Supabase v2 sync/RPC cutover remains Sprint 14C+.
