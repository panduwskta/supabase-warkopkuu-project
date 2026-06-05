# SRS — Warungin v2

**Document:** Software Requirements Specification / System Requirements Document  
**Status:** Draft v0.2 — English-first baseline  
**Product:** Warungin / Warungin POS  
**Related PRD:** `docs/PRD-Warungin-v2.md` v0.5  
**Related TRD:** `docs/TRD-Warungin-v2.md` v0.4  
**Related DOR:** `docs/SRD-Warungin-v2.md`  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Introduction

### 1.1 Purpose

This SRS defines the functional and non-functional requirements for Warungin v2. It specifies how the system should behave, respond, perform, protect data, handle offline usage, support reporting, and be validated.

This document bridges product and technical planning:

- PRD defines product intent and business/user needs.
- SRS defines system requirements in a formal, testable way.
- TRD defines the technical architecture and implementation approach.
- DOR/SRD defines development operating rules, sprint discipline, approval gates, and verification workflow.

### 1.2 Scope

Warungin v2 is a cloud-first, offline-capable, mobile-first POS and operations system for Indonesian UMKM businesses such as warung, kedai, warkop, food stalls, and small shops.

MVP v2 includes:

- account and store setup,
- onboarding and demo/sample data,
- product/menu and HPP/modal management,
- cashier checkout,
- stock deduction,
- transactions and expenses,
- local-first offline-capable operations,
- cloud sync,
- receipt PNG sharing,
- CSV/Excel export,
- report-ready PDF export,
- mobile dashboard,
- minimal desktop dashboard.

### 1.3 Definitions

| Term | Definition |
|---|---|
| MVP | Minimum Viable Product: the smallest useful version that can be validated by real users |
| Cloud-first | Cloud/Supabase is the source of truth for logged-in users after sync |
| Offline-capable | The system remains usable for core operations without active internet |
| Local DB | Local device database, implemented with IndexedDB/Dexie |
| Sync Queue | Local queue for mutations waiting to be synced to cloud |
| RPC | Server-side database function, used for atomic checkout + stock update |
| RLS | Row Level Security, used to isolate user/store data in Supabase |
| HPP/Modal | Product cost used for profit estimation |
| Report-ready PDF | A formatted, readable PDF report with summary, period, tables, and optional visuals |
| Desktop Dashboard Minimal | Basic desktop reporting dashboard, not full managerial CRUD |

---

## 2. Overall Description

### 2.1 Product Perspective

Warungin v2 is a major upgrade from WarkopKuu v1. It transforms the app from a simple cloud POS into a more structured product with offline-capable operations, stronger data model, reporting, and future readiness for desktop and Android distribution.

### 2.2 Product Functions

The system shall provide:

- authentication,
- store setup,
- onboarding/demo mode,
- product/menu management,
- category management,
- HPP/modal field,
- stock tracking,
- cashier/cart/checkout,
- transaction history,
- expense tracking,
- dashboard metrics,
- receipt PNG generation and sharing,
- offline-capable local operations,
- cloud synchronization,
- Excel/PDF reporting,
- minimal desktop dashboard,
- settings and demo reset.

### 2.3 User Classes

#### UC-01 — Owner / Business Operator

Primary MVP user. Uses Warungin from mobile for daily operations and desktop for basic reporting/export.

#### UC-02 — Cashier/Staff

Future user class. Staff roles and permissions are out of scope for MVP v2.

#### UC-03 — Desktop User

The same owner account using a desktop browser to view basic reports and export Excel/PDF.

### 2.4 Operating Environment

- Mobile browsers on modern Android/iOS.
- Desktop browsers for minimal dashboard.
- Supabase Auth/Postgres for cloud backend.
- IndexedDB/Dexie for local operational data.
- Vercel/static hosting candidate for web frontend.
- Future Android runtime via Capacitor.

### 2.5 Constraints

