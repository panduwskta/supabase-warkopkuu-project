# PRD — Warungin v2

**Status:** Draft v0.5 — English-first baseline  
**Product:** Warungin  
**Product Label:** Warungin POS  
**Previous Baseline:** WarkopKuu v1  
**Reference Benchmark:** KasirGratisan (`panduwskta/kasirgratisan`)  
**Owner:** Pandu W Aji / Takis Agency  
**Tagline:** Kelola warung dari genggaman.  
**Play Store Title Candidate:** Warungin: Kasir Warung UMKM

---

## 1. Product Overview

Warungin v2 is a major product update from WarkopKuu v1 into a more serious, product-ready POS and small-business operations app for Indonesian warung, kedai, warkop, food stalls, and micro/small businesses.

Warungin v2 must preserve the simplicity of v1 while improving the product foundation: brand identity, cashier flow, operational records, reporting, offline-capable usage, and future readiness for desktop dashboard and Android Play Store distribution.

Warungin should not copy KasirGratisan directly. KasirGratisan is used as a benchmark for a complete offline-first POS. Warungin’s direction is different: **cloud-first, offline-capable, mobile-first**, and designed for users who need operational simplicity with cloud sync across devices.

Cloud-first means Supabase/cloud remains the primary source of truth for logged-in users. Offline-capable means daily operations must not stop when the internet is unstable or unavailable; previously loaded data and new local input should remain usable locally, then sync back to cloud once connectivity returns.

---

## 2. Background

### 2.1 WarkopKuu v1 Baseline

WarkopKuu v1 already includes:

- Login/register.
- Per-account cloud data.
- Dashboard for sales, transactions, expenses, and profit.
- Cashier/POS flow.
- Menu/product and stock management.
- Automatic stock deduction after checkout.
- Order/transaction history.
- CSV/Excel export.
- Expense recording.
- Mobile-first bottom navigation.
- Quick add menu bottom sheet.
- Received payment and change calculation.
- Transaction/receipt number.
- WhatsApp receipt sharing.
- Order filters.
- Category chips.
- Best-selling menu badge.
- Subtle credit: “Built by Takis Agency · Crafted by Pandu W Aji”.

### 2.2 Why v2 Exists

The transition from WarkopKuu to Warungin is not a superficial rename. v1 still carries WarkopKuu naming, receipt prefix, product tone, and UI copy. v2 is required to:

- Establish a broader product identity beyond warkop only.
- Improve cashier and stock management UX.
- Align features with real UMKM operational needs.
- Prepare a scalable technical and product foundation.
- Move the app from “demo-like” into “product-ready”.

---

## 3. Problem Statement

Small warung/kedai owners often record sales, stock, and expenses manually using notebooks, WhatsApp, or spreadsheets. This creates problems:

- Daily sales are hard to monitor in real time.
- Stock data is often inaccurate.
- Profit is difficult to estimate because expenses and product costs are not structured.
- Transaction history is difficult to search.
- Many POS apps feel too complex or too expensive for small businesses.
- Internet instability can disrupt cloud-only tools.

Warungin v2 must help small business owners run daily operations quickly and confidently without requiring accounting knowledge.

---

## 4. Target Users

### 4.1 Primary User — Business Owner

Small warung/kedai/warkop/food-stall owner.

Characteristics:

- Runs the business alone or with family/small staff.
- Needs daily transaction records.
- Wants to know sales, expenses, profit, and stock.
- Uses a phone more often than a laptop.
- Needs a simple Indonesian-language app.

### 4.2 Secondary User — Cashier/Staff

Not part of MVP role management, but relevant for future versions.

Characteristics:

- Focuses on fast transaction input.
- Does not need access to all reports/settings.
- Needs a clean cashier UI with minimal distractions.

### 4.3 Future User — Growing UMKM Owner

Owner with more complex operations or multiple users/outlets.

Future considerations:

- Owner/staff role separation.
- Permissions.
- Multi-outlet support.
- More advanced dashboard and reporting.

---

## 5. Value Proposition

Warungin helps small business owners record orders, monitor stock, track expenses, estimate profit, and view daily reports from one simple app.

### 5.1 Naming Decision

The final product name for v2 is **Warungin**.

Although Indonesian digital products commonly use the “-in” suffix, Warungin is still selected because it feels natural for the warung/kedai category, is easy to remember, and fits the target market.

