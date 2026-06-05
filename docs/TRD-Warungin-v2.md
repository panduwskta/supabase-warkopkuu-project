# TRD — Warungin v2

**Status:** Draft v0.4 — English-first baseline  
**Product:** Warungin / Warungin POS  
**Related PRD:** `docs/PRD-Warungin-v2.md` v0.5  
**Related SRS:** `docs/SRS-Warungin-v2.md`  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Technical Summary

Warungin v2 is a major technical upgrade from WarkopKuu v1. The system must support a cloud-first but offline-capable POS workflow for Indonesian UMKM users.

Core technical goals:

- Supabase remains the cloud source of truth.
- IndexedDB/Dexie becomes the local operational data store.
- UI reads primarily from local DB for fast and offline-capable UX.
- Local mutations are queued and synced to cloud.
- Simple entities use direct table operations.
- Checkout + stock updates use RPC/server-side transactions.
- The codebase moves to TypeScript.
- UI foundation uses Tailwind CSS + shadcn/ui.
- Desktop dashboard minimal supports basic reports and Excel/PDF export.
- Future Android Play Store distribution uses Capacitor after web/PWA stability.

---

## 2. Current Baseline

### 2.1 Existing Stack

WarkopKuu v1 currently uses:

- React + Vite.
- Supabase Auth + database.
- Custom CSS.
- `localStorage` fallback when Supabase env is unavailable.
- Single main app file: `src/main.jsx`.
- Existing SQL migration: `supabase/migrations/001_warkop_schema.sql`.

### 2.2 Existing Cloud Tables

Current v1 tables:

- `menu_items`.
- `orders`.
- `expenses`.

Limitations:

- No explicit store table.
- No category table.
- No normalized transaction items table.
- Order items are stored as JSONB.
- No sync metadata.
- No HPP/modal field.
- No receipt asset metadata.
- No onboarding/demo state.
- No `updated_at` / `deleted_at` for conflict handling and soft delete.

### 2.3 Technical Debt

- App logic is concentrated in `src/main.jsx`.
- Local mode is fallback, not true offline-capable sync.
- `localStorage` is not reliable enough for POS operational data.
- No durable mutation queue.
- No conflict handling.
- No structured feature/module separation.
- v2 should use new schema tables rather than heavily mutating v1 tables.

---

## 3. Target Architecture

```text
Warungin Web/PWA
  ├─ UI Layer: React routes/components
  ├─ Feature Layer: auth, onboarding, cashier, products, expenses, reports
  ├─ Domain Types: TypeScript models and payload contracts
  ├─ Local Data Layer: IndexedDB via Dexie
  ├─ Sync Engine: mutation queue + pull/push sync
  ├─ Cloud Layer: Supabase Auth + Postgres + RLS + RPC
  ├─ Reporting Layer: Excel/PDF export
  └─ Receipt Layer: PNG generation + share fallback

Future Runtime
  ├─ Desktop Dashboard Web
  └─ Android App via Capacitor wrapper
```

### 3.1 Architecture Principles

1. **Cloud-first source of truth** — Supabase is canonical after sync.
2. **Local-first UX** — operational UI updates immediately from local DB.
3. **Offline-capable, not offline-only** — offline works for core flows, then syncs.
4. **Single-user MVP** — staff/permissions deferred.
5. **Store-based ownership** — prepares future staff/multi-store.
6. **Small, reviewable implementation phases** — follow DOR/SRD operating rules.

---

## 4. Recommended Stack

### 4.1 Frontend

Required:

- React + Vite.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- React Router.
- Supabase JS client.
- Dexie.js.

Candidates requiring final approval during Sprint 0:

- Excel export: SheetJS (`xlsx`) or equivalent.
- PDF export: `jspdf` + `jspdf-autotable`, or a better proven client-side PDF approach.
- Receipt PNG: `html2canvas`, `dom-to-image-more`, or equivalent.
- Charts: only add a charting library after confirming PDF/dashboard needs.

### 4.2 Local Database

Use **IndexedDB via Dexie.js**.

Rationale:

- More reliable than localStorage for transactional/offline data.
- Supports structured queries.
- Works in browser/PWA and Capacitor WebView.
- Suitable for mutation queue and local sync state.

### 4.3 Cloud Database

Use **Supabase Postgres**.

Requirements:

- RLS enabled on all user/store-owned tables.
- UUID primary keys.
- `created_at`, `updated_at`, `deleted_at` where needed.
- Soft delete for important historical entities.
- Store-based ownership.
- RPC/server-side transaction for checkout + stock safety.