- MVP is single-user only.
- Open Bill is out of scope.
- Multi-user/staff is out of scope.
- Barcode scanning is out of scope.
- Payment gateway is out of scope.
- Bluetooth printing is out of scope.
- Native Android rebuild is out of scope.
- Receipt PNG is not uploaded to cloud in MVP.
- Old WarkopKuu cloud data remains legacy and is not auto-migrated in MVP.

### 2.6 Assumptions

- Users may experience unstable internet.
- Users prefer mobile-first operations.
- Users need simple business language, not complex accounting terminology.
- HPP/modal improves reporting but should not block trial/onboarding.
- Desktop dashboard is initially for reporting/export, not full management.

---

## 3. Functional Requirements

Each requirement includes priority and acceptance criteria.

### 3.1 Authentication & Store Ownership

#### FR-AUTH-001 — User Registration

**Priority:** Must

The system shall allow a user to register an account.

Acceptance:

- User can create an account.
- Registration errors are displayed clearly.
- Cloud data is associated with the authenticated user.

#### FR-AUTH-002 — User Login

**Priority:** Must

The system shall allow a registered user to log in.

Acceptance:

- User can access their own store data.
- User cannot access another user’s store data.

#### FR-AUTH-003 — Logout

**Priority:** Must

The system shall allow a user to log out.

Acceptance:

- Session is cleared.
- Protected screens require login again.

#### FR-AUTH-004 — Single-User Store Ownership

**Priority:** Must

The system shall associate the MVP account with one primary store.

Acceptance:

- Store rows are owned by the logged-in user.
- RLS enforces ownership.

---

### 3.2 Onboarding & Demo Data

#### FR-ONB-001 — Business Type Selection

**Priority:** Must

The system shall allow the user to select a business type.

Acceptance:

- Supported options include warung, warkop, food stall, small shop, and other.
- Selection is saved in onboarding/store state.

#### FR-ONB-002 — Theme/Preference Selection

**Priority:** Must

The system shall allow basic theme/preference selection during onboarding.

Acceptance:

- Selection is stored.
- Selection can influence UI/sample data.

#### FR-ONB-003 — Anonymous Exploration

**Priority:** Must

The system shall allow users to explore the app locally without immediate login.

Acceptance:

- User can access sample data without account.
- No cloud sync occurs before login/register.

#### FR-ONB-004 — Demo Data for Logged-In Users

**Priority:** Must

The system shall allow logged-in users to start with sample data.

Acceptance:

- Demo rows are marked as sample data.
- Demo data can be reset safely.

#### FR-ONB-005 — Reset Demo Data

**Priority:** Must

The system shall provide a reset demo data action.

Acceptance:

- Confirmation is required.
- Sample data can be removed without deleting real data unintentionally.

---

### 3.3 Product, Category, HPP, and Stock

#### FR-PROD-001 — Create Product/Menu

**Priority:** Must

The system shall allow users to create products/menu items.

Acceptance:

- Product has name, price, stock, category, and HPP/modal field.
- Product appears in product list and cashier.

#### FR-PROD-002 — HPP/Modal Field

**Priority:** Must

The system shall include HPP/modal in the product data model.

Acceptance:

- HPP defaults to 0 or empty-friendly value.
- Product creation is not blocked if user does not know HPP yet.
- Profit estimate can use HPP when available.

#### FR-PROD-003 — Update Product/Menu

**Priority:** Must

The system shall allow editing product data.

Acceptance:

- Local UI updates immediately.
- Update is queued for sync when needed.

#### FR-PROD-004 — Soft Delete / Deactivate Product

**Priority:** Must

The system shall allow products to be removed from active use without breaking historical transaction records.

Acceptance:

- Deleted/deactivated product does not appear in cashier.
- Historical transaction item snapshots remain readable.

#### FR-PROD-005 — Category Management

**Priority:** Must

The system shall support basic categories.

Acceptance:

- Products can be grouped.
- Cashier can filter by category.

