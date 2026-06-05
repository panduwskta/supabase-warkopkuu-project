# SRS — Warungin v2

**Document:** Software Requirements Specification / System Requirements Document  
**Status:** Draft v0.1  
**Product:** Warungin / Warungin POS  
**Related PRD:** `docs/PRD-Warungin-v2.md` v0.4 — desktop/export decisions locked  
**Related TRD:** `docs/TRD-Warungin-v2.md` v0.3 — sync/desktop/export decisions locked  
**Related DOR:** `docs/SRD-Warungin-v2.md` — development operating rules  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Introduction

### 1.1 Purpose

Dokumen SRS ini mendefinisikan spesifikasi kebutuhan sistem Warungin v2 secara menyeluruh, formal, dan dapat dijadikan acuan pengembangan, review, testing, serta validasi.

SRS menjembatani PRD dan TRD:

- PRD menjelaskan kebutuhan produk dan alasan bisnis/user.
- SRS menjelaskan persyaratan sistem secara fungsional dan non-fungsional.
- TRD menjelaskan pendekatan teknis/arsitektur untuk memenuhi SRS.
- DOR/SRD lama menjelaskan aturan development, sprint, approval, dan verification workflow.

### 1.2 Product Scope

Warungin v2 adalah aplikasi kasir dan manajemen warung/kedai/warkop/UMKM Indonesia yang:

- cloud-first,
- offline-capable,
- mobile-first,
- single-user untuk MVP,
- mendukung dashboard desktop minimal,
- mendukung export Excel/PDF report-ready,
- siap diarahkan ke Play Store setelah stabil.

### 1.3 Definitions

| Term | Definition |
|---|---|
| Warungin | Nama produk final v2 |
| Warungin POS | Product label untuk konteks POS/marketplace |
| MVP | Minimum Viable Product, versi minimum yang sudah berguna dan bisa divalidasi |
| Cloud-first | Cloud/Supabase menjadi sumber data utama untuk akun login |
| Offline-capable | App tetap bisa dipakai untuk operasional dasar saat internet tidak stabil/offline |
| Local DB | Database lokal di device, kandidat IndexedDB/Dexie |
| Sync Queue | Antrian perubahan lokal yang belum tersinkron ke cloud |
| RPC | Function di Supabase/Postgres untuk operasi server-side, terutama checkout + stok |
| RLS | Row Level Security Supabase/Postgres |
| Desktop Dashboard Minimal | Dashboard desktop v2 untuk laporan basic dan export, bukan full manajerial |
| Report-ready PDF | PDF laporan yang sudah rapi untuk dibaca/dibagikan, bukan dump data mentah |

### 1.4 References

- `docs/PRD-Warungin-v2.md`
- `docs/TRD-Warungin-v2.md`
- `docs/SRD-Warungin-v2.md`
- Benchmark repo: `panduwskta/kasirgratisan`
- Existing repo: `panduwskta/supabase-warkopkuu-project`

---

## 2. Overall Description

### 2.1 Product Perspective

Warungin v2 merupakan major update dari WarkopKuu v1. Sistem ini tidak hanya mengganti brand, tetapi memperbarui fondasi aplikasi agar lebih siap menjadi produk jangka panjang.

Current v1 memiliki fitur kasir/menu/stok/transaksi/pengeluaran/dashboard dasar. v2 akan memperluas dan merapikan sistem agar:

- data lebih terstruktur,
- bisa berjalan saat internet tidak stabil,
- dapat sinkron ke cloud,
- dapat dipakai lintas perangkat,
- siap punya dashboard desktop,
- siap dibungkus menjadi Android app via Capacitor di fase setelah stabil.

### 2.2 Product Functions Summary

Warungin v2 harus menyediakan:

- autentikasi akun,
- onboarding dan sample/demo data,
- manajemen toko/store dasar,
- manajemen kategori,
- manajemen produk/menu,
- HPP/modal produk,
- stok dasar,
- kasir/cart/checkout,
- transaksi dan transaction items,
- pengeluaran,
- dashboard mobile,
- receipt PNG dan share,
- export CSV/Excel,
- export PDF report-ready,
- offline-capable local operations,
- cloud sync,
- desktop dashboard minimal,
- settings dasar.

### 2.3 User Classes

#### UC-01 Owner / Pemilik Warung

Primary user untuk MVP v2.

Kebutuhan:

