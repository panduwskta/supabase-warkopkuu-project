# Sprint 8.5 — Sync Alignment & RPC Contract Prep

**Status:** Draft v0.1  
**Scope:** Documentation/alignment only. No runtime code, no SQL migration, no Supabase deployment.

---

## 1. Purpose

Sprint 8.5 exists to realign Warungin v2 development with the source-of-truth documents before implementing cloud sync work.

This sprint was added after reviewing the Sprint 9 direction and identifying that a generic direct push worker for checkout entities would violate the accepted hybrid sync strategy.

Source-of-truth references:

- `docs/PRD-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`

---

## 2. Current Progress Audit

### Sprint 0 — Technical Reference & Pattern Search

Status: completed.

Added technical reference notes for:

- TypeScript migration,
- Tailwind/shadcn foundation,
- Dexie local DB,
- Supabase RLS/RPC,
- branch/release workflow,
- receipt PNG,
- Excel/PDF export.

### Sprint 1 — TypeScript Baseline & App Structure

Status: completed.

Added TypeScript app baseline and modular app structure.

### Sprint 2 — Tailwind/shadcn Foundation

Status: completed.

Added Tailwind/shadcn UI foundation.

### Sprint 3 — Supabase v2 Schema Draft

Status: completed as repository draft.

Added Warungin v2 schema/RLS migration draft. Migration is not treated as production-applied unless explicitly approved/applied later.

### Sprint 4 — Local DB Foundation

Status: completed.

Added Dexie local database foundation and local entity types.

### Sprint 5 — Onboarding Sample Data

Status: completed.

Added sample data helpers and onboarding state foundation.

### Sprint 6 — Product/Menu + HPP

Status: completed.

Added local product/category repository helpers with HPP, stock, and soft-delete behavior.

### Sprint 7 — Cashier Checkout Local

Status: completed.

Added local cart/checkout flow with transaction snapshots and local stock deduction.

### Sprint 8 — Sync Queue Foundation

Status: completed as queue foundation, but not full Sync Engine MVP.

Added:

- local sync queue helpers,
- checkout queue entries,
- queue status transitions.

Important gap:

- No basic cloud sync worker exists yet.
- No direct sync for simple entities exists yet.
- No checkout RPC integration exists yet.

Therefore Sprint 8 should be understood as **Sync Queue Foundation / partial Sync Engine MVP**, not a completed full sync engine.

---

## 3. Source-of-Truth Sync Rules

Warungin v2 uses a hybrid sync strategy.

### 3.1 Direct Table Operations Allowed For Simple Entities

Allowed direct Supabase table operations:

- products,
- categories,
- expenses,
- payment methods,
- settings,
- onboarding/demo state.

These may use last-write-wins by `updated_at` for MVP conflict handling.

### 3.2 RPC Required For Checkout + Stock

Checkout sync must use a server-side RPC/transaction for:

- transaction creation,
- transaction item creation,
- stock validation,
- stock decrement.

Reason:

- checkout is the most operationally critical flow,
- transaction/items/stock must not partially save,
- stale stock must produce a clear conflict state.

A generic direct table push worker for `transaction`, `transactionItem`, and `product:update` stock deduction is not acceptable for checkout sync.

---

## 4. Checkout RPC Candidate

Working function name:

```sql
create_transaction_with_stock_update(payload jsonb)
```

Expected responsibility:

1. Validate authenticated user owns the store.
2. Validate payload shape.
3. Validate receipt number uniqueness/idempotency.
4. Validate all products belong to the store.
5. Validate current cloud stock is sufficient.
6. Insert transaction.
7. Insert transaction items.
8. Decrement product stock atomically.
9. Return remote transaction/item/product results.
10. Fail atomically with a structured error/conflict response.

---

## 5. Proposed RPC Payload Contract

```json
{
  "clientMutationId": "transaction_local_uuid_or_sync_queue_group_id",
  "storeId": "remote_store_uuid",
  "localTransactionId": "transaction_local_id",
  "receiptNumber": "WRG-20260607-0001",
  "transactionDate": "2026-06-07T00:00:00.000Z",
  "subtotal": 25000,
  "discountAmount": 0,
  "total": 25000,
  "paymentMethodId": "remote_payment_method_uuid_or_null",
  "paymentMethodSnapshot": "cash",
  "paymentAmount": 30000,
  "changeAmount": 5000,
  "profitEstimate": 10000,
  "status": "completed",
  "notes": null,
  "items": [
    {
      "localTransactionItemId": "transaction_item_local_id",
      "productId": "remote_product_uuid",
      "productLocalId": "product_local_id",
      "productNameSnapshot": "Kopi Tubruk",
      "priceSnapshot": 10000,
      "hppSnapshot": 4000,
      "quantity": 2,
      "subtotal": 20000,
      "profitEstimate": 12000,
      "notes": null
    }
  ]
}
```

### 5.1 Required Fields

- `clientMutationId`
- `storeId`
- `localTransactionId`
- `receiptNumber`
- `transactionDate`
- `subtotal`
- `discountAmount`
- `total`
- `paymentAmount`
- `changeAmount`
- `profitEstimate`
- `status`
- `items[]`
- each item must include either a valid `productId` or a clear future mapping path from `productLocalId` to remote product ID.

