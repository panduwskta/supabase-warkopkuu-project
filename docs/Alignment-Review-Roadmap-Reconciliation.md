# Alignment Review / Roadmap Reconciliation — Warungin v2

## Gate

This document is a post-Sprint-13 reconciliation gate before preview/trial from `develop`.

It is documentation/audit only:

- No feature implementation.
- No bug fixing.
- No Supabase migration apply.
- No release prep.
- No merge to `main`.

## Source of Truth

Reviewed against:

- `docs/PRD-Warungin-v2.md`
- `docs/SRS-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- Sprint notes 0, 3, 5, 6, 7, 8, 8.5, 9, 9.5, 10, 11, 12, 13
- Current `develop` after Sprint 13 merge commit `c674a5d`

## Executive Summary

Warungin v2 has completed the planned Sprint 0–13 roadmap through `develop`, including mobile POS improvements, receipt PNG sharing, reports/export, desktop minimal, and Sprint 13 hardening/typecheck.

However, reconciliation found an important distinction:

- The visible app in `src/app/App.tsx` is usable as a basic Warungin POS/dashboard MVP path.
- Several v2 architecture modules exist as foundations under `src/features/*` and `src/lib/db/*`.
- The full local-first Dexie/offline-sync architecture is not fully wired end-to-end into the visible app flow.

Therefore the recommended readiness status is:

> **Ready for controlled internal preview with limitations. Not ready for external release or production claims until real-device/manual QA and offline-sync/RLS validation are completed.**

## Current Verification Baseline

Run on current branch during this reconciliation:

- `npm run build` — passed.
- `npm run lint` — passed.
- `npx tsc --noEmit` — passed.
- `npm audit --omit=dev` — passed with 0 vulnerabilities.

Known note:

- Vite still reports a large chunk warning due to client-side export/receipt libraries. Build succeeds, so this is not a blocker for controlled preview.

## Sprint 0–13 Completion Table

| Sprint | Planned Objective | Evidence | Reconciliation Status |
|---|---|---|---|
| Sprint 0 — Technical Reference | Establish technical reference, release workflow, library direction | `docs/Sprint-0-Technical-Reference-Warungin-v2.md`, base commit `51ac2f2` | Fulfilled |
| Sprint 1 — TypeScript Baseline & App Structure | Establish TypeScript/Vite baseline | PR #1 merge `9ec9d70`, source structure present | Fulfilled; detailed sprint note not present |
| Sprint 2 — Tailwind/shadcn Foundation | UI foundation | PR #2 merge `f8fe676`, UI component/style files present | Fulfilled; detailed sprint note not present |
| Sprint 3 — Supabase v2 Schema Draft | Draft v2 schema/RLS, repo-only | `docs/Sprint-3-Supabase-v2-Schema-Notes.md`, `supabase/migrations/002_warungin_v2_schema.sql` | Fulfilled as draft; not applied live |
| Sprint 4 — Local DB Foundation | Dexie/local DB foundation | PR #4 merge `8f18f58`, `src/lib/db/*` present | Fulfilled as foundation; detailed sprint note not present |
| Sprint 5 — Onboarding Sample Data | Local sample data foundation | `docs/Sprint-5-Onboarding-Sample-Data-Notes.md`, onboarding modules present | Foundation fulfilled; visible UI wiring remains limited |
| Sprint 6 — Product/Menu + HPP | Product/category/HPP local foundation | `docs/Sprint-6-Product-Menu-HPP-Notes.md`, product modules present | Foundation fulfilled; visible UI uses simpler `App.tsx` flow |
| Sprint 7 — Cashier Checkout Local | Local checkout foundation | `docs/Sprint-7-Cashier-Checkout-Local-Notes.md`, cashier modules present | Foundation fulfilled; visible UI uses simpler checkout flow |
| Sprint 8 — Sync Queue MVP | Sync queue foundation | `docs/Sprint-8-Sync-Queue-MVP-Notes.md`, sync queue module present | Foundation fulfilled; not fully end-to-end visible UI sync |
| Sprint 8.5 — Sync Alignment/RPC Contract Prep | Correct sync/RPC direction | `docs/Sprint-8.5-Sync-Alignment-RPC-Contract-Prep.md` | Fulfilled as documentation/alignment |
| Sprint 9 — Checkout RPC + Stock Safety | Repo RPC migration draft | `docs/Sprint-9-Checkout-RPC-Stock-Safety-Notes.md`, `supabase/migrations/003_checkout_rpc_stock_safety.sql` | Fulfilled as draft; not applied live |
| Sprint 9.5 — Checkout RPC Queue Caller | Client RPC caller foundation | `docs/Sprint-9.5-Checkout-RPC-Queue-Caller-Notes.md`, `src/features/cashier/sync-checkout.ts` | Foundation fulfilled; not auto background sync |
| Sprint 10 — Receipt PNG + Share | Receipt PNG generation/share | `docs/Sprint-10-Receipt-PNG-Share-Notes.md`, receipt modules, UI wiring in `App.tsx` | Implemented |
| Sprint 11 — Dashboard + Reports Export | Metrics and CSV/Excel/PDF export | `docs/Sprint-11-Dashboard-Reports-Export-Notes.md`, export helpers in `App.tsx` | Implemented |
| Sprint 12 — Desktop Dashboard Minimal | Landing, desktop login, dashboard/export, Coming Soon nav | `docs/Sprint-12-Desktop-Dashboard-Minimal-Notes.md`, `src/features/desktop/*`, `vercel.json` | Implemented after revision to separate `/` and `/login` |
| Sprint 13 — Hardening & QA | Stabilize MVP before release | `docs/Sprint-13-Hardening-QA-Notes.md`, typecheck fixes, PR #15 | Implemented; manual QA limitations remain |

## PRD Scope Reconciliation

| PRD MVP Area | Current Alignment | Status |
|---|---|---|
| Rebrand & Product Identity | Primary UI copy is largely Warungin; receipt prefix uses `WRG` in visible flow | Mostly aligned; final metadata/README/release polish still pending |
| Cloud-First Offline-Capable Data | Supabase cloud path and local fallback exist in visible app; Dexie/offline/sync foundations exist separately | Partial; full local-first offline-sync is not fully wired end-to-end |
| Onboarding & Demo Data | Onboarding/sample modules exist | Partial; visible post-auth onboarding UX should be manually confirmed before trial |
| Account & Store | Login/register preserved; single-user account/store direction preserved | Mostly aligned; live RLS/user isolation requires Supabase validation |
| Product/Menu & Stock | Visible app supports menu CRUD and stock; foundation modules support product/HPP | Mostly aligned; HPP in visible flow needs manual confirmation if expected as UI field |
| Cashier/POS | Visible app supports search/filter/cart/checkout/payment/change/stock decrement | Mostly aligned; payment method selection beyond cash-style payment amount is limited |
| Transaction History | Visible app supports recent/history and CSV export | Mostly aligned; transaction detail depth should be manually reviewed |
| Expenses | Visible app supports expense entry/list/delete and dashboard inclusion | Aligned for MVP basic scope |
| Dashboard Mobile | Dashboard metrics, period filters, top products, low stock, recent orders exist | Aligned for basic reporting |
| Receipt PNG & Sharing | Receipt PNG/share helper wired to order actions | Aligned; native share behavior needs device/browser QA |
| Export & Reporting | CSV/Excel/PDF export implemented using `write-excel-file`, `jspdf`, `jspdf-autotable` | Aligned; export quality should be manually reviewed with real data |
| Desktop Dashboard Minimal | `/` landing, `/login`, desktop dashboard/export, Coming Soon nav | Aligned for minimal scope |
| Play Store Readiness Foundation | Mobile-first UI exists; Capacitor/Play Store are explicitly later | Deferred as planned |

## SRS Requirement Matrix

| Requirement Area | Status | Notes |
|---|---|---|
| FR-AUTH — Registration/Login/Logout/Single-user | Implemented / needs live QA | Visible auth flow exists with Supabase or local fallback |
| FR-ONB — Onboarding & Demo Data | Partially implemented | Modules exist; visible UX requires manual validation |
| FR-PROD — Product/Menu/HPP/Stock | Partially to mostly implemented | Visible menu/stock CRUD exists; HPP-specific UI alignment should be checked |
| FR-POS — Cashier/Checkout/Payment/Change | Mostly implemented | Visible checkout/payment/change flow exists; payment method selection is limited |
| FR-TX — Transaction History/Export/Protection | Mostly implemented | History and CSV export exist; transaction detail/protection depth should be reviewed |
| FR-EXP — Expenses | Implemented basic scope | Expense creation/list/delete exists |
| FR-DASH — Dashboard/Period Filter | Implemented | Metrics, period filter, top products, low stock, recent orders exist |
| FR-REP — Excel/PDF Export | Implemented | Excel/PDF helpers exist; manual file review still needed |
| FR-RCP — Receipt PNG/Share/Retention | Mostly implemented | PNG/share wired; retention metadata exists in foundation modules; device behavior needs QA |
| FR-OFF/SYNC — Offline and Sync | Partial / key gap | Foundations exist, but visible app is not fully wired to local-first sync queue end-to-end |
| FR-DESK — Landing/Login/Desktop Reports/Coming Soon | Implemented | `/`, `/login`, dashboard/export, Coming Soon nav present |
| NFR-PERF — Responsive UX/Search/Export | Needs manual QA | Static checks pass; real-device performance not fully validated |
| NFR-REL — Offline Continuity/Sync Recovery/Checkout Consistency | Partial / key gap | Requires real offline-sync testing and possibly additional wiring |
| NFR-SEC — Auth/RLS/No Secret Exposure | Partially validated | No secrets found in repo audit; migrations include RLS; live two-user RLS test not executed |
| NFR-PRI — Privacy/Receipt Locality | Mostly aligned | Receipt PNG is local-only in MVP direction |
| NFR-USE — Simple Language/Coming Soon Clarity | Mostly aligned | Indonesian UMKM-friendly labels used; Coming Soon states present |
| NFR-MAIN — TypeScript/Modular/Stack Discipline | Improved | Build/lint/typecheck pass; modules exist; `App.tsx` remains large |
| NFR-PORT — PWA/Capacitor Readiness | Deferred | Play Store/Capacitor intentionally later |

## TRD Architecture Reconciliation

### Aligned

- Vite/React/TypeScript stack remains intact.
- Supabase client uses public anon/publishable env vars only.
- RLS migration drafts follow owner/store scoping patterns.
- Checkout RPC draft validates authenticated user and store ownership before writes.
- Receipt PNG remains local-only; no Supabase Storage upload added.
- Export libraries follow current safe decision: `write-excel-file`, `jspdf`, `jspdf-autotable`.
- Desktop dashboard follows Option B: public landing + simple auth entry + basic reporting dashboard.
- Play Store/Capacitor work remains deferred.

### Partially Aligned / Needs Follow-up

- TRD local-first Dexie/offline architecture exists as foundation modules, but current visible app flow still centers on `src/app/App.tsx` with direct Supabase/localStorage behavior.
- Sync queue/RPC caller exists, but full automatic background sync and conflict UI are not fully proven in the visible app.
- RLS is documented in migrations, but live Supabase two-user validation has not been executed.
- `App.tsx` remains large and central. This is acceptable for current MVP review but should be refactored after preview stabilization, not before unless bugs require it.

## Out-of-Scope Confirmation

The following remain correctly out of scope for MVP v2 unless separately approved:

- Open Bill.
- Multi-user owner/staff permissions.
- Barcode scanning.
- Supplier management.
- Advanced stock in/out.
- Weighted average HPP.
- Bluetooth print.
- Payment gateway.
- Subscription/paywall.
- Native Android rebuild.
- Full desktop managerial CRUD.
- AI features.
- Complex warehouse/marketplace inventory.

## Risk / Gap Register

| Item | Severity | Classification | Detail | Recommended Action |
|---|---:|---|---|---|
| Full offline-sync not wired end-to-end in visible app | High | Preview limitation / possible blocker for offline claim | Foundation modules exist, but visible UI does not clearly run full Dexie sync queue lifecycle | Do not claim full offline-sync in preview. Run dedicated offline-sync wiring/QA mini-sprint if this is required before user trial |
| Live Supabase RLS not validated with two users | High | Pre-trial validation needed | Migrations look correct, but live validation was not executed | Before external trial, test User A/User B read/write isolation |
| Supabase v2 migrations are repo drafts, not applied | High | Operational blocker if preview depends on v2 schema | Notes explicitly say not applied to production | Decide preview data model: current legacy tables vs applying v2 migrations with approval |
| Desktop/public routes implemented as SPA client routing | Medium | Acceptable limitation | `vercel.json` handles Vercel direct routes | Validate deployed `/` and `/login` after Vercel deploy |
| Receipt native share browser/device behavior | Medium | Needs manual QA | Build passes; actual share support varies by device/browser | Test Android browser/PWA and desktop fallback |
| Export quality with real data volume | Medium | Needs manual QA | Build passes; PDF/Excel generation exists | Test with realistic orders/expenses/menu data |
| `App.tsx` remains large | Medium | Technical debt | Centralized logic makes changes riskier | Refactor only after preview or if bugs require it |
| HPP/payment method depth in visible UI | Medium | Requirement nuance | HPP foundation exists; visible UI should be reviewed against expected user flow | Manual QA checklist before trial |
| Vite chunk warning | Low | Known non-blocking | Large chunk from export/receipt libraries | Accept for preview; consider dynamic imports later |

## Preview / Trial Readiness Recommendation

### Recommendation

**Ready for controlled internal preview with limitations.**

### Not Recommended Yet

Do not present this as fully production-ready or fully offline-sync complete until:

1. Real browser/device QA is completed.
2. Supabase two-user RLS validation is completed.
3. Offline/online sync behavior is either validated end-to-end or explicitly scoped down in preview messaging.
4. Vercel deployed `/` and `/login` routes are checked.
5. Export and receipt sharing are tested with realistic data.

### Suggested Preview Framing

Safe framing:

- “Warungin v2 internal preview for basic POS, menu, transaction, expense, report/export, receipt PNG, and desktop minimal dashboard.”

Avoid claiming until validated:

- “Fully offline-sync ready.”
- “Production-ready stock conflict handling.”
- “RLS fully validated in live environment.”
- “Ready for public release.”

## Recommended Next Steps

1. Review this reconciliation doc.
2. Decide whether preview can proceed with limitations or whether an additional mini hardening sprint is needed first.
3. If proceeding to preview:
   - Deploy/check `develop` preview.
   - Run real-device QA checklist.
   - Run Supabase two-user RLS validation.
   - Run offline/online test if offline capability will be advertised.
4. After preview/trial validation, proceed to release prep:
   - README update.
   - CHANGELOG update.
   - version update if needed.
   - final merge/release workflow to `main` only after approval.

## Final Status

- Roadmap Sprints 0–13: completed/merged to `develop`.
- Static verification: passed.
- Documentation reconciliation: completed in this file.
- Release readiness: not yet.
- Controlled internal preview readiness: yes, with explicit limitations.