- login/register,
- setup toko,
- input menu/produk,
- transaksi harian,
- pengeluaran,
- lihat dashboard,
- export laporan,
- share struk,
- tetap operasional saat internet tidak stabil.

#### UC-02 Kasir/Staf — Future

Belum menjadi target MVP v2. Akan dibahas untuk versi setelah single-user stabil.

#### UC-03 Desktop User / Owner di Desktop

User yang sama dengan owner, tetapi mengakses dashboard desktop minimal dari landing page.

Kebutuhan v2:

- login desktop,
- lihat laporan basic,
- export Excel/PDF,
- melihat nav fitur lanjutan sebagai Coming Soon.

### 2.4 Operating Environment

MVP v2 harus berjalan pada:

- Mobile browser modern Android/iOS.
- Desktop browser modern untuk dashboard minimal.
- Vercel/static hosting untuk frontend.
- Supabase untuk auth/database.
- Local IndexedDB untuk offline-capable storage.

Future:

- Android app via Capacitor wrapper.

### 2.5 Constraints

- MVP v2 single-user dulu.
- Open Bill tidak masuk MVP v2.
- Multi-user/staff tidak masuk MVP v2.
- Barcode tidak masuk MVP v2.
- Supplier/stock movement advanced tidak masuk MVP v2.
- Payment gateway tidak masuk MVP v2.
- Native Android rebuild dari nol tidak dilakukan di MVP.
- Receipt PNG tidak diupload ke cloud di MVP.
- Old WarkopKuu cloud data tidak auto-migrate di MVP.

### 2.6 Assumptions

- User login memakai Supabase Auth.
- User utama memakai HP untuk operasional harian.
- Internet user bisa tidak stabil.
- User bisa mulai dengan data sample.
- HPP/modal penting untuk laporan laba, tetapi user boleh mengisinya belakangan.
- Desktop dashboard v2 hanya untuk laporan basic dan export, bukan operasi manajerial penuh.

### 2.7 Dependencies

- Supabase Auth.
- Supabase Postgres + RLS.
- IndexedDB/Dexie.
- React/Vite/TypeScript.
- Tailwind/shadcn.
- Export libraries untuk Excel/PDF sesuai TRD.
- Browser Web Share API untuk sharing jika tersedia.

---

## 3. System Features & Functional Requirements

Functional requirement format:

- **Priority:** Must / Should / Could / Future
- **Source:** PRD/TRD decision reference
- **Acceptance:** high-level acceptance criteria

---

### 3.1 Authentication & Account

#### FR-AUTH-001 — Register Account

**Priority:** Must

System shall allow user to register an account using email/password or supported Supabase Auth method.

Acceptance:

- User can create account.
- User session is established or user is instructed to verify email if required.
- Errors are shown in simple Indonesian copy.

#### FR-AUTH-002 — Login Account

**Priority:** Must

System shall allow registered user to login.

Acceptance:

- User can login successfully.
- User sees only their own store/data.
- Invalid credentials show clear error.

#### FR-AUTH-003 — Logout

**Priority:** Must

System shall allow user to logout.

Acceptance:

- Session is cleared.
- Protected app area is no longer accessible until login.

#### FR-AUTH-004 — Single-User Store Ownership

**Priority:** Must

System shall associate user with one primary store for MVP v2.

Acceptance:

- Store data belongs to logged-in owner.
- RLS prevents cross-user access.

---

### 3.2 Onboarding & Demo Data

#### FR-ONB-001 — Business Type Selection

**Priority:** Must

System shall allow new user to choose business type such as warung, warkop, tempat makan, toko kecil, or lainnya.

Acceptance:

- Selection is saved locally and/or cloud depending on user mode.
- Selection can influence sample data/theme.

#### FR-ONB-002 — Theme Selection

**Priority:** Must

System shall provide simple theme preference during onboarding.

Acceptance:

- User can select visual/theme preference.
- Theme is applied or stored for later use.

#### FR-ONB-003 — Explore Anonymous with Sample Data

**Priority:** Must

System shall allow user to explore app without immediate login using local sample data.

Acceptance:

- User can enter app without account.
- Sample data appears.
- No cloud sync happens until login/register.

#### FR-ONB-004 — Logged-In User Can Use Sample Data

**Priority:** Must

System shall allow logged-in user to start with sample data.

Acceptance:

- Logged-in user can see seeded demo products/categories/expenses/transactions.
- Demo rows are marked as sample data.

#### FR-ONB-005 — Reset Demo Data

