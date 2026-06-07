# Sprint 14A — v2 Architecture Cutover Design & Readiness

## Gate

Sprint 14A is a design/readiness sprint only.

No source code cutover, no Supabase migration apply, no deployment change, and no release prep are included in this sprint.

## Why Sprint 14A Exists

Alignment Review found that Warungin v2 foundations exist, but the visible app flow is still centered in `src/app/App.tsx` using legacy/current tables and localStorage fallback:

- `menu_items`
- `orders`
- `expenses`
- localStorage `warkop_local_v1`

Meanwhile, the intended v2 architecture exists as foundations:

- Dexie/local DB in `src/lib/db/*`
- v2 feature modules in `src/features/*`
- Supabase v2 schema draft in `supabase/migrations/002_warungin_v2_schema.sql`
- Checkout RPC draft in `supabase/migrations/003_checkout_rpc_stock_safety.sql`
- Checkout RPC client foundation in `src/features/cashier/sync-checkout.ts`

Because `main` remains the legacy-safe app, `develop` should now be aligned as the Warungin v2 major update instead of previewing the legacy/current table flow.

## Source of Truth

- `docs/PRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- `docs/Alignment-Review-Roadmap-Reconciliation.md`
- Existing sprint notes 0–13

Key source-of-truth requirements:

- Supabase is cloud source of truth for logged-in users.
- UI should update immediately from local data.
- Previously loaded data should remain available locally.
- Local changes should create sync queue entries.
- Simple entities sync directly.
- Checkout/stock uses RPC/server-side transaction.
- Store-owned data is isolated by RLS.
- Desktop remains Option B: landing + login + basic reports/export.

## Current Architecture Inventory

### Visible App Flow Today

`src/app/App.tsx` currently owns most visible runtime behavior:

| Area | Current Implementation |
|---|---|
| Auth | `useAuth()` inside `App.tsx` with Supabase auth or local fallback |
| Store/data | `useStore()` inside `App.tsx` |
| Cloud tables | `menu_items`, `orders`, `expenses` |
| Local fallback | localStorage `warkop_local_v1` |
| Product/menu UI | `Menu` component in `App.tsx` |
| Cashier UI | `Kasir` component in `App.tsx` |
| Checkout | Direct order insert + direct stock update in `App.tsx` |
| Expenses | Direct expense insert/delete in `App.tsx` |
| Dashboard/report | `buildReportData()` and export helpers in `App.tsx` |
| Receipt share | Uses `shareReceipt()` from receipt feature module |
| Desktop | Public landing, `/login`, desktop dashboard in `App.tsx` |

### v2 Foundation Modules Already Present

| Module | Files | Purpose | Cutover Status |
|---|---|---|---|
| Local DB | `src/lib/db/*` | Dexie schema/types/helpers for local-first data | Foundation ready |
| Supabase client | `src/lib/supabase/*` | Shared Supabase client | Foundation ready |
| Products | `src/features/products/*` | Category/product validation and repository | Foundation ready |
| Onboarding | `src/features/onboarding/*` | Sample data, reset, onboarding state | Foundation ready |
| Cashier | `src/features/cashier/*` | Cart helpers, local checkout, receipt number, RPC contract/caller | Foundation ready |
| Sync queue | `src/features/sync-queue/*` | Queue repository and status helpers | Foundation ready |
| Receipts | `src/features/receipts/*` | Receipt PNG/share/local metadata | Partially wired |
| Desktop | `src/features/desktop/*` | Coming Soon nav metadata | Wired |

### Supabase v2 Drafts

| Migration | Purpose | Apply Status |
|---|---|---|
| `001_warkop_schema.sql` | Legacy/current tables: `menu_items`, `orders`, `expenses` | For current app path |
| `002_warungin_v2_schema.sql` | v2 tables/RLS: profiles, stores, products, transactions, expenses, etc. | Draft only; not applied by this sprint |
| `003_checkout_rpc_stock_safety.sql` | Atomic checkout RPC with stock safety | Draft only; not applied by this sprint |

## Target v2 Architecture

### UI Source of Truth

Visible UI should read from local Dexie data first:

- `warunginDb.stores`
- `warunginDb.products`
- `warunginDb.categories`
- `warunginDb.paymentMethods`
- `warunginDb.transactions`
- `warunginDb.transactionItems`
- `warunginDb.expenses`
- `warunginDb.expenseCategories`
- `warunginDb.syncQueue`

Cloud writes should happen through sync flows, not block ordinary UI interaction.

### Cloud Source of Truth

Logged-in cloud data should use v2 Supabase tables:

- `profiles`
- `stores`
- `categories`
- `products`
- `payment_methods`
- `transactions`
- `transaction_items`
- `expense_categories`
- `expenses`

Checkout should use:

- `create_transaction_with_stock_update(payload jsonb)`

### Sync Strategy

| Entity | Local Write | Cloud Sync |
|---|---|---|
| Store/profile | local first | direct table upsert/insert/update |
| Category | local first | direct table operation |
| Product | local first | direct table operation |
| Payment method | local first | direct table operation |
| Expense category | local first | direct table operation |
| Expense | local first | direct table operation |
| Transaction checkout | local first + stock decrement | RPC checkout/stock safety |
| Transaction items | local first | included in RPC checkout |
| Receipt PNG metadata | local only for MVP | no storage upload |

## Cutover Mapping

### Auth and Store Ownership

| Current | Target | Notes |
|---|---|---|
| `useAuth()` in `App.tsx` | Keep Supabase auth but move toward shared auth/session layer | Preserve login/register/logout |
| local fallback accounts | Decide whether anonymous/local exploration remains via Dexie sample store | Do not mix localStorage v1 with v2 Dexie after cutover |
| User metadata store name | Primary `stores` row | Need create/load primary store after auth |

### Product/Menu

| Current | Target | Notes |
|---|---|---|
| `menu_items` rows | `products` + `categories` | Product localId/remoteId mapping required |
| `category` text | category local/remote relation | Need default categories or fallback text |
| `stock` nullable | stock numeric in v2 schema | Decide how empty stock maps; current v2 SQL defaults stock to 0 |
| no visible HPP depth in simple flow | `hpp` in `products` | Must expose HPP/modal in UI before v2 preview |
| hard delete current table | soft delete/deactivate | Preserve transaction history safety |

### Cashier/Checkout

| Current | Target | Notes |
|---|---|---|
| Direct `orders` insert | `checkoutLocal()` writes `transactions` + `transaction_items` | UI cart should use product local IDs |
| Direct product stock update | `checkoutLocal()` stock decrement local first | Cloud stock decrement via RPC later |
| `items` JSON snapshot | normalized transaction items | Report/receipt adapters needed |
| receipt `WRG-*` from timestamp | `generateReceiptNumber()` | Preserve `WRG` prefix |
| paid/change stored inside item metadata | transaction payment fields | Receipt/report adapters need to read v2 fields |

### Expenses

| Current | Target | Notes |
|---|---|---|
| `expenses` table with category string | `expenses` + `expense_categories` | Need basic category mapping/defaults |
| direct cloud insert/delete | local first + queue | Simple direct sync later |

### Dashboard / Reports / Export

| Current | Target | Notes |
|---|---|---|
| `buildReportData({ orders, expenses, menu })` | Build report from v2 local transactions/items/products/expenses | Could use adapter to keep export helpers stable |
| orders contain `items` JSON | transactions + transaction_items | Create normalized-to-report adapter |
| top products from order items | transaction_items aggregation | Preserve labels/period filters |
| Excel/PDF helpers in `App.tsx` | Extract or keep temporarily with v2 report adapter | Avoid changing export libraries |

### Receipt PNG / Share

| Current | Target | Notes |
|---|---|---|
| `orderToReceiptData(order)` | `transactionToReceiptData(transaction, items, store)` | Preserve receipt PNG/share behavior |
| item `_receipt_no`, `_paid_amount`, `_change_amount` metadata | transaction fields | Adapter required |
| local receipt metadata module present | keep local-only | No Supabase Storage upload |

### Desktop

| Current | Target | Notes |
|---|---|---|
| Desktop dashboard uses same report object | Keep same UX with v2 report adapter | Preserve `/` and `/login` |
| Coming Soon nav | Keep | No full desktop CRUD |

## Migration Readiness Plan

### Do Not Apply Yet

Do not apply `002` or `003` to live Supabase until Sprint 14C approval.

Reasons:

- UI is not cut over yet.
- Applying schema alone does not make v2 runtime work.
- Cutover needs store/profile initialization and sync mapping first.
- RLS and RPC require live two-user testing after apply.

### Proposed Apply Order Later

When Sprint 14C is approved:

1. Confirm target Supabase project and backup posture.
2. Confirm Vercel environment points to that project.
3. Apply `002_warungin_v2_schema.sql`.
4. Inspect tables and RLS policies.
5. Apply `003_checkout_rpc_stock_safety.sql`.
6. Test auth user can create profile/store.
7. Test User A/User B RLS isolation.
8. Test checkout RPC with owned store.
9. Test unauthorized store/RPC rejection.
10. Only then enable cloud sync as preview behavior.

### Rollback / Recovery Notes

These migrations create new v2 tables separate from legacy/current tables. If issues appear during staging validation:

- Do not delete legacy/current tables.
- Disable or stop v2 sync path in UI if needed.
- Preserve `main` as legacy-safe branch.
- Treat rollback as reverting app cutover branch plus cleaning unused v2 draft tables only after explicit approval.

## Recommended Implementation Slices After Sprint 14A

### Sprint 14B — Local v2 UI Cutover

Goal:

- Visible app reads/writes v2 Dexie local data.
- No live Supabase v2 apply required yet.

Scope:

- Create/load local primary store.
- Replace menu state with product/category repository.
- Replace checkout direct order path with `checkoutLocal()`.
- Replace expenses with local v2 expenses.
- Add report/receipt adapters for v2 local data.
- Add minimal sync status display from local entities/queue.
- Keep login/register/landing/desktop UX.

Verification:

- Build/lint/typecheck/audit.
- Local browser smoke with sample/local data.
- Checkout stock decrement from Dexie.
- Receipt/export still works from v2 local data.

Exit criteria:

- App can run core POS flow locally from v2 Dexie tables.
- Legacy `menu_items/orders/expenses` are no longer primary UI data source.
- No Supabase v2 claims yet.

### Sprint 14C — Supabase v2 Sync/RPC Cutover

Goal:

- Connect v2 local data to Supabase v2 schema and RPC.

Scope:

- Apply `002` and `003` only with explicit approval.
- Implement profile/store bootstrap in cloud.
- Implement direct sync for simple entities.
- Implement checkout RPC sync path.
- Implement retry for pending/failed queue where practical.
- Show pending/synced/failed/conflict states.

Verification:

- Two-user RLS test.
- Direct entity sync test.
- RPC checkout success test.
- Unauthorized store/RPC rejection test.
- Offline/online pending sync test.

Exit criteria:

- Basic v2 cloud sync works for controlled preview.
- Checkout uses RPC for cloud stock safety.
- RLS isolation has been manually verified.

### Sprint 14D — Post-cutover QA / Preview Re-run

Goal:

- Re-run preview/trial checklist after full v2 cutover.

Scope:

- Route QA.
- Mobile QA.
- Desktop QA.
- Export QA.
- Receipt QA.
- Offline/online QA.
- RLS QA.

Exit criteria:

- GO / GO WITH LIMITATIONS / NO-GO decision based on actual v2 cutover.

## Technical Design Notes for Sprint 14B

### Keep UI Change Small

Do not redesign the UI in Sprint 14B. Use current components and labels, but change the data layer behind them.

### Prefer Adapters

Create adapter functions instead of rewriting report/export/receipt all at once:

- `productToMenuItemView(product, category?)`
- `transactionToOrderView(transaction, items)`
- `expenseToExpenseView(expense, category?)`
- `buildV2ReportData(input)` or adapter into existing `buildReportData` shape
- `transactionToReceiptData(transaction, items, store)`

### Preserve Labels

Keep simple Indonesian labels:

- Pendapatan
- Jumlah Transaksi
- Pengeluaran
- Perkiraan Laba
- Menu Terlaris
- Stok Menipis
- Unduh Laporan
- Hari ini / Minggu ini / Bulan ini / Semua

### Avoid Big-Bang Source Refactor

`App.tsx` is large, but Sprint 14B should prioritize runtime cutover over architectural perfection. Extract only when it reduces risk.

## Open Decisions Before Sprint 14B

1. Should anonymous/local exploration remain available after v2 cutover?
   - Recommended: yes, but via Dexie sample store, not localStorage v1.
2. Should logged-in users require store bootstrap before app entry?
   - Recommended: yes, create/load primary store automatically if missing.
3. Should `stock` be nullable/optional in UI if v2 SQL defaults stock to 0?
   - Recommended: keep UI empty-friendly, map empty to 0 or a future `track_stock` flag decision.
4. Should Sprint 14B remove legacy localStorage data immediately?
   - Recommended: no destructive clearing. Stop using it, but do not wipe automatically.
5. Should `002/003` be adjusted before apply?
   - Recommended: review again during Sprint 14C before live apply.

## Risks and Mitigations

| Risk | Severity | Mitigation |
|---|---:|---|
| Big cutover breaks usable current app | High | Split 14B local cutover and 14C cloud cutover |
| Applying SQL before UI is ready creates confusion | High | No migration apply until 14C approval |
| Local Dexie data shape differs from current report/export shape | Medium | Use adapters before rewriting export helpers |
| Receipt PNG loses paid/change details | Medium | Map v2 transaction payment fields into `ReceiptData` |
| Stock behavior differs between nullable current stock and v2 stock default 0 | Medium | Decide UI mapping before coding |
| RLS looks correct in SQL but fails in live project | High | Mandatory two-user RLS QA after apply |
| Offline-sync claim overpromises | High | Preview wording must wait until 14C/14D validation |

## Verification for Sprint 14A

Sprint 14A verification should remain static because this is documentation-only:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev`
- `git diff --check`

## Sprint 14A Final Recommendation

Proceed with split cutover:

1. **Sprint 14B — Local v2 UI Cutover**
2. **Sprint 14C — Supabase v2 Sync/RPC Cutover**
3. **Sprint 14D — Post-cutover QA / Preview Re-run**

Do not apply v2 migrations or preview v2 as architecture-complete until Sprint 14C/14D are complete.