To avoid a generic/template perception, Warungin must be differentiated through:

- More mature positioning as a cashier and business management app, not just a note-taking app.
- Clean, product-ready visual identity.
- Simple but mature copywriting; avoid excessive “-in” wordplay.
- Clear marketplace/product label: **Warungin POS**.
- Play Store title candidate: **Warungin: Kasir Warung UMKM**.

### 5.2 Positioning Statement

**Warungin is a mobile-first cashier and warung management app for Indonesian UMKM owners who want cleaner daily operations without complicated systems.**

### 5.3 Tagline

**Kelola warung dari genggaman.**

### 5.4 Supporting Copy

Catat pesanan, pantau stok, hitung pengeluaran, dan lihat laporan harian dalam satu aplikasi sederhana untuk warung, kedai, dan usaha kecil Indonesia.

---

## 6. Product Goals

### 6.1 Product Goals

1. Rebrand WarkopKuu into Warungin consistently.
2. Make cashier flow faster, clearer, and ready for daily use.
3. Strengthen menu, stock, transaction, expense, and reporting workflows.
4. Provide meaningful owner-facing dashboards and exports.
5. Support cloud-first data with offline-capable daily operations.
6. Prepare the foundation for desktop dashboard and Android Play Store release.

### 6.2 Business Goals

1. Make Warungin credible as a product that can be promoted publicly.
2. Strengthen Takis Agency’s credibility as a builder of UMKM digital products.
3. Prepare the foundation for future freemium/premium opportunities.
4. Make the live demo/app more convincing for users or clients.

### 6.3 UX Goals

1. Comfortable mobile-first usage.
2. Core transaction flow completed in a few taps.
3. Simple, non-accounting-heavy language.
4. Clear empty, error, loading, offline, and sync states.
5. User should not feel afraid to try or make mistakes.

---

## 7. Non-Goals for MVP v2

The following are out of scope for MVP v2 unless explicitly approved later:

- Full multi-outlet support.
- Real payment gateway integration.
- Full accounting system.
- Payroll/employee management.
- Complex warehouse/marketplace inventory.
- Native iOS app.
- Native Android rebuild from scratch.
- Open Bill.
- Multi-user owner/staff roles.
- Barcode scanning.
- Supplier management.
- Advanced stock in/out and weighted average HPP.
- Bluetooth printer integration.
- AI features.
- Subscription/paywall.
- Full desktop managerial CRUD.

---

## 8. MVP v2 Scope

### 8.1 Must-Have Features

#### A. Rebrand & Product Identity

- Rename WarkopKuu to Warungin across primary UI.
- Update title, metadata, receipt copy, empty states, and onboarding copy.
- Default receipt prefix: `WRG`.
- Optional future setting to customize receipt prefix with the same format.
- Visual direction: green primary + warm amber accent.
- Tone: friendly, simple, and product-ready.

#### B. Cloud-First Offline-Capable Data

- Supabase remains cloud source of truth for logged-in users.
- Previously loaded data remains available locally.
- Core local inputs still work when offline/unstable: transactions, expenses, product/stock basics.
- UI updates immediately from local DB.
- App shows sync status: local, pending, syncing, synced, failed, conflict.
- Local changes sync automatically once online.
- Stock/checkout conflicts must be surfaced clearly.

#### C. Onboarding & Demo Data

- User can choose business type: warung, warkop, food stall, small shop, or other.
- User can choose theme/preference.
- User can explore anonymously with sample data.
- Logged-in users can also start with sample data.
- Sample data can be reset.

#### D. Account & Store

- Login/register must be preserved.
- Data is isolated per account/store.
- MVP is single-user.
- Store name and basic profile are supported.

#### E. Product/Menu & Stock

- CRUD for product/menu items.
- Basic categories.
- Selling price.
- Stock.
- HPP/modal field exists from v2.
- HPP can default to 0/empty-friendly so it does not block trial/onboarding.
- Soft delete/deactivate products so transaction history remains safe.
- Low stock status.

#### F. Cashier/POS

- Product list with search and category filter.
- Cart with quantity adjustment.
- Checkout.
- Payment amount input.
- Change calculation.
- Basic payment method selection: Cash, QRIS, Transfer, E-wallet.
- Receipt number.
- Local stock deduction after checkout.
- Cloud checkout sync using RPC/server-side transaction for transaction + stock safety.

