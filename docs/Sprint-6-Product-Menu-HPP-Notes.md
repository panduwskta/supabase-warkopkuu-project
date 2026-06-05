# Sprint 6 — Product/Menu + HPP Notes

**Status:** Draft v0.1  
**Scope:** Local product/category feature foundation only. No UI wiring and no Supabase sync.

---

## 1. Summary

Sprint 6 adds local product/menu and category repository helpers on top of the Dexie foundation.

This sprint prepares reusable data logic for later UI integration.

---

## 2. Product Rules

- Product name is required.
- Product price must be `>= 0`.
- HPP/modal is optional and defaults to `0`.
- Stock defaults to `0` and must be `>= 0`.
- Unit defaults to `pcs`.
- Updates mark product `syncStatus` as `pending`.

---

## 3. Category Rules

- Category name is required.
- Sort order defaults to `0`.
- List queries exclude soft-deleted categories.

---

## 4. Delete / Deactivate Behavior

`deactivateProduct(localId)` does not hard-delete the product row.

It marks:

- `isActive: false`
- `isDeleted: true`
- `deletedAt: now`
- `syncStatus: 'pending'`

This protects future transaction item snapshots from broken product references.

---

## 5. Current Limitations

- Current app UI still uses existing logic.
- No checkout stock deduction is implemented here.
- No sync queue entries are created yet.
- No Supabase calls are made.
- Barcode, supplier, and advanced stock movements remain out of scope.

---

## 6. Recommended Follow-Up

Sprint 7 should implement local cashier/cart/checkout logic separately, using product snapshots and local stock checks.
