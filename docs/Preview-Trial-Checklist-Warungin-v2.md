# Preview / Trial Checklist — Warungin v2

## Gate

This checklist is for controlled internal preview/trial from `develop` after the Alignment Review.

It is a QA execution checklist only:

- Do not add new features during checklist execution.
- Do not fix bugs directly without a follow-up approved mini hardening plan/PR.
- Do not merge to `main` from this checklist alone.
- Do not apply Supabase migrations unless separately approved.
- Do not claim public/production readiness until blockers are resolved.

## Source of Truth

- `docs/Alignment-Review-Roadmap-Reconciliation.md`
- `docs/PRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- Current `develop` after Alignment Review merge commit `2a64932`

## Preview Readiness Baseline

Alignment Review recommendation:

> Ready for controlled internal preview with limitations.

Do not market this preview as:

- Fully offline-sync complete.
- Production-ready.
- Public release ready.
- Fully RLS-validated until two-user testing passes.

Safe preview wording:

> Warungin v2 internal preview for basic POS, menu, transaction, expense, reports/export, receipt PNG, and desktop minimal dashboard.

---

## 1. Environment Record

Fill this before testing.

| Field | Value |
|---|---|
| Tester |  |
| Test date/time |  |
| Deployed URL |  |
| Branch/commit tested | `develop` /  |
| Vercel deployment source |  |
| Supabase project |  |
| Browser/device 1 |  |
| Browser/device 2 |  |
| Network condition | Online / Offline toggle / Unstable |

## 2. Test Accounts

Use at least two accounts for isolation checks.

| Account | Email | Purpose | Notes |
|---|---|---|---|
| User A |  | Primary owner data setup |  |
| User B |  | Cross-user isolation check |  |

Do not store passwords in this document.

---

## 3. Result Legend

Use these statuses:

- `PASS` — works as expected.
- `FAIL` — broken or incorrect.
- `PARTIAL` — works with limitation.
- `N/A` — not applicable in this environment.
- `BLOCKED` — cannot test due missing credential/environment/tooling.

---

## 4. Deployment Route Checklist

| ID | Check | Expected Result | Status | Notes / Evidence |
|---|---|---|---|---|
| ROUTE-001 | Open deployed `/` | Public landing page loads |  |  |
| ROUTE-002 | Refresh deployed `/` | Still loads, no 404 |  |  |
| ROUTE-003 | Open deployed `/login` directly | Login/register screen loads |  |  |
| ROUTE-004 | Refresh `/login` directly | Still loads, no 404 |  |  |
| ROUTE-005 | Open `/login?mode=register` | Register tab/mode is active |  |  |
| ROUTE-006 | Click landing `Masuk` CTA | Navigates to login |  |  |
| ROUTE-007 | Click landing `Daftar` CTA | Navigates to register |  |  |
| ROUTE-008 | Logged-out user opening app route | Does not expose private app data |  |  |
| ROUTE-009 | Logged-in user session persists safely | User sees own app data only |  |  |

---

## 5. Mobile Core Flow QA

Recommended device: Android Chrome first.

| ID | Check | Expected Result | Status | Notes / Evidence |
|---|---|---|---|---|
| MOB-001 | Register new account | Account created or clear confirmation/error shown |  |  |
| MOB-002 | Login existing account | User enters app |  |  |
| MOB-003 | Logout | Session ends, returns to auth/public flow |  |  |
| MOB-004 | Add menu/product | Product appears in menu list |  |  |
| MOB-005 | Edit menu/product | Updated value appears |  |  |
| MOB-006 | Delete menu/product | Product removed/deactivated from active list |  |  |
| MOB-007 | Add product with stock | Stock value visible where expected |  |  |
| MOB-008 | Search product in cashier | Search filters product list |  |  |
| MOB-009 | Filter product category | Category filter works |  |  |
| MOB-010 | Add product to cart | Cart updates quantity/total |  |  |
| MOB-011 | Change cart quantity | Quantity and total update |  |  |
| MOB-012 | Checkout with insufficient payment | Clear error/prevention appears |  |  |
| MOB-013 | Checkout with enough payment | Transaction saved |  |  |
| MOB-014 | Payment change calculation | Kembalian is correct |  |  |
| MOB-015 | Stock after checkout | Stock decreases correctly |  |  |
| MOB-016 | Transaction history | New transaction appears |  |  |
| MOB-017 | Add expense | Expense appears in expense list |  |  |
| MOB-018 | Dashboard metrics update | Pendapatan/transaksi/pengeluaran/laba update |  |  |
| MOB-019 | Receipt PNG/share | Receipt can be generated/shared or downloaded/fallback works |  |  |
| MOB-020 | Mobile bottom nav | Bottom nav remains usable and not overlapped |  |  |
| MOB-021 | Empty/error states | Language is clear and UMKM-friendly |  |  |

---

## 6. Desktop QA

Recommended device: Desktop Chrome.

| ID | Check | Expected Result | Status | Notes / Evidence |
|---|---|---|---|---|
| DESK-001 | Public landing readability | Landing explains product clearly |  |  |
| DESK-002 | Login/register from desktop | Auth entry works |  |  |
| DESK-003 | Desktop sidebar | Sidebar navigation works |  |  |
| DESK-004 | Desktop dashboard page | Desktop dashboard loads for logged-in user |  |  |
| DESK-005 | Period filter | Hari ini/Minggu ini/Bulan ini/Semua update report |  |  |
| DESK-006 | Summary metrics | Pendapatan/transaksi/pengeluaran/laba shown |  |  |
| DESK-007 | Menu terlaris | Top product list appears when data exists |  |  |
| DESK-008 | Recent transaction summary | Recent orders table/list appears |  |  |
| DESK-009 | Coming Soon nav/cards | Future modules are clearly non-active |  |  |
| DESK-010 | Desktop layout at common width | Layout readable at laptop size |  |  |

---

## 7. Export QA

Use test data with at least:

- 3 products.
- 2 transactions.
- 1 expense.
- At least 2 periods where possible.

| ID | Check | Expected Result | Status | Notes / Evidence |
|---|---|---|---|---|
| EXP-001 | Transaction CSV export | CSV downloads and opens |  |  |
| EXP-002 | CSV content | Date/items/total are correct |  |  |
| EXP-003 | Report Excel export | `.xlsx` downloads and opens |  |  |
| EXP-004 | Excel summary | Summary metrics match dashboard |  |  |
| EXP-005 | Excel detail sheets/rows | Useful supporting detail exists |  |  |
| EXP-006 | Report PDF export | PDF downloads and opens |  |  |
| EXP-007 | PDF header | Store/Warungin header visible |  |  |
| EXP-008 | PDF period/timestamp | Period and export timestamp visible |  |  |
| EXP-009 | PDF summary metrics | Metrics match dashboard |  |  |
| EXP-010 | PDF top products/table | Supporting table readable |  |  |
| EXP-011 | Export period respect | Export follows selected period |  |  |
| EXP-012 | Export performance | App does not freeze indefinitely for typical data |  |  |

---

## 8. Supabase / RLS QA

Use User A and User B.

| ID | Check | Expected Result | Status | Notes / Evidence |
|---|---|---|---|---|
| RLS-001 | User A creates product/order/expense | User A data is saved |  |  |
| RLS-002 | Logout User A, login User B | User B does not see User A data |  |  |
| RLS-003 | User B creates own data | User B data is saved separately |  |  |
| RLS-004 | Logout User B, login User A | User A sees User A data only |  |  |
| RLS-005 | Browser refresh after account switch | No stale previous-user data appears |  |  |
| RLS-006 | Supabase table review if available | Rows are user/store scoped as expected |  |  |
| RLS-007 | Unauthorized store/RPC access if testable | Cross-user request is rejected |  |  |

If any cross-user leakage appears, stop preview and mark as blocker.

---

## 9. Offline / Online QA

Important: Alignment Review found full offline-sync is not fully proven end-to-end. This section determines what can be safely claimed.

| ID | Check | Expected Result | Status | Notes / Evidence |
|---|---|---|---|---|
| OFF-001 | Load app online first | App loads data |  |  |
| OFF-002 | Turn off network | App does not immediately crash |  |  |
| OFF-003 | View already loaded data offline | Existing/local data remains visible if supported |  |  |
| OFF-004 | Create transaction offline | Behavior is clear: saved locally, blocked, or error shown |  |  |
| OFF-005 | Create expense offline | Behavior is clear: saved locally, blocked, or error shown |  |  |
| OFF-006 | Update product/stock offline | Behavior is clear: saved locally, blocked, or error shown |  |  |
| OFF-007 | Pending/sync/error state | User can understand current state |  |  |
| OFF-008 | Restore network | App recovers without data corruption |  |  |
| OFF-009 | Confirm cloud data after restore | Synced data appears, or limitation is documented |  |  |
| OFF-010 | Conflict scenario if possible | Conflict is visible/understandable, or not supported yet |  |  |

Preview claim decision:

| Claim | Allowed? | Notes |
|---|---|---|
| Basic app usable online |  |  |
| Previously loaded data viewable offline |  |  |
| Offline transaction creation |  |  |
| Offline expense creation |  |  |
| Automatic sync after online |  |  |
| Stock conflict handling |  |  |

---

## 10. Responsive / Device Matrix

| Device / Browser | Routes | Mobile Flow | Receipt Share | Export | Notes |
|---|---|---|---|---|---|
| Android Chrome |  |  |  |  |  |
| Desktop Chrome |  |  |  |  |  |
| iPhone Safari optional |  |  |  |  |  |
| Desktop Safari optional |  |  |  |  |  |

---

## 11. Issue Log

Use this for every issue found during preview.

| ID | Area | Severity | Description | Steps to Reproduce | Expected | Actual | Screenshot/Link | Decision |
|---|---|---|---|---|---|---|---|---|
| ISSUE-001 |  | blocker/high/medium/low |  |  |  |  |  | fix now / backlog / acceptable |

Severity guide:

- `blocker` — preview must stop.
- `high` — preview should not expand until fixed.
- `medium` — acceptable for controlled preview if documented.
- `low` — cosmetic/minor follow-up.

---

## 12. Preview Go / No-Go Decision

Fill after checklist execution.

| Area | Status | Notes |
|---|---|---|
| Deployment routes |  |  |
| Mobile core flow |  |  |
| Desktop flow |  |  |
| Export |  |  |
| Receipt PNG/share |  |  |
| RLS isolation |  |  |
| Offline/online |  |  |
| Responsive/device |  |  |
| Known limitations accepted |  |  |

Final decision:

- [ ] GO — controlled internal preview can proceed.
- [ ] GO WITH LIMITATIONS — preview can proceed with explicit wording and issue list.
- [ ] NO-GO — blockers must be fixed before preview.

Decision notes:

```text

```

---

## 13. Required Next Step After Checklist

If checklist result is `GO` or `GO WITH LIMITATIONS`:

1. Confirm preview wording.
2. Share deployed preview only with intended internal testers.
3. Collect issue log.
4. Decide mini hardening PRs if needed.

If checklist result is `NO-GO`:

1. Convert blockers into a mini hardening implementation plan.
2. Fix only approved blockers.
3. Re-run this checklist.

Release prep remains separate and should only start after preview/trial validation.