### 4.4 Android Strategy

Recommended path:

1. Stabilize web/PWA.
2. Validate offline sync behavior in browser.
3. Add Capacitor wrapper.
4. Test Android WebView behavior.
5. Prepare Play Store internal testing.
6. Submit only after product stability.

Capacitor is preferred over TWA because it gives better control over:

- app shell,
- local storage behavior,
- share sheet/file sharing,
- future native capabilities.

---

## 5. Project Structure Target

```text
src/
  app/
    App.tsx
    routes.tsx
    providers.tsx
  components/
    layout/
    ui/
    receipt/
    sync/
    reports/
  features/
    auth/
    onboarding/
    dashboard/
    cashier/
    products/
    transactions/
    expenses/
    reports/
    desktop/
    settings/
  lib/
    supabase.ts
    local-db.ts
    sync-engine.ts
    receipt.ts
    export-excel.ts
    export-pdf.ts
    format.ts
    ids.ts
  types/
    domain.ts
    sync.ts
    reports.ts
  styles/
    globals.css
```

v2 should migrate to TypeScript immediately so domain models, sync payloads, local DB schemas, and Supabase responses are easier to validate and debug.

---

## 6. Cloud Data Model

### 6.1 Ownership Model

MVP uses single-user ownership, but schema should be store-based for future readiness.

Recommended model:

- `profiles` belongs to Supabase auth user.
- `stores` belongs to owner user.
- Operational rows belong to `store_id`.
- RLS validates that `auth.uid()` owns the store.

### 6.2 Core Tables

#### `profiles`

- `id uuid primary key references auth.users(id)`
- `created_at timestamptz`
- `updated_at timestamptz`
- `display_name text`
- `email text`

#### `stores`

- `id uuid primary key`
- `owner_user_id uuid references auth.users(id)`
- `name text not null`
- `business_type text`
- `address text`
- `phone text`
- `receipt_footer text`
- `receipt_prefix text default 'WRG'`
- `theme_key text`
- `onboarding_completed boolean default false`
- `demo_data_seeded boolean default false`
- timestamps + optional soft delete fields

#### `categories`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `color text`
- `icon text`
- `sort_order int`
- `is_deleted boolean default false`
- `is_sample boolean default false`
- timestamps + soft delete fields

#### `products`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `category_id uuid references categories(id)`
- `name text not null`
- `price numeric not null check >= 0`
- `hpp numeric not null default 0 check >= 0`
- `stock numeric not null default 0`
- `unit text default 'pcs'`
- `sku text`
- `barcode text`
- `photo_url text`
- `is_active boolean default true`
- `is_deleted boolean default false`
- `is_sample boolean default false`
- timestamps + soft delete fields

#### `payment_methods`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `kind text not null` (`cash`, `qris`, `transfer`, `ewallet`, `other`)
- `is_default boolean`
- `is_active boolean`
- timestamps

#### `transactions`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `receipt_number text not null`
- `transaction_date timestamptz default now()`
- `subtotal numeric default 0`
- `discount_amount numeric default 0`
- `total numeric default 0`
- `payment_method_id uuid references payment_methods(id)`
- `payment_method_snapshot text`
- `payment_amount numeric default 0`
- `change_amount numeric default 0`
- `profit_estimate numeric default 0`
- `status text default 'completed'`
- `notes text`
- `is_deleted boolean default false`
- `is_sample boolean default false`
- timestamps + soft delete fields

Recommended constraints/indexes:

- `unique(store_id, receipt_number)`.
- index on `(store_id, transaction_date desc)`.
- index on `(store_id, status)`.

#### `transaction_items`

- `id uuid primary key`
- `transaction_id uuid references transactions(id)`
- `store_id uuid references stores(id)`
- `product_id uuid references products(id)`
- `product_name_snapshot text not null`
- `price_snapshot numeric not null default 0`
- `hpp_snapshot numeric not null default 0`
- `quantity numeric not null check > 0`
- `subtotal numeric not null default 0`
- `profit_estimate numeric not null default 0`
- `notes text`

#### `expense_categories`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `name text not null`
- `color text`
- `icon text`
- `is_default boolean default false`
- `is_deleted boolean default false`
- `is_sample boolean default false`
- timestamps + soft delete fields

#### `expenses`

- `id uuid primary key`
- `store_id uuid references stores(id)`
- `expense_category_id uuid references expense_categories(id)`
- `expense_date timestamptz default now()`
- `title text not null`
- `amount numeric not null check >= 0`
- `notes text`
- `is_deleted boolean default false`
- `is_sample boolean default false`
- timestamps + soft delete fields