**Priority:** Must

System shall provide reset demo data action.

Acceptance:

- User can remove sample data.
- Confirmation appears before reset.
- Non-sample production data is not accidentally removed unless user explicitly chooses full reset.

---

### 3.3 Store Settings

#### FR-STORE-001 — Store Profile

**Priority:** Must

System shall allow user to set store name and optional store information.

Acceptance:

- Store name appears in dashboard and receipt.
- Store phone/address/footer can be optional.

#### FR-STORE-002 — Receipt Prefix Default

**Priority:** Must

System shall use default receipt prefix `WRG`.

Acceptance:

- New receipt numbers start with `WRG` by default.

#### FR-STORE-003 — Receipt Prefix Customization

**Priority:** Should

System shall allow user to customize receipt prefix from Settings using the same format.

Acceptance:

- User can update prefix.
- Future receipt numbers use new prefix.
- Existing receipt numbers remain unchanged.

---

### 3.4 Product/Menu & Category

#### FR-PROD-001 — Create Product/Menu

**Priority:** Must

System shall allow user to create product/menu item.

Required data:

- name,
- category optional/default,
- selling price,
- stock,
- HPP/modal default 0 or empty-friendly.

Acceptance:

- Product appears in product list and cashier.
- Product can be used in transaction if active and stock available.

#### FR-PROD-002 — HPP/Modal Field

**Priority:** Must

System shall include HPP/modal in product data model.

Acceptance:

- HPP field exists.
- HPP default does not block product creation.
- UI explains that HPP improves profit accuracy.

#### FR-PROD-003 — Update Product/Menu

**Priority:** Must

System shall allow user to edit product/menu basic fields.

Acceptance:

- Changes update locally immediately.
- Changes sync to cloud when online.

#### FR-PROD-004 — Soft Delete Product/Menu

**Priority:** Must

System shall allow product/menu to be deleted or deactivated without breaking old transaction history.

Acceptance:

- Deleted product no longer appears in cashier.
- Old transaction item snapshots remain readable.

#### FR-PROD-005 — Category Management Basic

**Priority:** Must

System shall support basic product categories.

Acceptance:

- User can group products.
- Cashier can filter/search by category.

#### FR-PROD-006 — Stock Basic

**Priority:** Must

System shall maintain product stock count.

Acceptance:

- Stock can be set/edited.
- Checkout reduces stock locally.
- Cloud checkout sync validates/updates stock.

---

### 3.5 Cashier / POS

#### FR-POS-001 — Product Search & Selection

**Priority:** Must

System shall allow user to search and select products in cashier.

Acceptance:

- Product search works by name.
- Category filter is available.
- Out-of-stock product cannot be sold unless rules later allow it.

#### FR-POS-002 — Cart Management

**Priority:** Must

System shall allow adding/removing products and changing quantity in cart.

Acceptance:

- Cart total updates immediately.
- Quantity cannot exceed available stock locally.

#### FR-POS-003 — Checkout

**Priority:** Must

System shall allow user to checkout cart into completed transaction.

Acceptance:

- Transaction is created locally.
- Transaction items are saved.
- Stock decreases locally.
- Sync queue is created if cloud sync pending.

#### FR-POS-004 — Payment Amount & Change

**Priority:** Must

System shall support payment amount input and change calculation for cash.

Acceptance:

- User inputs paid amount.
- Change is calculated correctly.
- Payment data appears in transaction and receipt.

#### FR-POS-005 — Payment Method

**Priority:** Must

System shall support basic payment methods: cash, QRIS, transfer, e-wallet.

Acceptance:

- User can select payment method.
- Selected method appears in transaction history/receipt.

#### FR-POS-006 — Atomic Cloud Checkout

**Priority:** Must

System shall sync checkout using RPC/server-side transaction for transaction insert + stock update.

Acceptance:

- Checkout sync does not leave cloud in half-saved state.
- Unauthorized store checkout is rejected.
- Insufficient cloud stock is marked as conflict.

---

### 3.6 Transactions & History

#### FR-TX-001 — Transaction List

**Priority:** Must

System shall show transaction history.

Acceptance:

- User can see recent transactions.
- User can filter by period/search basic.

#### FR-TX-002 — Transaction Detail

**Priority:** Must

System shall show transaction details including items, payment, total, receipt number, and profit estimate.

Acceptance:

- Item snapshots remain visible even if product is deleted.

