# Sprint 3 — Supabase v2 Schema Notes

**Status:** Draft v0.1  
**Related Migration:** `supabase/migrations/002_warungin_v2_schema.sql`  
**Scope:** Repo-only schema draft. Not applied to live Supabase.

---

## 1. Summary

Sprint 3 adds the first Warungin v2 Supabase schema draft as a migration file.

The migration intentionally creates separate v2 tables and leaves the existing WarkopKuu v1 tables untouched.

---

## 2. Tables Added

- `profiles`
- `stores`
- `categories`
- `products`
- `payment_methods`
- `transactions`
- `transaction_items`
- `expense_categories`
- `expenses`

---

## 3. Ownership Model

The schema uses store-based ownership:

- `profiles.id` maps to `auth.users.id`.
- `stores.owner_user_id` maps to `auth.users.id`.
- Operational tables use `store_id`.
- RLS checks whether the authenticated user owns the referenced store.

This keeps MVP single-user while preparing for future staff/multi-store support.

---

## 4. MVP Decisions Preserved

- Receipt prefix default: `WRG`.
- HPP/modal is included in `products` and transaction item snapshots.
- Receipt PNG remains local-only; no Supabase Storage table/upload is added.
- v1 tables remain legacy and are not migrated automatically.
- Soft delete fields are included for operational safety.

---

## 5. RPC Decision

Checkout RPC is intentionally not implemented in this sprint.

Reason:

- Safe checkout RPC should atomically insert transaction rows, insert transaction item rows, validate stock, and decrement stock.
- That deserves a focused implementation/review sprint after schema review.

Recommended follow-up:

- Create a future sprint for `checkout RPC + stock safety` after local DB and sync contracts are clearer.

---

## 6. Review Notes Before Applying to Supabase

Before applying this migration to staging or production:

1. Review table names and fields against PRD/SRS/TRD.
2. Review RLS policies with at least two test users.
3. Confirm whether staging and production Supabase projects are separated.
4. Apply to staging first, not production.
5. Verify insert/select/update/delete behavior for each table.

---

## 7. Current Status

This sprint only stores the migration in GitHub. It does not create live Supabase tables until explicitly applied later.
