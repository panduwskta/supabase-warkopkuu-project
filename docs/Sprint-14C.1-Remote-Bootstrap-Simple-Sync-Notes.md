# Sprint 14C.1 — Remote Bootstrap + Simple Entity Sync Notes

## Gate

Approved scope: small Sprint 14C.1 only.

This sprint intentionally avoids a broad sync engine. It adds remote bootstrap and simple entity push sync foundation only.

## Source of Truth

- `docs/PRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- `docs/Sprint-8-Sync-Queue-MVP-Notes.md`
- `docs/Sprint-8.5-Sync-Alignment-RPC-Contract-Prep.md`
- `docs/Sprint-9.5-Checkout-RPC-Queue-Caller-Notes.md`
- `docs/Sprint-14C-Supabase-v2-Sync-RPC-Cutover-Plan.md`

## Why This Sprint Was Reduced

After document audit, the broader proposed “sync engine wiring” sprint was judged too large and too risky.

The source-of-truth docs require cloud sync, but they also repeatedly warn against broad/generic sync overengineering. Checkout RPC sync must not run before store/products have remote Supabase UUIDs.

Therefore this sprint implements the prerequisite layer only:

- authenticated profile/store bootstrap,
- local `remoteId` persistence,
- simple entity direct table sync,
- manual sync trigger.

## Implemented Scope

### Remote bootstrap

Added `src/features/sync-engine/bootstrap.ts`:

- requires configured Supabase client,
- requires authenticated Supabase user,
- upserts `profiles`,
- creates or updates primary `stores`,
- persists local `LocalStore.remoteId`,
- marks store queue entries synced when remote write succeeds.

### Simple entity sync

Added `src/features/sync-engine/simple-entity-sync.ts`:

Direct table sync for:

- `categories`,
- `products`,
- `payment_methods`,
- `expense_categories`,
- `expenses`.

Behavior:

- create when local record has no `remoteId`,
- update when local record has `remoteId`,
- preserve soft-delete fields where present,
- write returned remote IDs back to Dexie,
- mark records and related queue entries synced/failed,
- sync dependencies before dependents.

### Sync runner

Added `src/features/sync-engine/run-sync.ts`:

- bootstraps profile/store first,
- syncs categories/payment methods/expense categories,
- then syncs products and expenses,
- returns a small summary for UI feedback.

### UI wiring

Updated `src/app/App.tsx`:

- adds manual `Sync` action in the header,
- keeps the existing sync pill/status summary,
- shows simple success/failure toast.

Updated `src/styles.css`:

- adds small `Sync` button styling.

## Explicitly Out of Scope

- Checkout RPC queue execution.
- Transaction/transaction item cloud sync.
- Full background sync worker.
- Pull sync from cloud to local.
- Multi-device sync.
- Conflict resolver UI.
- Production migration changes.
- Legacy data migration.
- Android/Capacitor work.
- Public release readiness claim.

## Verification

Passed:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev` → 0 vulnerabilities
- `git diff --check`

Scope boundary check:

- No `syncCheckoutTransactionGroup()` wiring added.
- No `create_transaction_with_stock_update` caller added to `sync-engine` or `App.tsx`.

Known non-blocking warning:

- Vite large chunk warning remains from export/receipt libraries.

## Current Status

This sprint makes simple local-v2 records syncable to staging Supabase v2 tables after login. It does not complete full Warungin v2 cloud sync because checkout RPC group sync remains intentionally separate.

## Recommended Next Step

After this PR is reviewed/merged, run a staging manual QA pass:

1. Configure app env to staging Supabase.
2. Login/register.
3. Add menu/product.
4. Click `Sync`.
5. Verify product/category rows in staging Supabase.
6. Add expense.
7. Click `Sync`.
8. Verify expense/expense category rows in staging Supabase.

Only after that should checkout RPC queue sync be planned as a separate small sprint.
