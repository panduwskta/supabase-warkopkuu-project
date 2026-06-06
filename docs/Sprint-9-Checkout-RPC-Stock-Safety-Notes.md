# Sprint 9 — Checkout RPC + Stock Safety Notes

**Status:** Draft v0.1  
**Scope:** Repository RPC migration draft and documentation only. No production Supabase apply, no runtime worker, no UI wiring.

---

## 1. Summary

Sprint 9 adds the first checkout RPC draft for Warungin v2 cloud stock safety.

The RPC is designed to keep checkout cloud sync atomic:

1. validate authenticated store ownership,
2. validate checkout payload,
3. validate product ownership,
4. lock product rows,
5. reject insufficient stock,
6. insert transaction,
7. insert transaction items,
8. decrement product stock,
9. return a structured success/error payload.

This follows Sprint 8.5 guardrails: checkout sync must not use generic direct table pushes for transaction, transaction items, and product stock deduction.

---

## 2. Files Added

- `supabase/migrations/003_checkout_rpc_stock_safety.sql`

This migration is a repository draft only. It must not be applied to production Supabase without explicit approval.

---

## 3. RPC Added

```sql
public.create_transaction_with_stock_update(payload jsonb)
```

Return type:

```sql
jsonb
```

Security mode:

```sql
security invoker
```

This keeps the function aligned with authenticated user/RLS expectations and avoids bypassing ownership checks silently.

---

## 4. Input Contract

The RPC expects a JSONB payload using the contract prepared in Sprint 8.5.

Key fields:

- `storeId`
- `receiptNumber`
- `transactionDate`
- `subtotal`
- `discountAmount`
- `total`
- `paymentMethodId`
- `paymentMethodSnapshot`
- `paymentAmount`
- `changeAmount`
- `profitEstimate`
- `status`
- `notes`
- `items[]`

Each item requires:

- `productId`
- `productLocalId`
- `localTransactionItemId`
- `productNameSnapshot`
- `priceSnapshot`
- `hppSnapshot`
- `quantity`
- `subtotal`
- `profitEstimate`
- `notes`

Important limitation:

- `productId` must be a remote cloud product UUID.
- If a local product has not synced yet and has no remote ID, checkout cloud sync must wait/fail until product sync exists.

---

## 5. Success Response

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

Expected future client handling:

- mark local transaction as `synced`,
- save transaction `remoteId`,
- mark local transaction items as `synced`,
- save transaction item `remoteId`,
- reconcile product stock from cloud response,
- mark related queue entries as `synced`,
- set `lastSyncedAt`.

---

## 6. Error / Conflict Responses

### 6.1 Unauthenticated

```json
{
  "ok": false,
  "code": "UNAUTHENTICATED",
  "message": "User must be authenticated to checkout."
}
```

### 6.2 Unauthorized Store

```json
{
  "ok": false,
  "code": "UNAUTHORIZED_STORE",
  "message": "User cannot checkout for this store."
}
```

### 6.3 Invalid Payload

```json
{
  "ok": false,
  "code": "INVALID_PAYLOAD",
  "message": "Checkout payload failed database validation."
}
```

### 6.4 Insufficient Stock

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

### 6.5 Duplicate Receipt

```json
{
  "ok": false,
  "code": "DUPLICATE_RECEIPT",
  "message": "Receipt number already exists for this store.",
  "transactionId": "existing_remote_transaction_uuid_or_null"
}
```

---

## 7. Atomicity Rules

The RPC locks product rows using `for update` before writing checkout records.

If stock is insufficient:

- no transaction is inserted,
- no transaction item is inserted,
- no product stock is decremented,
- structured conflict response is returned.

If database validation fails inside the write block, the PL/pgSQL exception block rolls back the block and returns a structured error.

---

## 8. Idempotency / Duplicate Guard

Sprint 9 does not add a new `client_mutation_id` column.

Current MVP duplicate guard:

```sql
unique (store_id, receipt_number)
```

If duplicate receipt is detected, the RPC returns `DUPLICATE_RECEIPT` and the existing transaction ID when found.

Future improvement, requires explicit schema approval:

- add `client_mutation_id` to transactions,
- create unique `(store_id, client_mutation_id)`,
- use that as stronger retry/idempotency guard.

---

## 9. Current Limitations

- Migration is not applied to production.
- No local sync worker calls the RPC yet.
- No runtime UI behavior changed.
- Product/category direct sync is still pending.
- Checkout sync requires products to already have remote IDs.
- No complex conflict resolver UI yet.
- No Open Bill support.

---

## 10. Recommended Follow-Up

Next sprint should implement a very thin checkout RPC caller / queue processor layer, not a broad generic worker.

Recommended Sprint 10 candidate direction, depending on review:

1. Build checkout RPC payload from local transaction group.
2. Call `create_transaction_with_stock_update()` for checkout groups only.
3. Mark transaction/items/products/queue entries based on response.
4. Keep direct sync for simple entities as a separate sprint.

If receipt PNG remains the priority per original SRD numbering, decide explicitly before continuing because Sprint 8 was partial and Sprint 9 introduced the RPC draft first.