#### FR-TX-003 — Export Transaction Data

**Priority:** Must

System shall export transaction data to CSV/Excel.

Acceptance:

- User can export selected period.
- File contains transaction summary and/or details.

#### FR-TX-004 — Transaction Status

**Priority:** Must

System shall support completed transactions in MVP.

Acceptance:

- Completed transaction is immutable enough to protect stock consistency.
- Cancel/delete behavior, if present, must be explicit and safe.

#### FR-TX-005 — Open Bill

**Priority:** Future / v2.1 Candidate

Open Bill is not MVP v2.

Acceptance:

- No Open Bill implementation required in MVP.

---

### 3.7 Expenses

#### FR-EXP-001 — Create Expense

**Priority:** Must

System shall allow user to record expense.

Acceptance:

- Expense has title/category/name, amount, date, notes optional.
- Expense appears in dashboard totals.

#### FR-EXP-002 — Expense List

**Priority:** Must

System shall show expense history.

Acceptance:

- User can view expenses by date/period.

#### FR-EXP-003 — Expense Sync

**Priority:** Must

System shall save expenses locally first and sync to cloud.

Acceptance:

- Offline-created expense syncs when online.

---

### 3.8 Dashboard Mobile

#### FR-DASH-001 — Daily Summary

**Priority:** Must

System shall show daily business summary.

Acceptance:

- Total sales today.
- Transaction count today.
- Total expenses today.
- Estimated profit today.

#### FR-DASH-002 — Operational Alerts

**Priority:** Must

System shall show useful operational alerts/sections.

Acceptance:

- Low stock products visible.
- Recent transactions visible.
- Top products/menu visible if data exists.

#### FR-DASH-003 — Period Summary

**Priority:** Should

System should support basic period selection for reporting.

Acceptance:

- User can view today/weekly/monthly or selected period summary.

---

### 3.9 Receipt PNG & Sharing

#### FR-RCP-001 — Receipt Number

**Priority:** Must

System shall generate receipt number using default prefix `WRG`.

Acceptance:

- Receipt number is unique per store.

#### FR-RCP-002 — Receipt PNG Generation

**Priority:** Must

System shall generate visual receipt as PNG.

Acceptance:

- PNG contains store name, receipt number, date/time, items, total, payment, change, and thank you/footer.

#### FR-RCP-003 — Share Receipt

**Priority:** Must

System shall allow user to share receipt PNG to WhatsApp or other apps when supported.

Acceptance:

- Share includes PNG file if supported.
- Share text summary is included or available as fallback.

#### FR-RCP-004 — Receipt PNG Local Retention

**Priority:** Must

System shall store receipt PNG locally only in MVP with temporary retention.

Acceptance:

- PNG not uploaded to cloud by default.
- PNG can be auto-deleted after successful share if enabled/possible.
- PNG auto-deletes after 14 days by default.
- Receipt can be regenerated from transaction data.

---

### 3.10 Offline-Capable Local Operations

#### FR-OFF-001 — Local Data Availability

**Priority:** Must

System shall keep previously loaded data available locally.

Acceptance:

- User can open app with local data when offline.

#### FR-OFF-002 — Local Mutation Queue

**Priority:** Must

System shall queue local changes when offline or unstable.

Acceptance:

- Transactions, expenses, product/stok basic changes create sync queue entries.

#### FR-OFF-003 — Local Realtime UX

**Priority:** Must

System shall update UI immediately after local input.

Acceptance:

- User sees transaction/expense/product changes without waiting for cloud.

#### FR-OFF-004 — Sync Status UI

**Priority:** Must

System shall show sync status.

Acceptance:

- User can distinguish saved locally, pending sync, synced, failed, or conflict.

#### FR-OFF-005 — Retry Sync

**Priority:** Must

System shall retry pending/failed sync when connection returns.

Acceptance:

- Pending mutations sync automatically or via manual retry.

#### FR-OFF-006 — Conflict Handling Basic

**Priority:** Must

System shall detect and surface basic conflicts, especially stock conflict.

Acceptance:

- Insufficient cloud stock during sync becomes conflict state.
- User gets clear message and next action.

---

### 3.11 Cloud Sync

#### FR-SYNC-001 — Initial Pull

**Priority:** Must

System shall pull cloud data into local DB after login.

Acceptance:

- Store/products/transactions/expenses become available locally.

#### FR-SYNC-002 — Push Pending Mutations

**Priority:** Must

