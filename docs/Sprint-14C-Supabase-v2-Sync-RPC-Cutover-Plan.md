# Sprint 14C — Supabase v2 Sync/RPC Cutover Plan

## Gate

This document is **planning only**.

No runtime code, no Supabase migration apply, no deployment change, and no data mutation are included in this planning sprint.

Sprint 14C execution must not start until the user explicitly approves both:

1. the Sprint 14C implementation plan, and
2. the Supabase migration approval gate for `002` and `003`.

Recommended exact approval phrase before live migration work:

```text
APPROVE SPRINT 14C EXECUTION + APPLY SUPABASE MIGRATIONS 002 AND 003
```

Without that approval, migrations remain blocked.

## Source of Truth

- `docs/PRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- `docs/Sprint-14-v2-Architecture-Cutover-Plan.md`
- `docs/Sprint-14B-Local-v2-UI-Cutover-Notes.md`
- `supabase/migrations/002_warungin_v2_schema.sql`
- `supabase/migrations/003_checkout_rpc_stock_safety.sql`

## Current State After Sprint 14B

Sprint 14B cut the visible app over to Dexie/local-v2 first:

- Local store bootstrap exists in `src/features/local-app/index.ts`.
- Products/categories/HPP/stock use local v2 data.
- Checkout uses `checkoutLocal()`.
- Transactions/items/expenses are adapted from local v2 data into the existing UI/report/receipt shapes.
- Sync queue status is visible at a minimal level.
- Supabase v2 migrations are still unapplied.
- Live Supabase v2 sync/RPC is still not wired into the visible app.

## Objective

Cut over cloud sync from local v2 Dexie data to Supabase v2 tables and checkout RPC, while preserving local-first UX.

The target result is:

- UI continues reading from local Dexie.
- Local mutations remain immediate.
- Cloud becomes canonical after sync.
- Simple entities sync through direct Supabase table operations.
- Checkout sync uses `create_transaction_with_stock_update(payload jsonb)` RPC.
- Remote IDs are written back into Dexie records and queue items.
- Sync failures/conflicts are visible and non-destructive.

## Scope Included for Sprint 14C Execution

### 1. Migration approval and apply gate

Only after explicit user approval:

1. Confirm target Supabase project.
2. Confirm environment variables point to the intended project.
3. Apply `supabase/migrations/002_warungin_v2_schema.sql`.
4. Apply `supabase/migrations/003_checkout_rpc_stock_safety.sql`.
5. Inspect that v2 tables, RLS policies, and RPC exist.
6. Do not alter legacy `menu_items`, `orders`, or `expenses` tables.

### 2. Remote bootstrap for authenticated users

Add a cloud bootstrap flow that ensures:

- `profiles` row exists for the authenticated user.
- primary `stores` row exists for the authenticated user.
- local `LocalStore.remoteId` is set to the cloud `stores.id` UUID.
- default local categories/payment methods/expense categories can be synced and receive remote IDs.

This is required because the local IDs are client IDs, while Supabase v2 tables use UUID primary keys.

### 3. Simple entity sync operations

Implement direct table sync for simple entities:

- `store`
- `category`
- `product`
- `paymentMethod`
- `expenseCategory`
- `expense`

Expected behavior:

- create: insert cloud row, write returned UUID into local `remoteId`, mark record and queue item synced.
- update: update cloud row by `remoteId`, then mark synced.
- delete: soft delete where applicable (`is_deleted`, `deleted_at`) instead of destructive delete for operational history safety.
- failure: mark queue item and local record failed, preserve local data.

### 4. Checkout RPC sync

Use existing foundation:

- `src/features/cashier/sync-contract.ts`
- `src/features/cashier/sync-checkout.ts`
- `supabase/migrations/003_checkout_rpc_stock_safety.sql`

Before checkout RPC can run:

- local store must have `remoteId`.
- all checkout products must have `remoteId`.
- transaction items must map product local IDs to product remote IDs.

Expected behavior:

- call `create_transaction_with_stock_update(payload jsonb)`.
- on success, write transaction remote ID, transaction item remote IDs, cloud stock values, and synced queue statuses.
- on `INSUFFICIENT_STOCK` or `DUPLICATE_RECEIPT`, mark checkout group as conflict without deleting local transaction.
- on auth/network/schema errors, mark failed and allow retry.

### 5. Sync runner/manual sync trigger

Add a conservative sync runner:

- triggered manually from UI first, or after login/bootstrap if safe.
- processes queue items oldest-first.
- syncs prerequisites before dependents:
  1. store/profile
  2. categories/payment methods/expense categories
  3. products
  4. expenses
  5. checkout transaction groups via RPC
- avoids tight retry loops.
- limits each run to a small batch to avoid runaway failures.

### 6. Minimal UI status upgrade

Keep UI minimal and truthful:

- show pending/syncing/failed/conflict counts.
- provide manual retry/resync button if feasible within sprint.
- do not claim cloud synced until queue and records are marked synced.

## Scope Excluded

- Public/external release approval.
- Supabase Storage upload for receipt PNG.
- Multi-device real-time pull sync beyond basic cloud bootstrap/push sync.
- Full conflict resolution UI.
- Staff roles/multi-user permissions.
- Legacy data migration from `menu_items`, `orders`, `expenses` into v2 tables.
- Advanced sync scheduler/background service.
- Android/Capacitor work.

## Files Likely to Create

- `docs/Sprint-14C-Supabase-v2-Sync-RPC-Cutover-Notes.md` — execution notes after Sprint 14C implementation.
- `src/features/sync-engine/index.ts` — public sync engine exports.
- `src/features/sync-engine/bootstrap.ts` — profile/store/default remote bootstrap.
- `src/features/sync-engine/simple-entity-sync.ts` — direct table sync for simple entities.
- `src/features/sync-engine/run-sync.ts` — queue orchestration and batch runner.
- `src/features/sync-engine/types.ts` — sync result/status types.

## Files Likely to Modify

- `src/features/local-app/index.ts` — call/bootstrap remote-aware store loading and expose sync trigger/status if needed.
- `src/app/App.tsx` — add minimal manual sync action/status display only.
- `src/features/cashier/sync-checkout.ts` — integrate into sync runner and adjust edge cases if verification reveals mismatch.
- `src/features/cashier/sync-contract.ts` — adjust payload typing only if RPC/schema verification requires it.
- `src/features/sync-queue/repository.ts` — add helper(s) for grouped checkout queue handling if needed.
- `src/lib/db/types.ts` — only if sync status/metadata typing gaps are found.
- `supabase/migrations/002_warungin_v2_schema.sql` — only if dry inspection finds a blocking schema/RLS issue before apply.
- `supabase/migrations/003_checkout_rpc_stock_safety.sql` — only if dry inspection finds a blocking RPC contract issue before apply.

## Implementation Plan for Sprint 14C Execution

### Phase 0 — Preflight and approval

1. Confirm latest `develop` is clean.
2. Re-read Sprint 14C plan and migration files.
3. Ask user for explicit migration approval.
4. Confirm target Supabase project/environment.
5. Stop if approval or target project is ambiguous.

### Phase 1 — Migration apply and inspection

Only after approval:

1. Apply migration `002`.
2. Apply migration `003`.
3. Inspect that these exist:
   - tables: `profiles`, `stores`, `categories`, `products`, `payment_methods`, `transactions`, `transaction_items`, `expense_categories`, `expenses`
   - RLS enabled on all v2 tables
   - RPC: `create_transaction_with_stock_update(jsonb)`
4. Run a minimal authenticated RLS smoke if practical.
5. If migration apply fails, stop and report exact failure. Do not patch blindly.

### Phase 2 — Remote bootstrap implementation

1. Add sync bootstrap module.
2. Ensure authenticated profile row.
3. Ensure primary store row.
4. Link local store to remote store via `remoteId`.
5. Sync default categories/payment methods/expense categories as prerequisites.
6. Verify remote IDs are persisted locally.

### Phase 3 — Simple entity sync

1. Implement entity payload mappers local → Supabase v2.
2. Implement create/update/delete by entity type.
3. Write returned IDs and timestamps back to local records.
4. Mark queue items synced/failed.
5. Preserve local-first behavior when cloud fails.

### Phase 4 — Checkout RPC sync

1. Detect checkout transaction groups from queue.
2. Ensure product remote IDs exist before RPC.
3. Use `syncCheckoutTransactionGroup()` for grouped checkout sync.
4. Verify success path updates transaction/item/product records.
5. Verify RPC conflict path marks conflict safely.

### Phase 5 — Minimal UI wiring

1. Add manual sync button or retry action near current sync pill.
2. Keep copy simple for UMKM users.
3. Show failure/conflict counts truthfully.
4. Do not add complex conflict resolution UI in this sprint.

### Phase 6 — Verification

Run local gates:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev`
- `git diff --check`