#### FR-PROD-006 — Stock Tracking

**Priority:** Must

The system shall track product stock.

Acceptance:

- Stock can be updated.
- Checkout reduces local stock.
- Cloud checkout validates/updates stock through RPC/server-side transaction.

---

### 3.4 Cashier / POS

#### FR-POS-001 — Product Search and Selection

**Priority:** Must

The system shall allow product search and selection from cashier.

Acceptance:

- Search works by product name.
- Category filter is available.
- User can add product to cart.

#### FR-POS-002 — Cart Management

**Priority:** Must

The system shall allow cart item quantity adjustment and removal.

Acceptance:

- Cart total updates immediately.
- Quantity cannot exceed available local stock.

#### FR-POS-003 — Checkout

**Priority:** Must

The system shall convert a cart into a completed transaction.

Acceptance:

- Transaction and items are created locally.
- Stock is deducted locally.
- Sync queue entry is created.

#### FR-POS-004 — Payment and Change

**Priority:** Must

The system shall support payment amount input and change calculation.

Acceptance:

- Payment amount is saved.
- Change is calculated correctly.

#### FR-POS-005 — Payment Method

**Priority:** Must

The system shall support basic payment methods.

Acceptance:

- Supported methods: Cash, QRIS, Transfer, E-wallet.
- Payment method is visible in transaction detail and receipt.

#### FR-POS-006 — Atomic Cloud Checkout

**Priority:** Must

The system shall use RPC/server-side transaction for checkout sync.

Acceptance:

- Cloud transaction and stock update do not partially save.
- Unauthorized store checkout is rejected.
- Insufficient stock creates conflict state.

---

### 3.5 Transactions

#### FR-TX-001 — Transaction History

**Priority:** Must

The system shall display transaction history.

Acceptance:

- User can view recent transactions.
- User can filter/search basic transaction data.

#### FR-TX-002 — Transaction Detail

**Priority:** Must

The system shall show transaction detail.

Acceptance:

- Detail includes receipt number, date, items, payment, total, and profit estimate.

#### FR-TX-003 — Export Transactions

**Priority:** Must

The system shall export transactions to CSV/Excel.

Acceptance:

- Export respects selected period.
- Export file can be opened in spreadsheet tools.

#### FR-TX-004 — Completed Transaction Protection

**Priority:** Must

The system shall protect completed transaction integrity.

Acceptance:

- Completed transactions are not casually edited in a way that breaks stock consistency.

---

### 3.6 Expenses

#### FR-EXP-001 — Create Expense

**Priority:** Must

The system shall allow users to record expenses.

Acceptance:

- Expense has title/category, amount, date, and optional notes.
- Expense appears in dashboard calculations.

#### FR-EXP-002 — Expense List

**Priority:** Must

The system shall display expense history.

Acceptance:

- User can view expenses by date/period.

#### FR-EXP-003 — Offline Expense Sync

**Priority:** Must

The system shall allow expense creation while offline and sync later.

Acceptance:

- Offline-created expense is queued.
- Expense syncs once online.

---

### 3.7 Dashboard and Reports

#### FR-DASH-001 — Mobile Dashboard Summary

**Priority:** Must

The system shall show daily business summary.

Acceptance:

- Sales, transaction count, expenses, and estimated profit are displayed.

#### FR-DASH-002 — Operational Insights

**Priority:** Must

The system shall show operational insights.

Acceptance:

- Low stock, recent transactions, and top products are visible when data exists.

#### FR-DASH-003 — Period Filter

**Priority:** Should

The system should support report period selection.

Acceptance:

- Reports and exports use selected period.

#### FR-REP-001 — Excel Export

**Priority:** Must

The system shall export structured report data to Excel.

Acceptance:

- Export includes summary and useful detail sheets.

#### FR-REP-002 — Report-Ready PDF Export

**Priority:** Must

The system shall export report-ready PDF.

Acceptance:

- PDF includes store/brand header, period, timestamp, summary metrics, optional chart/visual, supporting tables, and footer.

---

### 3.8 Receipt PNG and Sharing

#### FR-RCP-001 — Receipt Number

**Priority:** Must

The system shall generate receipt numbers using default prefix `WRG`.

Acceptance:

- Receipt number is unique per store.
- Prefix can be customized later from Settings.

#### FR-RCP-002 — Receipt PNG Generation

**Priority:** Must

The system shall generate receipt as PNG.

Acceptance:

- PNG includes store name, receipt number, date/time, items, total, payment, change, and footer.

#### FR-RCP-003 — Share Receipt

**Priority:** Must

The system shall allow sharing receipt PNG and text.

Acceptance:

- PNG is shared when supported.
- Text fallback is available.

#### FR-RCP-004 — Receipt Retention

**Priority:** Must

The system shall store receipt PNG locally and temporarily.

Acceptance:

- PNG is not uploaded to cloud by default.
- PNG auto-deletes after successful share when enabled/possible or after 14 days.
- Receipt can be regenerated from transaction data.

---

### 3.9 Offline and Sync

#### FR-OFF-001 — Local Data Availability

**Priority:** Must

The system shall keep previously loaded data available locally.

Acceptance:

- User can view local data while offline.

#### FR-OFF-002 — Local Mutation Queue

**Priority:** Must

The system shall queue local changes.

Acceptance:

- Transactions, expenses, and product changes create queue entries.

#### FR-OFF-003 — Immediate Local UI Update

**Priority:** Must

The system shall update UI immediately after local input.

Acceptance:

- User does not wait for cloud response for core local operations.

#### FR-OFF-004 — Sync Status

**Priority:** Must

The system shall show sync state.

Acceptance:

- User can distinguish pending, syncing, synced, failed, and conflict states.

#### FR-OFF-005 — Retry Sync

**Priority:** Must

The system shall retry pending/failed sync when online.

Acceptance:

- Failed queue entries can retry.

#### FR-OFF-006 — Conflict Handling

**Priority:** Must

The system shall detect stock-related conflicts.

Acceptance:

- Insufficient cloud stock creates clear conflict message and status.

#### FR-SYNC-001 — Hybrid Write Strategy

**Priority:** Must

The system shall use direct operations for simple entities and RPC for checkout/stock.

Acceptance:

- Simple changes sync directly.
- Checkout uses server-side transaction.

---

### 3.10 Desktop Dashboard Minimal

#### FR-DESK-001 — Public Landing Page

**Priority:** Must

The system shall provide a public landing page.

Acceptance:

- Landing page presents product identity and desktop login entry.

#### FR-DESK-002 — Desktop Login

**Priority:** Must

The system shall allow login to desktop dashboard.

Acceptance:

- User sees only their own report data.

#### FR-DESK-003 — Basic Reporting Dashboard

**Priority:** Must

The system shall display basic reports on desktop.

Acceptance:

- Sales, transaction count, expenses, estimated profit, top products, and period summary are visible.

#### FR-DESK-004 — Desktop Excel/PDF Export

**Priority:** Must

The system shall export desktop reports to Excel and PDF.

Acceptance:

- Excel is structured.
- PDF is report-ready.

#### FR-DESK-005 — Coming Soon Navigation

**Priority:** Must

The system shall display future desktop modules as Coming Soon when present.

Acceptance:

- User is not misled into thinking unavailable features are active.

---

## 4. External Interface Requirements

### 4.1 User Interface

The UI shall be:

- mobile-first for operations,
- responsive for desktop dashboard,
- Indonesian-language for end-user copy,
- clear in empty/error/offline/sync states,
- simple and non-accounting-heavy.

### 4.2 Hardware Interfaces

No dedicated hardware is required for MVP.

Out of scope:

- Bluetooth printer,
- barcode scanner hardware,
- cash drawer,
- external POS device.

### 4.3 Software Interfaces

Required:

- Supabase Auth.
- Supabase Postgres.
- IndexedDB/Dexie.
- Web Share API where available.
- Browser file download APIs.

Future:

- Capacitor Share/Filesystem plugins.

### 4.4 Communication Interfaces

- HTTPS for cloud communication.
- Supabase SDK for auth/database.
- Sync queue for delayed cloud operations.

---

## 5. Non-Functional Requirements

### 5.1 Performance

#### NFR-PERF-001 — Responsive Local UX

Core UI operations shall respond from local state without waiting for cloud.

Acceptance:

- Cashier, cart, product list, and expense input feel responsive on mobile.

#### NFR-PERF-002 — Search Performance

Product search shall remain usable for small/medium catalogs.

Acceptance:

- Search remains responsive for at least hundreds of products.

#### NFR-PERF-003 — Export Performance

Excel/PDF export shall complete reliably for typical UMKM data volume.

Acceptance:

- Export shows loading/progress if needed.
- Export does not freeze app indefinitely.

### 5.2 Reliability

#### NFR-REL-001 — Offline Continuity

Core operations shall continue without active internet.

Acceptance:

- User can create transaction/expense locally while offline.

#### NFR-REL-002 — Sync Recovery

Failed sync shall be recoverable.

Acceptance:

- Pending/failed sync can retry.

#### NFR-REL-003 — Checkout Consistency

Cloud checkout shall not partially save.

Acceptance:

- RPC/server-side transaction handles transaction and stock update atomically.

### 5.3 Security

#### NFR-SEC-001 — Authentication

Cloud data access shall require authentication.

Acceptance:

- Anonymous mode remains local-only.

#### NFR-SEC-002 — RLS Isolation

Cloud data shall be isolated by user/store.

Acceptance:

- Cross-user reads/writes are rejected.

#### NFR-SEC-003 — No Secret Exposure

The frontend shall not expose private service keys.

Acceptance:

- Only safe public client keys are used in frontend.

### 5.4 Privacy

#### NFR-PRI-001 — Data Collection Clarity

The system shall support future Privacy Policy and Play Store Data Safety clarity.

Data categories:

- account data,
- store profile,
- product/menu data,
- transactions,
- expenses,
- temporary local receipt PNG.

#### NFR-PRI-002 — Local Receipt Privacy

Receipt PNG shall remain local-only in MVP.

Acceptance:

- Receipt PNG is not uploaded by default.
- Temporary cleanup exists.

### 5.5 Usability

#### NFR-USE-001 — Simple End-User Language

End-user copy shall be simple and clear.

Acceptance:

- Empty, error, and offline states are understandable.

#### NFR-USE-002 — Low Onboarding Friction

Users shall be able to explore without heavy setup.

Acceptance:

- Sample data exists.
- HPP does not block product creation.

#### NFR-USE-003 — Clear Coming Soon States

Unavailable desktop modules shall be clearly marked.

Acceptance:

- User understands feature is not active yet.

### 5.6 Maintainability

#### NFR-MAIN-001 — TypeScript

The codebase shall use TypeScript.

Acceptance:

- Domain types and sync payloads are typed.

#### NFR-MAIN-002 — Modular Structure

The codebase shall use modular structure.

Acceptance:

- Code is separated into app, features, lib, components, and types.

#### NFR-MAIN-003 — Stack Discipline

The system shall follow agreed TRD stack.

Acceptance:

- No unapproved major library changes.

### 5.7 Portability

#### NFR-PORT-001 — PWA/Capacitor Readiness

The system shall avoid decisions that block future Capacitor wrapper.

Acceptance:

- Local storage and share behavior can be adapted to Capacitor.

---

## 6. Data Requirements

Core logical entities:

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

Data requirements:

- Store-based ownership.
- Soft delete for historical safety.
- Product and transaction item snapshots.
- HPP default 0/empty-friendly.
- Receipt PNG local-only and temporary.
- Legacy v1 data remains separate.