System shall push queued local mutations to cloud when online.

Acceptance:

- Pending entries become synced or failed/conflict.

#### FR-SYNC-003 — Hybrid Write Strategy

**Priority:** Must

System shall use hybrid cloud write strategy.

Acceptance:

- Direct table operations for simple entities.
- RPC/server-side transaction for checkout + stock update.

#### FR-SYNC-004 — Last-Write-Wins for Non-Stock Entities

**Priority:** Must

System shall use simple conflict strategy for non-stock entities in MVP.

Acceptance:

- Products/categories/expenses/settings can use last-write-wins based on updated_at.

---

### 3.12 Desktop Dashboard Minimal

#### FR-DESK-001 — Public Landing Page

**Priority:** Must

System shall provide public landing page for Warungin.

Acceptance:

- Landing page presents product identity and login entry.

#### FR-DESK-002 — Desktop Login

**Priority:** Must

System shall allow login from desktop dashboard using same account.

Acceptance:

- User can login.
- User sees own store/report data.

#### FR-DESK-003 — Basic Report Dashboard

**Priority:** Must

System shall show basic reports on desktop.

Acceptance:

- Sales summary.
- Transaction count.
- Expenses summary.
- Estimated profit.
- Top products/menu.
- Period summary.

#### FR-DESK-004 — Excel Export

**Priority:** Must

System shall export report data as Excel.

Acceptance:

- Export file includes summary and detail sheets where useful.

#### FR-DESK-005 — PDF Report Export

**Priority:** Must

System shall export report-ready PDF.

Acceptance:

- PDF includes brand/store header.
- Period and timestamp.
- Summary metrics.
- Visual/chart snapshot if available.
- Supporting tables.
- Footer/branding.

#### FR-DESK-006 — Coming Soon Navigation

**Priority:** Must

System shall show future desktop modules as Coming Soon when appropriate.

Acceptance:

- Nav can show unavailable modules.
- User is not misled into thinking feature is active.

#### FR-DESK-007 — No Full Desktop Managerial Writes in v2

**Priority:** Must

System shall not implement full desktop CRUD/manajerial flows in MVP v2.

Acceptance:

- Advanced desktop actions remain Coming Soon or unavailable.

---

### 3.13 Settings

#### FR-SET-001 — Basic Store Settings

**Priority:** Must

System shall allow basic store setting management.

Acceptance:

- Store name and receipt footer can be updated.

#### FR-SET-002 — Sync/Storage Status

**Priority:** Should

System should expose basic sync/storage status.

Acceptance:

- User can see pending sync count or storage/receipt cleanup status where useful.

#### FR-SET-003 — Demo Reset

**Priority:** Must

System shall expose reset demo data action.

Acceptance:

- User can remove sample rows safely.

---

### 3.14 Export & Reporting

#### FR-REP-001 — CSV/Excel Transaction Export

**Priority:** Must

System shall export transactional data to CSV/Excel.

Acceptance:

- Export respects selected period.
- File can be opened by spreadsheet tools.

#### FR-REP-002 — PDF Report-Ready Export

**Priority:** Must

System shall export report-ready PDF from dashboard/report view.

Acceptance:

- PDF is readable and suitable for owner review/share.
- Includes summary, visual/chart if available, and supporting tables.

#### FR-REP-003 — Report Period Filter

**Priority:** Must

System shall support report period selection.

Acceptance:

- Report/export output uses selected period.

---

## 4. External Interface Requirements

### 4.1 User Interface Requirements

UI shall be:

- mobile-first for operational app,
- responsive for desktop dashboard,
- Indonesian language first,
- simple and friendly,
- not overloaded with advanced accounting terms,
- clear in empty/error/offline states.

### 4.2 Hardware Interfaces

MVP v2 does not require dedicated hardware.

Not required in MVP:

- barcode scanner hardware,
- Bluetooth printer,
- cash drawer,
- external POS devices.

### 4.3 Software Interfaces

Required:

- Supabase Auth.
- Supabase Postgres.
- Browser IndexedDB.
- Browser Web Share API if available.
- Browser file download APIs.

Future:

- Capacitor Android APIs.
- Capacitor Share/Filesystem plugins.

### 4.4 Communication Interfaces

- HTTPS for cloud communication.
- Supabase client SDK for auth/database.
- Offline sync queue for delayed cloud communication.

---

## 5. Non-Functional Requirements

### 5.1 Performance