### 6.3 Optional/Future Tables

#### `receipts`

Receipt PNG is local-only in MVP. A `receipts` table is optional and should only store metadata if needed. Do not upload PNG to Supabase Storage in MVP.

#### `sync_events`

Optional future audit table for sync diagnostics. Not required for MVP.

---

## 7. Local IndexedDB Model

Dexie DB name candidate: `warungin-local-v2`.

### 7.1 Local Tables

- `profiles`
- `stores`
- `categories`
- `products`
- `paymentMethods`
- `transactions`
- `transactionItems`
- `expenseCategories`
- `expenses`
- `receiptAssets`
- `syncQueue`
- `syncState`
- `onboardingState`

### 7.2 Syncable Entity Fields

All syncable local entities should include:

```ts
localId: string;
remoteId?: string;
storeId: string;
createdAt: string;
updatedAt: string;
deletedAt?: string;
syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
lastSyncedAt?: string;
isDeleted?: boolean;
```

### 7.3 Sync Queue Fields

```ts
id: string;
storeId: string;
entityType: string;
entityLocalId: string;
entityRemoteId?: string;
operation: 'create' | 'update' | 'delete';
payload: Record<string, unknown>;
status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';
retryCount: number;
lastError?: string;
createdAt: string;
updatedAt: string;
syncedAt?: string;
```

### 7.4 Local Receipt Asset

```ts
id: string;
transactionLocalId: string;
transactionRemoteId?: string;
receiptNumber: string;
pngBlob?: Blob;
pngDataUrl?: string;
shareText: string;
generatedAt: string;
expiresAt?: string; // default: generatedAt + 14 days
sharedAt?: string;
autoDeleteAfterShare?: boolean;
```

---

## 8. Sync Strategy

### 8.1 Required Behavior

- UI reads from local DB.
- Cloud data is pulled into local DB after login.
- User mutations write to local DB first.
- Mutations create sync queue entries.
- Sync engine pushes queued mutations to Supabase when online.
- Successful push marks local entity as synced.
- Failed push records retry/error state.

### 8.2 Anonymous Mode

- Anonymous exploration uses local DB only.
- No cloud sync until user logs in/registers.
- Sample data is marked with `is_sample`.
- User can reset sample data.

### 8.3 Hybrid Cloud Write Strategy

Final MVP decision: use a **hybrid strategy**.

Direct table operations for:

- products,
- categories,
- expenses,
- payment methods,
- settings,
- onboarding/demo state.

RPC/server-side transaction for:

- checkout,
- transaction creation,
- transaction items,
- stock deduction.

Rationale:

- Keeps simple data flows easy to build.
- Protects the most critical operational flow from partial saves.
- Reduces technical bugs during daily use.

### 8.4 Checkout RPC Candidate

RPC candidate:

```sql
create function create_transaction_with_stock_update(payload jsonb)
returns uuid
```

Responsibilities:

- Validate authenticated user owns store.
- Validate product stock.
- Insert transaction.
- Insert transaction items.
- Decrement stock atomically.
- Return transaction ID.

### 8.5 Conflict Handling MVP

- Non-stock entities: last-write-wins by `updated_at`.
- Transactions: append-only after checkout when possible.
- Stock conflict: mark as conflict and show clear resolution state.

### 8.6 Sync Status UI

Minimum states:

- Saved on device.
- Waiting for sync.
- Syncing.
- Synced.
- Sync failed — retry.
- Stock needs review / conflict.

---

## 9. Supabase RLS Strategy

### 9.1 Principle

All cloud operational rows must be accessible only by the store owner in MVP.

### 9.2 Policy Pattern

For store-owned tables:

```sql
exists (
  select 1
  from stores
  where stores.id = table.store_id
    and stores.owner_user_id = auth.uid()
)
```

For `stores`:

```sql
owner_user_id = auth.uid()
```

### 9.3 Future Staff Access

Avoid hard-coding policies in a way that blocks future roles. Future v2.2 may introduce:

- `store_members`.
- roles/permissions.
- helper functions such as `can_access_store(store_id)`.

---

## 10. Receipt PNG & Sharing

### 10.1 Generation

Receipt should be a React component converted to PNG.

Candidate libraries:

- `html2canvas`.
- `dom-to-image-more`.
- equivalent proven DOM-to-image solution.

### 10.2 Share Flow

