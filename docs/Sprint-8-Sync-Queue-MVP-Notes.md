# Sprint 8 — Sync Queue MVP Notes

**Status:** Draft v0.1  
**Scope:** Local sync queue foundation only. No Supabase push worker, no pull sync, no conflict resolver UI.

---

## 1. Summary

Sprint 8 adds a local sync queue MVP on top of the Dexie local DB.

The queue records local mutations that should be pushed to the cloud in a later sprint. It is intentionally transport-agnostic: this sprint only creates, lists, and updates queue state.

---

## 2. Queue Entry Contract

Each queue item stores:

- store id,
- entity type,
- local entity id,
- optional remote entity id,
- operation: `create`, `update`, or `delete`,
- payload snapshot,
- status,
- retry count,
- last error,
- created / updated / synced timestamps.

---

## 3. Helper Behavior

Added local helpers for:

- enqueue single queue item,
- enqueue multiple queue items,
- list queue items by store/status,
- list pending work,
- mark item as `syncing`,
- mark item as `synced`,
- mark item as `failed`,
- reset failed items back to `pending`.

Enqueue dedupes active queue entries by:

```text
entityType + entityLocalId + operation
```

If an active queue item already exists, the helper refreshes the payload and keeps the original retry count and created timestamp.

---

## 4. Checkout Integration

`checkoutLocal()` now creates sync queue entries inside the same Dexie transaction that creates checkout records and deducts stock.

Checkout enqueue order:

1. `transaction:create`
2. `transactionItem:create` for each item snapshot
3. `product:update` for each stock deduction

This keeps local checkout data and its sync intent atomic.

---

## 5. Current Limitations

- No Supabase push worker yet.
- No remote stock validation/RPC yet.
- No pull sync yet.
- No conflict resolution yet.
- Product/category CRUD helpers are not fully wired to enqueue sync entries yet; this sprint focuses on checkout path MVP.

---

## 6. Recommended Follow-Up

Next sprint should implement the first push worker for queue items, starting with checkout entities:

1. push transaction,
2. push transaction items,
3. push product stock updates,
4. mark queue items synced or failed,
5. update local entity `remoteId`, `syncStatus`, and `lastSyncedAt` where applicable.