#### NFR-PERF-001 — Mobile Responsiveness

System shall respond quickly on common mobile devices.

Acceptance:

- Core interactions do not feel blocked by cloud sync.
- Local-first UI updates immediately.

#### NFR-PERF-002 — Search Performance

System shall support fast product search for small/medium UMKM catalogs.

Acceptance:

- Product search remains usable for at least hundreds of products.

#### NFR-PERF-003 — Export Performance

System shall generate Excel/PDF reports for common UMKM data volumes without freezing app excessively.

Acceptance:

- Export for typical daily/monthly data completes reliably.
- If heavy, UI shows loading/progress.

### 5.2 Reliability

#### NFR-REL-001 — Offline Continuity

System shall continue core operations when internet is unavailable.

Acceptance:

- User can continue cashier/expenses/product basics locally.

#### NFR-REL-002 — Sync Recovery

System shall recover from failed sync attempts.

Acceptance:

- Failed mutations can retry.
- User can see failed status.

#### NFR-REL-003 — Checkout Consistency

System shall avoid partial cloud checkout.

Acceptance:

- Transaction and stock update are handled atomically via RPC/server-side transaction.

### 5.3 Security

#### NFR-SEC-001 — Authentication Required for Cloud Data

System shall require authentication for cloud store data.

Acceptance:

- Anonymous mode stays local-only.

#### NFR-SEC-002 — RLS Data Isolation

System shall enforce RLS so user cannot access other users’ data.

Acceptance:

- Cross-user read/write attempts are rejected.

#### NFR-SEC-003 — No Secret Exposure

System shall not expose private service keys in frontend.

Acceptance:

- Only public anon key is used client-side.

### 5.4 Privacy

#### NFR-PRI-001 — Data Collection Clarity

System shall make collected data understandable for future Privacy Policy/Data Safety.

Data categories:

- account email/auth data,
- store profile,
- products/menu,
- transactions,
- expenses,
- local receipt PNG temporary files.

#### NFR-PRI-002 — Local Receipt Privacy

System shall keep receipt PNG local-only in MVP.

Acceptance:

- Receipt PNG is not uploaded by default.
- Temporary receipt cleanup exists.

### 5.5 Usability

#### NFR-USE-001 — Simple Indonesian Copy

System shall use simple Indonesian language.

Acceptance:

- Error/empty/offline states are understandable.

#### NFR-USE-002 — Minimal Onboarding Friction

System shall let user explore without heavy setup.

Acceptance:

- Sample data path exists.
- HPP does not block product creation.

#### NFR-USE-003 — Clear Coming Soon States

Desktop future modules shall be marked clearly as Coming Soon.

Acceptance:

- User understands feature is not active yet.

### 5.6 Maintainability

#### NFR-MAIN-001 — TypeScript

System shall use TypeScript for v2.

Acceptance:

- Domain types and local/cloud payloads are typed.

#### NFR-MAIN-002 — Modular Structure

System shall separate app/features/lib/types.

Acceptance:

- Code is not concentrated in one large file.

#### NFR-MAIN-003 — Stack Discipline

System shall follow TRD stack unless changed by approval.

Acceptance:

- No unapproved major library changes.

### 5.7 Portability

#### NFR-PORT-001 — PWA/Capacitor Readiness

System shall avoid design decisions that block future Capacitor wrapper.

Acceptance:

- Local storage/share approach works in browser and can be adapted to Capacitor.

---

## 6. Data Requirements

### 6.1 Core Entities

SRS requires the following logical entities:

- User/Profile
- Store
- Category
- Product/Menu
- Payment Method
- Transaction
- Transaction Item
- Expense Category
- Expense
- Receipt Asset
- Sync Queue
- Sync State
- Onboarding/Demo State

### 6.2 Data Ownership

All cloud operational data shall be associated with store ownership.

MVP:

- one owner user,
- one primary store,
- no staff access.

Future:

- store members and permissions may be added.

### 6.3 Data Retention

- Transaction data retained unless user deletes/cancels according to future policy.
- Receipt PNG retained locally only and temporary.
- Receipt PNG deleted after 14 days by default or after share if enabled.
- Old WarkopKuu v1 cloud data remains separate legacy data.

### 6.4 Data Migration

MVP v2 shall not auto-migrate old WarkopKuu cloud data.

Acceptance:

- v2 uses new schema/tables.
- legacy tables are not deleted automatically.

---

## 7. Sync Requirements