1. Checkout completes locally.
2. Receipt component renders.
3. App generates PNG blob.
4. App stores PNG locally as temporary receipt asset.
5. App prepares share text.
6. Web Share API shares PNG if supported.
7. Fallback: download PNG, copy text, or open WhatsApp text URL.
8. PNG is deleted after successful share if enabled/possible or after 14 days by default.

### 10.3 Retention Policy

- Store receipt PNG locally only.
- Do not upload to cloud in MVP.
- Default retention: 14 days.
- Receipt transaction data remains permanent.
- Receipt PNG can be regenerated from transaction detail.

Storage note:

- Browser storage quota varies by device/browser/available disk.
- Do not assume fixed 10 GB storage.
- Receipt PNG should be temporary, not source of truth.

---

## 11. Onboarding & Demo Data

### 11.1 Onboarding Steps

1. Welcome screen.
2. Select business type.
3. Select theme/preference.
4. Choose login/register or anonymous exploration.
5. Seed sample data.
6. Enter dashboard/cashier.

### 11.2 Demo Seed Data

Seed should include:

- 3–5 categories.
- 8–15 products.
- Some HPP values and some HPP = 0.
- Sample expenses.
- Optional sample transactions.
- Payment methods: Cash, QRIS, Transfer.

### 11.3 Reset Demo Data

Settings should support:

- Reset sample data.
- Start from empty data.

Safety:

- Confirmation required.
- Only remove `is_sample=true` rows unless user explicitly chooses full reset.

---

## 12. Desktop Dashboard Minimal

Desktop dashboard v2 uses **Option B**: landing page + simple desktop login + basic reporting dashboard.

### 12.1 Use Cases

- User opens public landing page.
- User logs in with same Warungin account.
- User views basic cloud reports:
  - total sales,
  - transaction count,
  - total expenses,
  - estimated profit,
  - top products/menu,
  - period summary.
- User exports Excel/PDF.
- Future managerial modules appear as Coming Soon.

### 12.2 Out of Scope

- Full stock management from desktop.
- Full bookkeeping/editorial backfill flows.
- Multi-user/staff management.
- Advanced report builder.
- Full CRUD for operational data.

### 12.3 Export Requirements

#### Excel

- Export `.xlsx`.
- Include summary sheet and detail sheets where useful.
- Candidate: SheetJS (`xlsx`).

#### PDF

PDF must be report-ready, not a raw table dump.

Minimum sections:

- Warungin/store header.
- Report title and period.
- Export timestamp.
- Summary metrics.
- Chart/visual snapshot if available.
- Top products/menu table.
- Transaction/expense summary table.
- Footer/branding.

Candidate implementation:

- Client-side: `jspdf` + `jspdf-autotable`.
- Later option: server/edge-rendered PDF if client quality is insufficient.

---

## 13. Android / Play Store Strategy

### 13.1 Recommended Path

1. Build stable web/PWA.
2. Validate local/offline sync.
3. Add Capacitor Android project.
4. Test Android WebView.
5. Prepare Play Store assets and privacy docs.
6. Release internal testing.
7. Release production after stability.

### 13.2 Requirements Later

- App ID/package candidate: `id.takisagency.warungin`.
- App name: Warungin.
- Android signing key.
- Internal testing track.
- Privacy Policy URL.
- Data Safety answers.
- App screenshots.
- Feature graphic.
- Contact email.

### 13.3 Stable vs Beta Principle

- Stable Play Store app must remain usable while development continues.
- Use staging Supabase/project for beta if needed.
- Use Play Console internal/closed testing tracks.
- Do not push experimental sync changes directly to production app.

---

## 14. Migration Plan

### 14.1 Cloud Migration

Recommended path:

1. Add new v2 tables in `002_warungin_v2_schema.sql`.
2. Keep old v1 tables as separate legacy data.
3. App v2 reads/writes new tables only.
4. No automatic migration from old WarkopKuu cloud data in MVP.
5. Optional legacy import/export can be considered later.

### 14.2 Local Storage Migration

Existing localStorage data should not be auto-migrated unless explicitly needed.

If detected, offer later:

- import old local demo data,
- ignore and start fresh.

---

## 15. Implementation Phases

### Phase 0 — Technical Reference

- Review framework-specific best practices.
- Confirm export/PDF/receipt libraries.
- Confirm Dexie schema pattern.
- Confirm Supabase RLS/RPC pattern.

### Phase 1 — TypeScript & Structure

- Move app foundation to TypeScript.
- Create app/feature/lib/types structure.

### Phase 2 — UI Foundation

- Tailwind setup.
- shadcn/ui setup.
- Warungin design tokens.