### 5.2 Open Contract Questions

Before Sprint 9 implementation, confirm:

1. Should `clientMutationId` be stored in a cloud column for idempotency?
2. Should local IDs be stored in cloud metadata columns, or only used client-side?
3. Should the RPC return updated product stock values for local reconciliation?
4. Should the RPC accept `receiptNumber` as the idempotency key if `clientMutationId` is not persisted?

Recommended MVP answer:

- Add/use `clientMutationId` in payload for client-side grouping.
- For cloud idempotency, prefer adding a future `client_mutation_id` unique column only if explicitly approved as schema change.
- If no schema change is approved, use `(store_id, receipt_number)` uniqueness as the MVP duplicate guard.

---

## 6. Proposed RPC Success Response

```json
{
  "ok": true,
  "transactionId": "remote_transaction_uuid",
  "receiptNumber": "WRG-20260607-0001",
  "transactionItems": [
    {
      "localTransactionItemId": "transaction_item_local_id",
      "transactionItemId": "remote_transaction_item_uuid"
    }
  ],
  "products": [
    {
      "productLocalId": "product_local_id",
      "productId": "remote_product_uuid",
      "stock": 8
    }
  ],
  "syncedAt": "2026-06-07T00:00:00.000Z"
}
```

Client-side handling after success:

- mark local transaction `syncStatus: 'synced'`,
- set transaction `remoteId`,
- mark transaction items `syncStatus: 'synced'`,
- set transaction item `remoteId`,
- update product `remoteId` if missing and returned,
- update product stock from server response if returned,
- mark related queue entries `synced`,
- set entity `lastSyncedAt`.

---

## 7. Proposed RPC Error / Conflict Response

### 7.1 Unauthorized Store

```json
{
  "ok": false,
  "code": "UNAUTHORIZED_STORE",
  "message": "User cannot checkout for this store."
}
```

Client-side handling:

- mark queue entries `failed`,
- keep local transaction for review,
- show auth/store error in future sync UI.

### 7.2 Invalid Payload

```json
{
  "ok": false,
  "code": "INVALID_PAYLOAD",
  "message": "Checkout payload is invalid.",
  "details": []
}
```

Client-side handling:

- mark queue entries `failed`,
- store `lastError`,
- do not retry automatically until payload is fixed.

### 7.3 Insufficient Stock Conflict

```json
{
  "ok": false,
  "code": "INSUFFICIENT_STOCK",
  "message": "Cloud stock is lower than checkout quantity.",
  "conflicts": [
    {
      "productId": "remote_product_uuid",
      "productLocalId": "product_local_id",
      "requestedQuantity": 3,
      "availableStock": 1
    }
  ]
}
```

Client-side handling:

- mark transaction and related queue entries `conflict`,
- keep local checkout record readable,
- future UI should show "Stock needs review / conflict",
- do not silently overwrite cloud stock.

### 7.4 Duplicate Receipt / Idempotency Guard

```json
{
  "ok": false,
  "code": "DUPLICATE_RECEIPT",
  "message": "Receipt number already exists for this store.",
  "transactionId": "existing_remote_transaction_uuid_or_null"
}
```

Client-side handling:

- if the remote transaction can be proven equivalent, reconcile as synced,
- otherwise mark failed/conflict for manual review.

---

## 8. Queue Grouping Rule For Checkout

Sprint 8 currently creates separate queue entries for:

1. `transaction:create`,
2. `transactionItem:create`,
3. `product:update` stock deduction.

For RPC checkout sync, these should be treated as one logical checkout group.

Recommended grouping key:

- `transaction.localId` as the primary group id,
- queue processor starts from `transaction:create`,
- gathers all pending `transactionItem:create` entries for the transaction,
- gathers product stock update entries related to the transaction items,
- builds one RPC payload,
- submits one RPC call.

Important guardrail:

- Do not individually push checkout transaction/items/stock using direct table operations.

---

## 9. Corrected Sprint 9 Direction

Correct Sprint 9 should be:

**Sprint 9 — Checkout RPC + Stock Safety**

Primary objective:

- implement safe cloud checkout sync foundation with an RPC/server-side transaction.

Suggested Sprint 9 scope:

- add SQL RPC migration draft,
- validate store ownership,
- validate stock,
- insert transaction and items atomically,
- decrement stock atomically,
- return structured success/error responses,
- add local RPC payload builder if needed,
- no generic direct checkout push worker yet unless scoped narrowly to call the RPC.

Explicitly excluded:

- Open Bill,
- complex conflict resolver UI,
- Supabase Storage receipt upload,
- broad direct sync worker for every entity,
- production migration apply without explicit approval.

---

## 10. Recommended Immediate Next Step

After Sprint 8.5 is reviewed/merged:

1. Approve a precise Sprint 9 implementation plan.
2. Implement the RPC as a migration draft.
3. Add minimal client-side contract helpers only if needed.
4. Verify with build/lint and direct SQL review.
5. Do not apply the migration to production until explicitly approved.