---

## 7. Reporting Requirements

### 7.1 Dashboard Metrics

Required:

- total sales,
- transaction count,
- total expenses,
- estimated profit,
- top products/menu,
- low stock,
- recent transactions.

### 7.2 Excel Export

Excel export shall include useful structured sheets, such as:

- Summary,
- Transactions,
- Transaction Items,
- Expenses,
- Products.

### 7.3 PDF Export

PDF export shall be report-ready.

Minimum content:

- Warungin/store header,
- report period,
- export timestamp,
- summary metrics,
- chart/visual snapshot if available,
- supporting tables,
- footer/branding.

---

## 8. Acceptance Criteria Summary

MVP v2 is acceptable when:

1. User can onboard with sample data.
2. User can register/login.
3. User can create/manage products with HPP optional-friendly behavior.
4. User can make checkout locally.
5. Stock decreases locally.
6. Checkout syncs safely to cloud using hybrid/RPC strategy.
7. User can record expenses.
8. Dashboard shows meaningful metrics.
9. User can generate/share receipt PNG.
10. Receipt PNG retention works.
11. User can export CSV/Excel.
12. User can export report-ready PDF.
13. Core flows remain usable offline/unstable.
14. Pending sync completes when online.
15. RLS prevents cross-user access.
16. Desktop landing/login/dashboard minimal works.
17. Desktop Excel/PDF export works.
18. Advanced desktop modules are clearly Coming Soon.
19. Build/lint/typecheck pass or blockers are documented.

---

## 9. Out of Scope for MVP v2

- Open Bill.
- Multi-user owner/staff.
- Permission management.
- Barcode scanning.
- Supplier management.
- Stock in/out advanced.
- Weighted average HPP.
- Bluetooth print.
- Payment gateway.
- Subscription/paywall.
- Native Android rebuild.
- Full desktop managerial CRUD.
- AI features.
- Complex warehouse/marketplace inventory.

---

## 10. Traceability Matrix

| Requirement Area | PRD | TRD | SRS |
|---|---|---|---|
| Rebrand/naming | PRD 5/8/12 | TRD 15/19 | SRS 1/2/3 |
| Auth/account | PRD 8 | TRD 6/9 | SRS 3.1 |
| Onboarding/demo | PRD 8/10 | TRD 11 | SRS 3.2 |
| Product/HPP | PRD 8/11 | TRD 6 | SRS 3.3 |
| POS checkout | PRD 8/10 | TRD 8 | SRS 3.4 |
| Offline sync | PRD 8/10/12 | TRD 7/8 | SRS 3.9/5 |
| RLS/security | PRD 13 | TRD 9 | SRS 5.3 |
| Receipt PNG | PRD 8/10/12 | TRD 10 | SRS 3.8 |
| Export Excel/PDF | PRD 8/12 | TRD 12 | SRS 3.7/7 |
| Desktop minimal | PRD 8/10/12 | TRD 12 | SRS 3.10 |
| Play Store future | PRD 8/14 | TRD 13 | SRS 5.7 |
| Scope exclusions | PRD 7 | TRD 17/19 | SRS 9 |

---

## 11. Open Items

To resolve during Sprint 0:

1. Final Excel export library.
2. Final PDF export approach/library.
3. Final receipt PNG library.
4. Final chart/visual library decision.
5. Exact Dexie schema versioning approach.
6. Exact checkout RPC payload contract.
7. Exact desktop dashboard route/layout split.
8. Exact receipt cleanup behavior in browser vs future Capacitor.

---

## 12. Change Control

Update SRS when:

- functional requirements change,
- non-functional requirements change,
- MVP scope changes,
- export/reporting requirements change,
- sync behavior changes,
- desktop scope changes,
- security/privacy requirements change.

SRS does not need updates for:

- minor copy changes,
- minor visual polish,
- internal refactor with no behavior change,
- bug fixes that do not alter requirements.