### Phase 3 — Supabase v2 Schema

- New migration.
- RLS policies.
- Checkout RPC draft.

### Phase 4 — Local DB

- Dexie schema.
- Local repositories.
- Demo/onboarding local state.

### Phase 5 — Core Mobile Features

- Products/HPP.
- Cashier/cart/checkout local.
- Transactions.
- Expenses.
- Dashboard.

### Phase 6 — Sync Engine

- Pull cloud to local.
- Push queue.
- Sync status.
- Retry/failure/conflict basics.
- Checkout RPC integration.

### Phase 7 — Receipt & Reporting

- Receipt PNG.
- Share flow.
- Excel export.
- PDF report-ready export.

### Phase 8 — Desktop Minimal

- Landing page.
- Desktop login.
- Basic dashboard.
- Excel/PDF export.
- Coming Soon nav.

### Phase 9 — Hardening

- Build/lint/typecheck.
- RLS verification.
- Offline/online QA.
- Export QA.
- Mobile responsive QA.

### Phase 10 — Play Store Later

- PWA polish.
- Capacitor wrapper.
- Android internal testing.
- Privacy Policy/Data Safety.

---

## 16. Testing Strategy

### 16.1 Static/Build Checks

- `npm run build`.
- `npm run lint`.
- TypeScript typecheck.

### 16.2 Manual QA — Core Flow

- Register/login.
- Onboarding with sample data.
- Add product without HPP.
- Add/update HPP later.
- Checkout transaction.
- Confirm stock decreases.
- Generate/share receipt PNG.
- Add expense.
- Confirm dashboard updates.
- Export Excel/PDF.

### 16.3 Manual QA — Offline Flow

- Load data online.
- Turn off internet.
- Create transaction/expense/product update.
- Confirm local UI updates.
- Confirm pending sync status.
- Restore internet.
- Confirm sync completes.

### 16.4 Manual QA — Conflict Flow

- Simulate stale local stock.
- Checkout offline.
- Change cloud stock separately.
- Restore internet.
- Confirm conflict state appears.

### 16.5 RLS Verification

- User A cannot read/write User B data.
- Checkout RPC rejects unauthorized store ID.

---

## 17. Risks & Mitigations

### Risk 1 — Offline Sync Complexity

Mitigation:

- Single-user MVP.
- No Open Bill.
- Simple last-write-wins for non-stock entities.
- RPC for checkout/stock.

### Risk 2 — Stock Conflicts

Mitigation:

- Show clear sync/conflict state.
- Use server-side transaction.
- Keep conflict copy simple.

### Risk 3 — Receipt PNG/Share Inconsistency

Mitigation:

- Test early on Android Chrome.
- Provide fallback download/copy text.
- Use Capacitor Share plugin later if needed.

### Risk 4 — PDF Export Quality

Mitigation:

- Start with proven client-side PDF library.
- Keep report layout simple.
- Consider server-rendered PDF later if quality is insufficient.

### Risk 5 — Legacy Data Confusion

Mitigation:

- Keep v1 data separate.
- Do not auto-migrate in MVP.
- Explain if legacy import is added later.

---

## 18. Open Technical Items

To be resolved in Sprint 0:

1. Final Excel export library.
2. Final PDF export approach/library.
3. Final receipt PNG library.
4. Final chart library decision, if any.
5. Exact Dexie schema versioning approach.
6. Exact checkout RPC payload contract.
7. Exact desktop route/layout split.

---

## 19. Locked Technical Decisions

1. TypeScript migration is required.
2. Tailwind CSS + shadcn/ui are required.
3. Dexie is the local DB choice.
4. Supabase remains cloud source of truth.
5. New v2 schema tables; v1 tables remain legacy.
6. Local DB is primary UI read source for operational app.
7. Hybrid write strategy.
8. RPC/server-side transaction for checkout + stock.
9. Receipt PNG local-only.
10. Receipt PNG retention: delete after share if enabled/possible, or after 14 days.
11. Default receipt prefix: `WRG`.
12. Desktop dashboard minimal is in v2 scope.
13. Capacitor is recommended after web/PWA stability.

---

## 20. TRD Acceptance Criteria

TRD is ready for implementation planning when:

- Supabase v2 schema is approved.
- Dexie/local DB approach is approved.
- Sync strategy is accepted.
- Checkout RPC approach is accepted.
- Receipt PNG approach is accepted.
- Export Excel/PDF approach is selected.
- Desktop minimal scope is accepted.
- Android direction is accepted.
