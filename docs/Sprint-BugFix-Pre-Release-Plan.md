# Sprint BugFix — Pre-Release Plan

## Gate

This document is a planning gate only.

No runtime code, migration apply, Supabase data mutation, production deploy, or merge to `main` is included in this planning step.

Implementation must not begin until the user explicitly approves this plan.

## Source of Truth

Reviewed before writing this plan:

- `docs/PRD-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- `docs/Sprint-14C-Supabase-v2-Sync-RPC-Cutover-Plan.md`
- `docs/Sprint-14C.1-Remote-Bootstrap-Simple-Sync-Notes.md`
- `docs/Alignment-Review-Roadmap-Reconciliation.md`

Current `develop` context:

- Sprint 14C.1 added remote bootstrap + simple entity sync only.
- Checkout RPC execution was explicitly excluded from Sprint 14C.1.
- Staging Supabase v2 schema/RPC was previously verified.
- Production Supabase remains legacy-safe and must not be mutated without explicit approval.
- `develop` preview now requires staging Supabase project ref `bwqunnneefyunebevtyc`.
- Onboarding restore was merged after the preview bug report.

## Objective

Resolve pre-release bugs and requirement gaps that can cause misleading preview behavior, cloud/local inconsistency, or unsafe operational data handling before Warungin v2 is treated as release-ready.

The highest priority is to prevent checkout stock from reaching cloud without its matching transaction record.

## Severity-Ordered Findings

### [CRITICAL-1] Checkout stock can sync through simple entity sync before RPC

Files:

- `src/features/cashier/checkout.ts`
- `src/features/sync-engine/run-sync.ts`
- `src/features/sync-engine/simple-entity-sync.ts`

Problem:

- `checkoutLocal()` deducts stock locally.
- Checkout queue includes transaction/transaction item work plus product stock update.
- `runSimpleEntitySync()` scans and syncs all products directly.
- This can push post-checkout stock to Supabase without inserting the transaction and transaction items via RPC.

Risk:

- Cloud stock can decrease without cloud transaction history.
- Later checkout RPC wiring can double-apply or conflict with already-pushed stock.
- This violates PRD/SRS/TRD hybrid sync strategy.

Required direction:

- Prevent checkout-origin stock changes from being synced as standalone simple product updates.
- Checkout stock changes must be synced only through `create_transaction_with_stock_update(payload jsonb)`.

### [CRITICAL-2] Checkout RPC exists but is not wired into sync runner

Files:

- `src/features/cashier/sync-checkout.ts`
- `src/features/sync-engine/run-sync.ts`
- `src/app/App.tsx`

Problem:

- `syncCheckoutTransactionGroup()` exists.
- `runSimpleEntitySync()` does not call it.
- Transactions and transaction items remain local-only.

Risk:

- Sales history does not sync to cloud.
- Cloud-first MVP claim is false for POS checkout.
- Sync UI can imply successful sync while checkout queue remains pending.

Required direction:

- Add a conservative checkout queue runner that groups checkout-related queue entries by transaction.
- Ensure store/products/payment methods have remote IDs before RPC.
- Call `syncCheckoutTransactionGroup()` only after prerequisites are satisfied.
- Mark queue items synced/failed/conflict based on RPC result.

### [HIGH-1] RLS migration allows hard delete on operational tables

File:

- `supabase/migrations/002_warungin_v2_schema.sql`

Problem:

- Migration creates owner `delete` policies on operational/history tables.
- TRD/Sprint docs require soft delete for important operational history.
- Client code may soft-delete, but DB policy still allows destructive deletes.

Risk:

- A client-side bug or malicious authenticated owner request can hard-delete operational data.
- Historical transaction/product safety is weaker than documented.

Required direction:

- Update migration draft to remove or avoid destructive delete policies for operational/history tables where soft delete applies.
- Preserve delete only where intentionally safe, or document exceptions explicitly.
- Do not apply production migration in this sprint.

### [HIGH-2] Branch/staging guard and README/env guidance are fragile

Files:

- `src/lib/supabase/client.ts`
- `vite.config.js`
- `README.md`

Problem:

- Develop staging guard depends on injected branch metadata.
- Local builds without branch env can bypass the guard.
- README still references old WarkopKuu naming and hardcoded production Supabase project URL.

Risk:

- Operators can accidentally test `develop` against legacy/production Supabase.
- Public repo exposes a real project ref and misleading setup instructions.

Required direction:

- Replace README production URL with placeholder.
- Update README to Warungin v2/staging-safe guidance.
- Harden guard behavior for local `develop` where practical without blocking intentional local dev.

### [HIGH-3] Migration policy creation is not idempotent

File:

- `supabase/migrations/002_warungin_v2_schema.sql`

Problem:

- Migration uses plain `CREATE POLICY` statements.
- Rerun or partial rerun can fail on duplicate policies.

Risk:

- Manual staging recovery becomes brittle.
- Partial apply can fail mid-way.

Required direction:

- Make policy creation rerun-safe using `DROP POLICY IF EXISTS ... ON ...; CREATE POLICY ...` or equivalent guarded pattern.
- Keep migration behavior clear and reviewable.

### [MEDIUM-1] Sync UI is misleading around checkout queue and profile/store counts

Files:

- `src/features/sync-engine/run-sync.ts`
- `src/app/App.tsx`
- `src/features/local-app/index.ts`

Problem:

- Sync result counts profile/store as synced on every run.
- Toast can say success based on simple entity result while checkout queue remains pending.
- Sync pill counts queue rows that the current simple runner cannot process.

Risk:

- User thinks all data is safe in cloud when checkout rows remain local.
- Preview testers receive confusing feedback.

Required direction:

- Make sync result distinguish setup/simple/checkout work.
- Do not show full-success copy while unsynced checkout queue remains.
- Only count actual changed/synced entities, or word copy accurately.

### [MEDIUM-2] Default entities are created without sync queue entries

File:

- `src/features/local-app/index.ts`

Problem:

- Default categories, payment methods, and expense categories are inserted locally without queue entries.
- Simple sync may still scan and push them because they lack `remoteId`, but sync queue/status is not truthful.

Risk:

- UI can show no pending queue while default rows are not yet remote-linked.
- Dependency status before product/checkout sync becomes harder to reason about.

Required direction:

- Enqueue default entity creates, or explicitly treat them as bootstrap prerequisites with truthful status.
- Avoid duplicate queue entries when defaults already exist.

### [MEDIUM-3] Checkout hardcodes payment method to Tunai/cash

File:

- `src/features/local-app/index.ts`
- `src/app/App.tsx`

Problem:

- Checkout always uses `paymentMethodSnapshot: 'Tunai'` and `paymentMethodKind: 'cash'`.
- User cannot select QRIS, Transfer, or E-wallet.

Risk:

- PRD/SRS payment method requirement is not met.
- Receipts/reports misrepresent non-cash payments.
- Checkout RPC payload often lacks payment method mapping.

Required direction:

- Add minimal payment method selection in checkout UI.
- Pass selected method to local checkout.
- Store snapshot/kind and remote ID when available.

### [LOW-1] Legacy localStorage fallback remains in `App.tsx`

File:

- `src/app/App.tsx`

Problem:

- `LOCAL_KEY` and `warkop_session` localStorage fallback auth remain after Dexie/local-v2 cutover.

Risk:

- Architecture boundary is confusing.
- Local fallback can mask Supabase/env issues.

Required direction:

- Decide whether to remove it or label/isolate it as explicit demo-only fallback.
- Do not mix operational POS data back into localStorage v1.

## Proposed Sprint Split

The full bug list is too large for one safe implementation sprint. It should be split into small, reviewable sprints.

### Sprint BF-1 — Checkout Sync Safety Blocker

Objective:

Prevent cloud stock from changing without matching cloud checkout transaction, and wire checkout RPC in a conservative way.

Scope included:

- Block checkout-origin `product:update` from direct simple product sync.
- Detect checkout transaction groups from `syncQueue`.
- Ensure prerequisites before checkout RPC:
  - store remote ID,
  - product remote IDs,
  - payment method remote ID when available.
- Call `syncCheckoutTransactionGroup()` from sync runner.
- Mark transaction, transaction item, and checkout-related product queue entries based on RPC result.
- Improve sync result summary enough to avoid false success copy.

Scope excluded:

- Background/automatic sync.
- Full pull sync.
- Complex conflict resolver UI.
- Payment method UI changes unless required for RPC safety.
- Migration edits.
- README/package cleanup.

Files likely to modify:

- `src/features/sync-engine/run-sync.ts`
- `src/features/sync-engine/simple-entity-sync.ts`
- `src/features/sync-engine/types.ts`
- `src/features/cashier/sync-checkout.ts`
- `src/features/sync-queue/repository.ts`
- `src/features/local-app/index.ts`
- `src/app/App.tsx`

Verification preview:

- Static gates: `npm run build`, `npm run lint`, `npx tsc --noEmit`, `npm audit --omit=dev`, `git diff --check`.
- Scope grep: simple sync must not directly process checkout stock updates.
- Local smoke: checkout creates queue; manual sync attempts checkout RPC path after prerequisites.
- Staging smoke if env/session available: checkout transaction appears in `transactions` and `transaction_items`; cloud stock updates only with transaction.

### Sprint BF-2 — Migration/RLS Safety + Repo Hygiene

Objective:

Make migration draft safer and repo docs/env guidance accurate before release.

Scope included:

- Remove hardcoded production Supabase URL from README.
- Update README from WarkopKuu to Warungin v2 current staging-safe instructions.
- Rename package metadata if safe.
- Harden develop/staging guard guidance and local behavior.
- Make `002` policy creation idempotent.
- Remove/avoid hard delete policies on operational/history tables where soft delete is required.

Scope excluded:

- Applying migrations to production.
- Mutating Supabase data.
- Renaming legacy production tables.
- Checkout RPC runner changes.

Files likely to modify:

- `README.md`
- `package.json`
- `package-lock.json` if package name changes
- `src/lib/supabase/client.ts`
- `vite.config.js`
- `supabase/migrations/002_warungin_v2_schema.sql`

Verification preview:

- Static gates: build/lint/typecheck/audit/diff check.
- SQL inspection: no plain duplicate-prone policy creation remains in modified areas.
- SQL inspection: operational tables no longer grant unintended destructive delete policies.
- Grep: no hardcoded production Supabase URL in README/source docs intended for setup.

### Sprint BF-3 — Sync Status Truthfulness + Default Entity Queue

Objective:

Make sync UI and local default records accurately reflect pending/synced state.

Scope included:

- Enqueue default categories/payment methods/expense categories or explicitly mark them through bootstrap sync with truthful status.
- Avoid duplicate queue rows for existing defaults.
- Make manual sync toast reflect remaining pending/failed/conflict queue items.
- Do not count profile/store as user data synced every run unless an actual remote write happened.

Scope excluded:

- Checkout RPC wiring if already completed in Sprint BugFix-A.
- Background sync.
- Full settings sync page.

Files likely to modify:

- `src/features/local-app/index.ts`
- `src/features/sync-engine/run-sync.ts`
- `src/features/sync-engine/types.ts`
- `src/app/App.tsx`
- `src/features/sync-queue/repository.ts`

Verification preview:

- Static gates.
- New account with onboarding sample data: sync pill and toast should match queue reality.
- Existing default rows without remote IDs should be syncable and visible as pending or setup work.

### Sprint BF-4 — Payment Method Selection

Objective:

Meet minimum PRD/SRS payment method requirement for checkout.

Scope included:

- Show basic payment method selection: Tunai, QRIS, Transfer, E-wallet.
- Preserve payment amount/change flow for cash.
- Store payment method kind/snapshot in local transaction.
- Map payment method remote ID if available before checkout RPC.
- Display payment method in receipt/transaction detail where already supported by data shape.

Scope excluded:

- Payment gateway.
- QRIS integration.
- Payment method CRUD/settings page.
- Advanced payment details.

Files likely to modify:

- `src/app/App.tsx`
- `src/features/local-app/index.ts`
- `src/features/cashier/types.ts` if typing gaps appear
- `src/features/cashier/sync-contract.ts` if remote payment ID mapping needs adjustment

Verification preview:

- Static gates.
- Checkout with cash, QRIS, transfer, e-wallet.
- Receipt/payment snapshot reflects selected method.
- RPC payload includes payment method snapshot and remote ID when available.

### Sprint BF-5 — Legacy localStorage Fallback Cleanup Decision

Objective:

Remove or isolate legacy v1 localStorage fallback to avoid architecture confusion.

Recommended approach:

- Remove localStorage v1 operational fallback from visible app if Supabase is required for preview.
- If anonymous/demo mode is needed, implement it through Dexie local-v2 only, not `warkop_local_v1`.

Scope excluded:

- Legacy data migration.
- Import old v1 localStorage data.
- Anonymous exploration full implementation unless separately approved.

Files likely to modify:

- `src/app/App.tsx`
- possibly onboarding/local-v2 modules if Dexie anonymous mode is implemented.

Verification preview:

- Static gates.
- Supabase missing/misconfigured state is explicit and does not silently create v1 localStorage account data.
- Logged-in staging flow still works.


## Migration Apply Estimate By Sprint

| Sprint | Requires migration file edit? | Requires Supabase migration apply? | Separate approval phrase required? | Notes |
|---|---:|---:|---|---|
| BF-1 — Checkout Sync Safety Blocker | No expected SQL edit | No, if staging already has 002/003 applied | Not expected | Runtime sync runner/RPC caller wiring only. Uses existing staging RPC if available. |
| BF-2 — Migration/RLS Safety + Repo Hygiene | Yes, edits `002_warungin_v2_schema.sql` draft | **Not during implementation by default** | `APPROVE MIGRATION APPLY supabase/migrations/002_warungin_v2_schema.sql` | Plan/edit migration safely first; applying to any Supabase project requires separate explicit approval. |
| BF-3 — Sync Status Truthfulness + Default Entity Queue | No expected SQL edit | No | Not expected | Local queue/status behavior only. |
| BF-4 — Payment Method Selection | No expected SQL edit | No | Not expected | Uses existing `payment_methods` schema. |
| BF-5 — Legacy localStorage Fallback Cleanup Decision | No expected SQL edit | No | Not expected | Frontend architecture cleanup/decision only. |

## Approval Gate By Sprint

Each sprint requires explicit approval before execution. Approving one sprint does not approve the next sprint.

| Sprint | Approval phrase before coding | Extra migration approval if needed |
|---|---|---|
| BF-1 | `APPROVE Sprint BF-1 — Checkout Sync Safety Blocker` | None expected |
| BF-2 | `APPROVE Sprint BF-2 — Migration/RLS Safety + Repo Hygiene` | Required separately before applying SQL: `APPROVE MIGRATION APPLY supabase/migrations/002_warungin_v2_schema.sql` |
| BF-3 | `APPROVE Sprint BF-3 — Sync Status Truthfulness + Default Entity Queue` | None expected |
| BF-4 | `APPROVE Sprint BF-4 — Payment Method Selection` | None expected |
| BF-5 | `APPROVE Sprint BF-5 — Legacy localStorage Fallback Cleanup Decision` | None expected |

## Recommended Execution Order

1. **Sprint BF-1 — Checkout Sync Safety Blocker**
   - Highest risk because it can corrupt cloud operational consistency.
2. **Sprint BF-2 — Migration/RLS Safety + Repo Hygiene**
   - Needed before any wider preview/release and before production migration strategy.
3. **Sprint BF-3 — Sync Status Truthfulness + Default Entity Queue**
   - Reduces tester confusion and improves sync reliability.
4. **Sprint BF-4 — Payment Method Selection**
   - Required by PRD/SRS, but less dangerous than checkout stock/cloud inconsistency.
5. **Sprint BF-5 — Legacy localStorage Fallback Cleanup Decision**
   - Important cleanup; can be split depending on anonymous exploration decision.

## Explicit Non-Goals For This BugFix Phase

Unless separately approved, this phase does not include:

- Production Supabase migration apply.
- Legacy production table rename/delete/migration.
- Full background sync worker.
- Full multi-device pull sync.
- Full conflict resolver UI.
- Android/Capacitor work.
- Play Store submission.
- Large App.tsx refactor unrelated to the bugs above.
- New major libraries.

## Required Approval Gate

Before implementation starts, user should approve one sprint at a time.

Recommended next approval phrase:

```text
APPROVE Sprint BF-1 — Checkout Sync Safety Blocker
```

After BugFix-A is implemented and verified, continue with the next sprint only after review/approval.

## Verification Gate For Each Implementation Sprint

Minimum verification before claiming completion:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev`
- `git diff --check`

