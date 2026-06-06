# Sprint 7 — Cashier Checkout Local Notes

**Status:** Draft v0.1  
**Scope:** Local checkout data foundation only. No UI wiring, no cloud sync, no receipt PNG.

---

## 1. Summary

Sprint 7 adds local cashier checkout helpers on top of the Dexie local DB.

The module converts cart items into a local transaction, transaction item snapshots, and local product stock updates.

---

## 2. Checkout Rules

- Cart cannot be empty.
- Quantity must be greater than `0`.
- Product must exist and be active.
- Quantity cannot exceed local product stock.
- Payment amount must be greater than or equal to transaction total.
- Transaction status defaults to `completed`.
- Receipt number uses the `WRG` prefix by default.

---

## 3. Snapshot Rules

Each transaction item stores:

- product local/remote reference,
- product name snapshot,
- price snapshot,
- HPP snapshot,
- quantity,
- subtotal,
- profit estimate.

This protects historical transaction readability even if products change later.

---

## 4. Stock Rules

Checkout deducts stock locally inside the same Dexie transaction that creates the transaction and transaction items.

Cloud-side stock validation/RPC is intentionally deferred to a later sprint.

---

## 5. Current Limitations

- Current UI is not wired to `checkoutLocal()` yet.
- No sync queue entry is created yet.
- No Supabase RPC is called.
- No receipt PNG is generated.
- No Open Bill support.

---

## 6. Recommended Follow-Up

Next sprint should implement the sync queue MVP or a thin UI integration layer, depending on whether we want to connect current screens to the local modules before cloud sync.
