# Sprint 8 — Sync Queue MVP Notes

**Status:** Draft v0.1  
**Scope:** Local sync queue foundation only. No Supabase push worker, no pull sync, no conflict resolver UI.

> Alignment note: after Sprint 8.5 review, this sprint should be understood as **Sync Queue Foundation / partial Sync Engine MVP**. The SRD roadmap's broader "Sync Engine MVP" also expects basic cloud sync, which is still pending.

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

Next sprint should not implement checkout sync as generic direct table pushes.

Correct follow-up direction:

1. prepare checkout RPC/server-side transaction contract,
2. implement safe checkout cloud sync through RPC,
3. keep transaction, transaction items, and stock deduction atomic,
4. mark queue items synced, failed, or conflict based on structured RPC result,
5. update local entity `remoteId`, `syncStatus`, and `lastSyncedAt` only after a safe cloud result.

Direct table sync remains appropriate later for simple entities such as products, categories, expenses, payment methods, settings, and onboarding/demo state.