#### G. Transaction History

- Recent transaction list.
- Transaction detail.
- Basic filter by date/search.
- Re-share/regenerate receipt.
- CSV/Excel export.

#### H. Expenses

- Record expenses.
- Expense category/name.
- Amount.
- Date.
- Optional notes.
- Included in dashboard profit estimation.

#### I. Dashboard Mobile

Dashboard must show:

- Total sales today.
- Transaction count today.
- Total expenses today.
- Estimated profit today.
- Top products/menu.
- Low stock.
- Recent transactions.
- Shortcuts to Cashier, Products, Expenses, History/Reports.

#### J. Receipt PNG & Sharing

- Generate visual receipt as PNG.
- Share PNG to WhatsApp or other apps when supported.
- Include WhatsApp/share text as short description or fallback.
- Receipt PNG is local-only in MVP.
- Receipt PNG auto-deletes after successful share when enabled/possible or after 14 days by default.
- Receipt can be regenerated from transaction detail.

#### K. Export & Reporting

- Export transaction data to CSV/Excel.
- Export dashboard/report view to report-ready PDF.
- PDF must include: brand/store header, report period, export timestamp, summary metrics, chart/visual snapshot if available, supporting tables, and footer/branding.

#### L. Desktop Dashboard Minimal

Warungin v2 includes a minimal desktop dashboard:

- Public landing page.
- Desktop login with same account.
- Basic report dashboard.
- Excel export.
- PDF report-ready export.
- Future managerial navigation can appear as **Coming Soon**.
- Full desktop management is deferred until after mobile app stability.

#### M. Play Store Readiness Foundation

- UI remains mobile-first and Android-app-friendly.
- Prepare product name, icon direction, brand color, and app descriptions.
- Privacy Policy and Data Safety must be prepared before submission.
- Android permissions should remain minimal.
- Recommended future wrapper: Capacitor after web/PWA is stable.

### 8.2 Should-Have Features

- Period filters for reports.
- Basic sync/storage status in settings.
- Better empty states and onboarding guidance.
- Backup/export JSON for trust/future recovery.
- Payment method details.

### 8.3 Future Candidates

- Open Bill.
- Multi-user owner/staff.
- Barcode scanning.
- Product photo.
- Supplier management.
- Stock in/out.
- Weighted average HPP.
- Bluetooth print.
- Advanced desktop managerial dashboard.

---

## 9. Benchmark Insight: KasirGratisan

KasirGratisan is useful as a benchmark for:

- Offline-first POS behavior.
- Open Bill.
- Multi-user mode.
- Barcode scanner.
- Product SKU/unit/photo/barcode.
- Stock in/out.
- HPP weighted average.
- Supplier management.
- Backup/restore.
- PWA behavior.
- Receipt print/share/download.
- Dark mode/theme customization.

Warungin should adapt only what supports its MVP direction. Warungin’s positioning remains simpler: **cloud-first, offline-capable, mobile-first**, and more approachable for small operators.

---

## 10. Key User Flows

### 10.1 First-Time User

1. User opens Warungin.
2. User selects business type.
3. User selects theme/preference.
4. User chooses login/register or anonymous exploration.
5. App seeds sample data if selected.
6. User lands on dashboard/cashier.

### 10.2 Fast Transaction Flow

1. User opens Cashier.
2. User selects/searches products.
3. User adjusts cart quantity.
4. User proceeds to checkout.
5. User selects payment method.
6. User inputs received payment if cash.
7. System calculates change.
8. Transaction is saved locally.
9. Stock is deducted locally.
10. Receipt PNG is generated.
11. Transaction syncs to cloud when online.
12. Receipt can be shared to WhatsApp/other apps.

### 10.3 Offline/Unstable Internet Flow

1. User opens app while offline/unstable.
2. Previously loaded local data remains available.
3. User creates transaction/expense/product update.
4. App updates local UI immediately.
5. App shows pending sync status.
6. App syncs changes when connection returns.
7. App shows synced/failed/conflict status.

### 10.4 Desktop Dashboard Minimal Flow

1. User opens Warungin landing page.
2. User logs in to desktop dashboard.
3. Dashboard loads cloud report data.
4. User reviews basic report metrics.
5. User exports Excel/PDF.
6. Future modules appear as Coming Soon.