### 7.1 Local-First UI Source

UI shall read from local DB as primary render source for app operational area.

### 7.2 Cloud Source of Truth

For logged-in users, Supabase is canonical cloud source after sync completes.

### 7.3 Queue Requirements

Queue shall store:

- operation type,
- entity type,
- local ID,
- remote ID if available,
- payload,
- status,
- retry count,
- last error,
- timestamps.

### 7.4 Sync Statuses

Required statuses:

- pending,
- syncing,
- synced,
- failed,
- conflict.

### 7.5 Conflict Priority

MVP conflict priority:

1. checkout/stock conflict,
2. product update conflict,
3. expense/settings conflict.

---

## 8. Reporting Requirements

### 8.1 Dashboard Metrics

Required metrics:

- total sales,
- transaction count,
- total expenses,
- estimated profit,
- top products/menu,
- low stock,
- recent transactions.

### 8.2 Excel Export

Excel export shall include useful structured sheets.

Candidate sheets:

- Summary,
- Transactions,
- Transaction Items,
- Expenses,
- Products.

### 8.3 PDF Export

PDF shall be formatted as report-ready document.

Minimum content:

- Warungin/store header,
- report period,
- export timestamp,
- summary metrics,
- chart/visual snapshot if available,
- top products/menu,
- transaction/expense table summary,
- footer/branding.

---

## 9. Acceptance Criteria Summary

MVP v2 is acceptable when:

1. User can onboard with sample data.
2. User can register/login.
3. User can create/manage products with HPP optional-friendly.
4. User can make checkout locally.
5. Stock decreases locally.
6. Checkout syncs to cloud safely via hybrid/RPC strategy.
7. User can record expenses.
8. Dashboard shows meaningful metrics.
9. User can generate and share receipt PNG.
10. Receipt PNG retention works.
11. User can export CSV/Excel.
12. User can export PDF report-ready.
13. App remains usable for core flows while offline/unstable.
14. Pending sync completes when online.
15. RLS prevents cross-user access.
16. Desktop landing/login/dashboard minimal works.
17. Desktop export Excel/PDF works.
18. Advanced desktop features are clearly Coming Soon.
19. Build/lint/typecheck pass or known blockers documented.

---

## 10. Out of Scope for MVP v2

The following are not part of MVP v2 unless explicitly approved later:

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
- Marketplace/warehouse complex inventory.

---

## 11. Traceability Matrix

| Requirement Area | PRD | TRD | SRS Section |
|---|---|---|---|
| Rebrand/naming | PRD 5/8 | TRD 15 | SRS 1/2 |
| Auth/account | PRD 8/12 | TRD 6/9 | SRS 3.1 |
| Onboarding/demo | PRD 8/10/16 | TRD 11 | SRS 3.2 |
| Product/HPP | PRD 8/11/16 | TRD 6/15 | SRS 3.4 |
| POS checkout | PRD 8/10/12 | TRD 8/15 | SRS 3.5 |
| Offline sync | PRD 8/10/16 | TRD 7/8 | SRS 3.10/7 |
| RLS/security | PRD 13 | TRD 9 | SRS 5.3 |
| Receipt PNG | PRD 8/10/16 | TRD 10 | SRS 3.9 |
| Export Excel/PDF | PRD 8/12/16 | TRD 12 | SRS 3.14/8 |
| Desktop minimal | PRD 8/10/16 | TRD 12 | SRS 3.12 |
| Play Store future | PRD 8/15/16 | TRD 13 | SRS 5.7 |
| Scope exclusions | PRD 7/17 | TRD 17/19 | SRS 10 |

---

## 12. Open Items

Open items to resolve during Sprint 0 / technical reference step:

1. Final selected Excel export library.
2. Final selected PDF export approach/library.
3. Exact Dexie schema versioning approach.
4. Exact Supabase RPC payload contract for checkout.
5. Exact desktop dashboard route/layout split.
6. Exact chart library decision if report visuals require one.
7. Exact storage cleanup behavior for receipt PNG in browser vs Capacitor.

---

## 13. SRS Change Control

SRS must be updated when:

- functional requirements change,
- non-functional requirements change,
- MVP scope changes,
- export/reporting requirements change,
- sync behavior changes,
- desktop scope changes,
- security/privacy requirements change.

SRS does not need update for:

- small copy changes,
- minor visual polish,
- internal refactor that preserves behavior,
- bug fixes that do not alter requirements.
