# Sprint 5 — Onboarding Sample Data Notes

**Status:** Draft v0.1  
**Scope:** Local sample data foundation only. No UI wiring and no Supabase sync.

---

## 1. Summary

Sprint 5 adds reusable onboarding sample data helpers for Warungin v2.

The helpers seed sample categories, products, payment methods, expense categories, and expenses into the local Dexie database created in Sprint 4.

---

## 2. Sample Dataset

The default sample data includes:

- 1 example store template.
- 4 categories:
  - Minuman
  - Makanan
  - Cemilan
  - Paket Hemat
- 10 products.
- Products with mixed HPP values, including `0` for empty-friendly HPP behavior.
- 3 payment methods:
  - Tunai
  - QRIS
  - Transfer Bank
- 3 expense categories.
- 3 sample expenses.

---

## 3. Safety Rules

- Seeded operational rows are marked with `isSample: true`.
- Reset only deletes rows marked `isSample: true` for the selected store.
- Reset does not delete real/user-created rows.
- This sprint does not implement full user-data reset.

---

## 4. Current Limitations

- The current app UI is not wired to Dexie yet.
- Sample transactions are intentionally not included yet to avoid premature stock/profit/checkout consistency decisions.
- No Supabase write/sync happens in this sprint.
- No onboarding screen is added in this sprint.

---

## 5. Recommended Follow-Up

Future onboarding/UI sprint should:

1. Create onboarding screens.
2. Let users choose business type/theme.
3. Let users start with sample data or empty data.
4. Call `seedSampleData()` only after user confirmation/selection.
5. Provide a safe reset demo data action in settings.