---

## 11. Data Requirements Summary

Core entities:

- User/Profile.
- Store.
- Category.
- Product/Menu.
- Payment Method.
- Transaction.
- Transaction Item.
- Expense Category.
- Expense.
- Receipt Asset.
- Sync Queue.
- Sync State.
- Onboarding/Demo State.

Important decisions:

- Store-based ownership for future readiness.
- HPP/modal required in data model but default 0/empty-friendly.
- Product and transaction item snapshots preserve historical records.
- Receipt PNG is local-only and temporary.
- Old WarkopKuu cloud data remains legacy; no auto-migration in MVP.

---

## 12. Product Decisions — Locked v0.5

1. Product name: **Warungin**.
2. Product label: **Warungin POS**.
3. Default receipt prefix: `WRG`.
4. Cloud-first, offline-capable architecture.
5. MVP starts single-user.
6. Open Bill is not MVP.
7. HPP/modal is required in data model but does not block onboarding/trial.
8. Receipt output must be PNG + share text fallback.
9. Receipt PNG is local-only, temporary, and regeneratable.
10. Desktop dashboard minimal is in scope for v2.
11. Excel and report-ready PDF export are in scope.
12. Hybrid sync strategy: direct operations for simple entities, RPC/server-side transaction for checkout + stock.
13. Play Store submission happens after product stability.
14. Recommended Android approach: Capacitor after web/PWA is stable.

---

## 13. Success Metrics

### 13.1 Product Metrics

- User can complete first transaction within 5 minutes after onboarding/register.
- User can add first product without help.
- User can understand sales, expenses, and profit from dashboard.
- User can generate/share receipt PNG.
- User can export report-ready PDF.

### 13.2 Technical Metrics

- Production build passes.
- Lint/typecheck passes or blockers are documented.
- RLS prevents cross-user access.
- Core offline input works.
- Pending sync completes when online.
- Checkout cloud sync avoids partial transaction/stock state.

### 13.3 UX Metrics

- Checkout flow remains simple: select products → cart → payment → receipt.
- Empty states guide user to next action.
- Offline/sync state is understandable.
- Desktop Coming Soon modules are clearly marked.

---

## 14. Release Plan Candidate

### Phase 1 — Foundation/Rebrand

- Warungin naming and copy.
- Visual identity.
- App metadata.
- Receipt prefix `WRG`.

### Phase 2 — Technical Foundation

- TypeScript baseline.
- Tailwind/shadcn foundation.
- App structure.
- Supabase v2 schema.
- Local DB foundation.

### Phase 3 — Core Mobile Operations

- Onboarding sample data.
- Product/menu/HPP.
- Cashier checkout.
- Transaction history.
- Expenses.
- Dashboard.

### Phase 4 — Offline Sync & Stock Safety

- Sync queue.
- Pull/push sync.
- Sync status.
- Checkout RPC + stock safety.
- Conflict handling basic.

### Phase 5 — Receipt & Reporting

- Receipt PNG.
- Share flow.
- CSV/Excel export.
- PDF report-ready export.

### Phase 6 — Desktop Minimal

- Landing page.
- Desktop login.
- Basic reporting dashboard.
- Excel/PDF export.
- Coming Soon navigation.

### Phase 7 — Hardening

- Build/lint/typecheck.
- Mobile QA.
- Offline/online QA.
- RLS verification.
- Export QA.

### Phase 8 — Play Store Preparation Later

- PWA polish.
- Capacitor wrapper.
- Internal testing.
- Privacy Policy/Data Safety.

---

## 15. Open Product Items

To be resolved during Sprint 0 / technical reference step:

1. Final Excel export library.
2. Final PDF export implementation approach.
3. Final chart/visual library decision if PDF needs chart snapshots.
4. Exact desktop dashboard route/layout split.
5. Exact receipt PNG cleanup behavior across browser and future Capacitor.

---

## 16. PRD Acceptance Criteria

This PRD is ready to drive SRS/TRD/sprint planning when:

- MVP scope is accepted.
- Product decisions are locked.
- Must-have vs future scope is clear.
- Data requirements are sufficient for schema planning.
- User flows are agreed.
- Desktop/export scope is agreed.
- Android/Play Store direction is clear enough for technical planning.