Run app smoke:

- `/`
- `/login`
- authenticated local v2 dashboard load
- product create/edit/delete queue behavior
- expense create/delete queue behavior
- checkout local transaction + stock decrement
- manual sync success/failure status behavior

Run Supabase smoke after migration approval/apply:

- profile/store bootstrap insert/select under authenticated user
- product/category insert/select/update under authenticated user
- cross-user RLS denial if test users are available
- checkout RPC success with enough stock
- checkout RPC conflict with insufficient stock
- duplicate receipt RPC conflict

## Data Safety Rules

- Do not touch legacy v1 tables unless explicitly requested.
- Do not delete cloud operational rows destructively when soft delete exists.
- Do not overwrite local records with cloud data unless remote ownership and IDs match.
- Do not mark queue items synced unless remote write/RPC success is confirmed.
- Do not claim external release readiness after Sprint 14C; run Sprint 14D QA/re-preview first.

## Known Risks / Questions

1. **Remote ID prerequisites** — checkout RPC cannot run until store/products have Supabase UUID remote IDs.
2. **Migration environment risk** — applying to the wrong Supabase project would create incorrect live schema; target project must be confirmed.
3. **RLS edge cases** — policy behavior must be tested with authenticated users after apply.
4. **RPC stock reconciliation** — local stock is decremented immediately; cloud RPC returns canonical stock and must update local product records.
5. **Default seed sync** — local default categories/payment methods may need remote IDs before product/checkout sync.
6. **No legacy data migration** — existing legacy cloud rows will not automatically appear in v2 unless a separate migration/import sprint is approved.

## Recommended Sprint 14C Execution Boundary

Sprint 14C should be considered complete when:

- migrations `002` and `003` are applied to the approved Supabase project,
- local store/products/categories/expenses can sync to v2 cloud tables,
- checkout can sync through RPC after prerequisites are synced,
- failures/conflicts are visible and retryable,
- all verification gates pass,
- PR is opened and reviewed.

Sprint 14C should not include broad UI redesign, public release, Android work, or full multi-device pull sync.

## Next Sprint After 14C

Sprint 14D should be reserved for post-cutover QA/re-preview:

- run controlled preview checklist again,
- test cloud/local consistency across reloads,
- verify reports/receipts after synced transactions,
- test RLS/cross-user safety,
- decide whether internal preview status can be upgraded.