Additional verification depending on sprint:

- grep/scope checks for checkout RPC/simple sync boundaries,
- staging Supabase smoke tests for sync/RPC when credentials/env allow,
- SQL inspection for migration safety changes,
- route smoke for `/`, `/login`, `/login?mode=register`,
- manual app smoke for onboarding → product → checkout → sync → reports.

## Known Risks / Open Questions

1. **Checkout RPC staging smoke requires a valid authenticated Supabase session.** If local browser/session access is unavailable, verification may be limited to static and code inspection until user tests preview.
2. **Migration 002 production collision remains unresolved.** Production still needs a separate strategy because legacy `public.expenses` conflicts with v2 `expenses`.
3. **Anonymous exploration remains a product gap.** Removing localStorage fallback without implementing Dexie anonymous mode may increase login dependency; this needs an explicit decision.
4. **RLS hard-delete policy changes affect future migration behavior.** Any migration edit must be reviewed carefully before applying to any cloud project.
5. **Payment method selection can be implemented minimally, but payment method settings/CRUD should remain out of scope unless separately approved.

## Plan Acceptance Criteria

This plan is acceptable if:

- Findings are severity ordered.
- Critical checkout cloud consistency issues are first.
- Migration/RLS safety and repo hygiene are separated from runtime sync work.
- Each sprint is small enough to review.
- Production migration and legacy data mutation remain blocked without explicit approval.
