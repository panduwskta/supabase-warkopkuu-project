# TRD — Warungin v2

**Status:** Draft v0.2 — decisions 1–5 locked  
**Product:** Warungin / Warungin POS  
**Related PRD:** `docs/PRD-Warungin-v2.md` v0.3 — scope decisions locked  
**Previous baseline:** WarkopKuu v1  
**Target:** Cloud-first, offline-capable, mobile-first POS for Indonesian UMKM  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Technical Summary

Warungin v2 adalah major technical upgrade dari WarkopKuu v1. Fokus utamanya bukan sekadar rebrand UI, tetapi membangun fondasi aplikasi POS yang:

- Cloud-first memakai Supabase sebagai source of truth.
- Offline-capable untuk operasional harian saat internet tidak stabil.
- Realtime secara lokal setelah user input data.
- Bisa sync kembali ke cloud saat koneksi tersedia.
- Mobile-first untuk app utama.
- Siap dikembangkan menjadi dashboard desktop dan Android Play Store app.

Existing WarkopKuu v1 masih sederhana: React/Vite single-file app, Supabase tables minimal (`menu_items`, `orders`, `expenses`), fallback localStorage, dan realtime cloud refresh. v2 membutuhkan pemisahan arsitektur, data model yang lebih eksplisit, local database, sync queue, dan schema Supabase baru/migrasi.

---

## 2. Current Baseline

### 2.1 Existing Stack

- React + Vite
- Supabase Auth + database
- CSS custom
- `localStorage` fallback jika Supabase env tidak tersedia
- Single main app file: `src/main.jsx`
- Existing SQL migration: `supabase/migrations/001_warkop_schema.sql`

### 2.2 Existing Cloud Tables

Current v1 tables:

- `menu_items`
- `orders`
- `expenses`

Current table structure is enough for v1, but not enough for v2 because:

- No explicit store table.
- No category table.
- No normalized transaction items table.
- Order items are stored as JSONB.
- No sync metadata.
- No HPP/modal field.
- No receipt asset metadata.
- No onboarding/demo state.
- No updated_at/deleted_at for conflict handling and soft delete.

### 2.3 Existing Strengths to Preserve

- Supabase Auth and per-user data isolation.
- Mobile-first app concept.
- Core POS flow.
- Dashboard, menu, transaction, expense foundation.
- WhatsApp receipt sharing concept.
- Vercel deploy simplicity.

### 2.4 Existing Technical Debt

- App logic mostly concentrated in `src/main.jsx`.
- Local mode is fallback, not true offline-first/online sync.
- localStorage is not enough for reliable offline POS data.
- No durable mutation queue.
- No conflict resolution strategy.
- No structured route/component separation.
- Existing SQL schema needs v2 migration, not patch-only extension.

---

## 3. Target Architecture

### 3.1 High-Level Architecture

```text
Warungin Mobile Web/PWA
  ├─ UI Layer: React components/routes
  ├─ Domain Layer: cashier, products, expenses, reports, onboarding
  ├─ Local Data Layer: IndexedDB/Dexie
  ├─ Sync Engine: mutation queue + pull/push sync
  ├─ Cloud Data Layer: Supabase Auth + Postgres + RLS
  └─ Share/Receipt Layer: PNG generation + Web Share API fallback

Future:
  ├─ Desktop Dashboard Web
  │   └─ Same Supabase source of truth + realtime/polling
  └─ Android App via Capacitor wrapper
      └─ Same web app build + native shell capabilities
```

### 3.2 Architecture Principles

1. **Cloud-first source of truth**  
   Supabase remains the canonical database for logged-in users.

2. **Local-first UX for daily operations**  
   User input must update local UI immediately, even before cloud sync finishes.

3. **Offline-capable, not offline-only**  
   App should continue working offline for core flows, then sync when online.

4. **Single-user MVP**  
   All schema must support owner/user isolation. Staff permission is deferred.

5. **Future desktop-ready**  
   Schema should avoid mobile-only assumptions so desktop dashboard can reuse it.

6. **Future Android-ready**  
   Avoid browser-only assumptions for sharing, local storage, and asset generation.

---

## 4. Recommended Tech Stack

### 4.1 Frontend

Recommended v2 stack:

- React + Vite
- TypeScript required for v2 refactor
- Tailwind CSS + shadcn/ui required for scalable mobile UI
- React Router for route separation
- Dexie.js for IndexedDB local database
- Supabase JS client
- html2canvas or modern DOM-to-image library for receipt PNG
- Web Share API for sharing receipt PNG/text
- Fallback download/copy text when Web Share is unavailable

### 4.2 Local Database

Use **IndexedDB via Dexie.js**.

Reason:

- More reliable than localStorage for transactional app data.
- Better query support for products, transactions, expenses.
- Suitable for offline mutation queue.
- Works in PWA and Capacitor WebView.
- Proven in KasirGratisan reference.

### 4.3 Cloud Database

Use **Supabase Postgres**.

Core requirements:

- RLS enabled on all user/store-owned tables.
- `updated_at`, `deleted_at`, `is_deleted`/soft delete fields where needed.
- UUID primary keys.
- Stable IDs usable for sync.
- Row ownership via `owner_user_id` and/or `store_id`.

### 4.4 Android Strategy

Recommended path:

1. Build stable web/PWA first.
2. Add PWA/service worker polish.
3. Wrap stable app with **Capacitor** for Play Store.
4. Keep Play Store stable release separate from beta/dev track.

Why Capacitor over TWA for current direction:

- Better control over Android app shell.
- Better future fit for file sharing receipt PNG.
- Better future fit for local/offline storage behavior.
- Easier native capability expansion later: camera barcode, notifications, file system, share sheet.
- Native rebuild from zero is not recommended for MVP because it slows validation.

TWA remains a comparison option in future, but not primary recommendation.

---

## 5. Project Structure Target

Recommended v2 structure:

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
  features/
    auth/
    onboarding/
    dashboard/
    cashier/
    products/
    transactions/
    expenses/
    reports/
    settings/
  lib/
    supabase.ts
    local-db.ts
    sync-engine.ts
    receipt.ts
    format.ts
    ids.ts
  styles/
    globals.css
  types/
    domain.ts
```

v2 should migrate to TypeScript immediately. This is required to make domain models, sync payloads, local DB schemas, and Supabase responses easier to validate and debug during vibecoding/development.

---

## 6. Data Model — Cloud

### 6.1 Ownership Model

MVP v2 is single-user, but should prepare store-based ownership.

Recommended model:

- `profiles` belongs to Supabase auth user.
- `stores` belongs to owner user.
- Operational data belongs to a store.
- RLS checks that the logged-in user owns the store.

This is slightly more complex than `user_id` on every row, but better for future:

- desktop dashboard
- staff access
- multi-store
- role permissions

For MVP, one user can have one default store.

### 6.2 Tables

#### `profiles`

```sql
id uuid primary key references auth.users(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
display_name text
email text
```

#### `stores`

```sql
id uuid primary key default gen_random_uuid()
owner_user_id uuid not null references auth.users(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
name text not null
business_type text -- warung, warkop, tempat_makan, toko, other
address text
phone text
receipt_footer text
theme_key text
onboarding_completed boolean not null default false
demo_data_seeded boolean not null default false
```

#### `categories`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
name text not null
color text
icon text
sort_order int not null default 0
is_deleted boolean not null default false
is_sample boolean not null default false
```

#### `products`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
category_id uuid references categories(id) on delete set null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
name text not null
price numeric not null check (price >= 0)
hpp numeric not null default 0 check (hpp >= 0)
stock numeric not null default 0
unit text not null default 'pcs'
sku text
barcode text
photo_url text
is_active boolean not null default true
is_deleted boolean not null default false
is_sample boolean not null default false
```

Notes:

- HPP is required in schema but default `0` so it does not block onboarding/trial.
- `is_sample` helps reset demo data.
- `stock` in MVP can remain direct product field, but stock movement table is recommended for audit future.

#### `payment_methods`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
name text not null
kind text not null -- cash, qris, transfer, ewallet, other
is_default boolean not null default false
is_active boolean not null default true
```

#### `transactions`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
receipt_number text not null
transaction_date timestamptz not null default now()
subtotal numeric not null default 0 check (subtotal >= 0)
discount_amount numeric not null default 0 check (discount_amount >= 0)
total numeric not null default 0 check (total >= 0)
payment_method_id uuid references payment_methods(id) on delete set null
payment_method_snapshot text
payment_amount numeric not null default 0 check (payment_amount >= 0)
change_amount numeric not null default 0
profit_estimate numeric not null default 0
status text not null default 'completed' -- completed, cancelled, future: open
notes text
is_deleted boolean not null default false
is_sample boolean not null default false
```

Constraints/indexes:

```sql
unique(store_id, receipt_number)
index(store_id, transaction_date desc)
index(store_id, status)
```

#### `transaction_items`

```sql
id uuid primary key default gen_random_uuid()
transaction_id uuid not null references transactions(id) on delete cascade
store_id uuid not null references stores(id) on delete cascade
product_id uuid references products(id) on delete set null
product_name_snapshot text not null
price_snapshot numeric not null default 0
hpp_snapshot numeric not null default 0
quantity numeric not null check (quantity > 0)
subtotal numeric not null default 0
profit_estimate numeric not null default 0
notes text
```

#### `expense_categories`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
name text not null
color text
icon text
is_default boolean not null default false
is_deleted boolean not null default false
is_sample boolean not null default false
```

#### `expenses`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
expense_category_id uuid references expense_categories(id) on delete set null
created_at timestamptz not null default now()
updated_at timestamptz not null default now()
deleted_at timestamptz
expense_date timestamptz not null default now()
title text not null
amount numeric not null check (amount >= 0)
notes text
is_deleted boolean not null default false
is_sample boolean not null default false
```

#### `receipts`

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
transaction_id uuid not null references transactions(id) on delete cascade
created_at timestamptz not null default now()
receipt_number text not null
share_text text
png_storage_path text
png_generated_at timestamptz
```

MVP note:

- Receipt PNG should be generated and stored locally only by default.
- Do not upload receipt PNG to Supabase Storage in MVP to avoid cloud storage cost/complexity.
- `receipts` table can be optional in MVP if PNG is generated on demand from transaction detail.
- Local receipt PNG should have retention policy: delete after successful share when possible, or auto-delete after 14 days.
- If uploaded later, use Supabase Storage with RLS.

#### `sync_events` — optional cloud audit

Not required for MVP, but useful later.

```sql
id uuid primary key default gen_random_uuid()
store_id uuid not null references stores(id) on delete cascade
created_at timestamptz not null default now()
client_id text
entity_type text not null
entity_id uuid
operation text not null
status text not null
payload jsonb
```

---

## 7. Data Model — Local IndexedDB

Use Dexie DB name candidate: `warungin-local-v2`.

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

### 7.2 Local Entity Fields

Every syncable local entity should have:

```ts
localId: string
remoteId?: string
storeId: string
createdAt: string
updatedAt: string
deletedAt?: string
syncStatus: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
lastSyncedAt?: string
isDeleted?: boolean
```

### 7.3 Sync Queue Fields

```ts
id: string
storeId: string
entityType: string
entityLocalId: string
entityRemoteId?: string
operation: 'create' | 'update' | 'delete'
payload: Record<string, unknown>
status: 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict'
retryCount: number
lastError?: string
createdAt: string
updatedAt: string
syncedAt?: string
```

### 7.4 Local Receipt Asset

```ts
id: string
transactionLocalId: string
transactionRemoteId?: string
receiptNumber: string
pngBlob?: Blob
pngDataUrl?: string
shareText: string
generatedAt: string
expiresAt?: string // default: generatedAt + 14 days
sharedAt?: string
autoDeleteAfterShare?: boolean
```

---

## 8. Sync Strategy

### 8.1 Required Behavior

- App reads from local DB for UI rendering.
- Online cloud data is pulled into local DB.
- User mutations write to local DB first.
- User mutations create a sync queue entry.
- Sync engine pushes queued mutations to Supabase when online.
- On successful push, local entity receives `remoteId`, `syncStatus=synced`, and `lastSyncedAt`.
- On failure, mutation remains in queue with `failed` status and retry metadata.

### 8.2 Initial Login Sync

Flow:

1. User logs in.
2. App ensures default store exists locally and/or cloud.
3. App pulls cloud data for store.
4. App merges cloud rows into local DB.
5. App pushes pending local mutations, if any.
6. App marks sync state as complete.

### 8.3 Anonymous Explore Mode

- Anonymous mode uses local DB only.
- Seed sample categories/products/expenses/transactions.
- No cloud sync until user chooses login/register.
- If user later creates account, app should ask whether to:
  - keep demo data as sample under account,
  - reset and start clean,
  - or migrate selected local data.

MVP recommendation: offer simple options only:

1. “Pakai data contoh dulu”
2. “Mulai dari kosong”

### 8.4 Conflict Handling MVP

Because MVP is single-user, conflicts are simpler but still possible from mobile + future desktop.

Recommended MVP rules:

- **Products/menu non-stock fields:** last-write-wins by `updated_at`, with local retry if cloud update fails.
- **Expenses:** append/update by ID; last-write-wins for edits.
- **Transactions:** append-only after checkout. Avoid editing completed transactions in MVP except soft delete/cancel.
- **Stock:** transaction stock deduction must be handled carefully.

### 8.5 Stock Sync Rule

MVP should avoid relying only on overwriting product stock from clients.

Recommended approach:

- Local checkout immediately reduces local product stock for UX.
- Transaction and transaction_items are queued.
- Sync push should call a Supabase RPC for checkout when online, or write transaction and update stock in a server-side transaction.
- If cloud stock is insufficient during sync, mark conflict and show user a resolution state.

Recommended RPC candidate:

```sql
create function create_transaction_with_stock_update(payload jsonb)
returns uuid
```

RPC responsibilities:

- Validate authenticated user owns store.
- Validate product stock if stock tracking enabled.
- Insert transaction.
- Insert transaction items.
- Decrement stock atomically.
- Return transaction ID.

MVP fallback if RPC is too heavy:

- Insert transaction + items.
- Update stock with guarded update.
- If any update fails, mark sync conflict.

But RPC is preferred for correctness.

### 8.6 Sync Status UI

Minimum UI states:

- `Tersimpan di perangkat`
- `Menunggu sinkronisasi`
- `Sedang sinkronisasi`
- `Sudah tersinkron`
- `Gagal sinkron — coba lagi`
- `Butuh pengecekan stok` for conflicts

---

## 9. Supabase RLS Strategy

### 9.1 RLS Principle

All store-owned rows must only be readable/writable by the store owner in MVP.

### 9.2 Policy Pattern

For tables with `store_id`:

```sql
exists (
  select 1 from stores
  where stores.id = table.store_id
  and stores.owner_user_id = auth.uid()
)
```

### 9.3 Store Policy

For `stores`:

```sql
owner_user_id = auth.uid()
```

### 9.4 Future Staff Access

Do not hard-code policies in a way that prevents future staff access. Future v2.2 can add:

- `store_members`
- role/permission columns
- policy helper functions like `can_access_store(store_id)`

---

## 10. Receipt PNG & Sharing

### 10.1 Receipt Generation

Receipt should be rendered as a React component, then converted to PNG.

Recommended options:

- `html2canvas`
- `dom-to-image-more`
- browser canvas-based renderer

MVP recommendation: use `html2canvas` or `dom-to-image-more`, test on mobile browsers.

### 10.2 Share Flow

1. Checkout completed locally.
2. Receipt component renders hidden/visible preview.
3. App generates PNG blob.
4. App stores PNG locally as temporary receipt asset.
5. App prepares share text:
   - store name
   - receipt number
   - total
   - short thank you
6. Use Web Share API with file if supported.
7. If share succeeds and user enables auto-delete-after-share, delete temporary PNG asset.
8. Fallback:
   - download PNG
   - copy WhatsApp text
   - open WhatsApp URL with text only

### 10.3 Local Receipt Retention

Receipt PNG storage policy for MVP:

- Store receipt PNG locally only.
- Default retention: auto-delete after 14 days.
- Optional setting later: delete after successful share/send.
- Receipt transaction data remains in database; only generated PNG asset is deleted.
- User should still be able to regenerate receipt PNG from transaction detail after local PNG is deleted.

Storage note:

- Browser/Android WebView storage quota varies by device, browser, available disk, and engagement.
- Do not assume a fixed 10 GB quota for all users.
- Warungin should keep receipt PNG temporary and regeneratable, not as permanent source of truth.

### 10.4 Android/Capacitor Future

When wrapped with Capacitor:

- Use Capacitor Share plugin if Web Share API is insufficient.
- Consider Filesystem plugin for temporary receipt PNG.

---

## 11. Onboarding & Demo Data

### 11.1 Onboarding Steps

1. Welcome to Warungin.
2. Select business type:
   - Warung
   - Warkop
   - Tempat makan
   - Toko kecil
   - Lainnya
3. Select visual/theme preference.
4. Choose mode:
   - Login/register and sync cloud.
   - Explore anonymously with sample data.
5. Seed sample data.
6. Show dashboard/kasir.

### 11.2 Demo Seed Data

Seed should include:

- 3–5 categories
- 8–15 products
- HPP values partially filled or 0 for education
- sample expenses
- optional sample transactions
- payment methods: Tunai, QRIS, Transfer

### 11.3 Reset Demo Data

Settings should include:

- Reset sample data
- Start from empty data

Safety:

- Show confirmation.
- Only remove `is_sample=true` rows unless user chooses full reset.

---

## 12. Desktop Dashboard Foundation

Desktop dashboard is not MVP core implementation, but v2 schema must support it.

### 12.1 Dashboard Future Use Cases

- Update product/menu data from desktop.
- Update stock more comfortably.
- Add missed expenses/bookkeeping.
- Review reports.
- Export data.

### 12.2 Technical Requirements

- Same Supabase project and schema.
- Same auth account.
- Store-based ownership.
- Realtime or near-realtime sync to mobile local DB.
- Conflict handling for stock and product edits.

### 12.3 Recommendation

Do not build full desktop dashboard inside MVP mobile sprint. Prepare schema and routes so future dashboard can share domain types and Supabase access.

---

## 13. Android / Play Store Technical Strategy

### 13.1 Recommended Path

1. Web/PWA MVP stable.
2. Add service worker and manifest polish.
3. Validate offline/local sync behavior in browser.
4. Add Capacitor Android project.
5. Test same app in Android WebView.
6. Prepare Play Store assets and privacy docs.
7. Release internal testing.
8. Release production after stability.

### 13.2 Capacitor Requirements Later

- App ID/package candidate: `id.takisagency.warungin` or similar.
- App name: Warungin.
- Android signing key.
- Internal testing track.
- Privacy Policy URL.
- Data Safety answers.
- App screenshots.
- Feature graphic.
- Contact email.

### 13.3 Stable vs Beta Principle

The Play Store stable app should remain usable while development continues.

Recommended:

- Use production Supabase project for stable app.
- Use separate staging Supabase project for beta/testing if needed.
- Use Play Console internal/closed testing tracks for beta builds.
- Do not push experimental sync changes directly to production app without migration/testing.

---

## 14. Migration Plan

### 14.1 Migration from WarkopKuu v1 to Warungin v2

Current v1 schema should not be deleted immediately.

Recommended migration path:

1. Add new v2 tables in new migration: `002_warungin_v2_schema.sql`.
2. Keep old v1 tables available during transition as separate legacy data.
3. Implement app v2 reading/writing new tables only.
4. Do not auto-migrate old WarkopKuu cloud data in MVP.
5. Optional legacy import/export can be considered later if needed.
6. After stable release, decide whether to archive old tables.

### 14.2 Local Storage Migration

Existing localStorage key: `warkopkuu_local_v1`.

MVP approach:

- Do not auto-migrate anonymous localStorage unless necessary.
- If detected, offer user a choice:
  - import old local demo data,
  - ignore and start fresh.

---

## 15. Implementation Phases

### Phase 0 — Technical Preparation

- Migrate v2 codebase to TypeScript with structured modules.
- Add app folder structure.
- Add local DB library.
- Add Supabase v2 schema migration draft.
- Add design token/theme foundation.

### Phase 1 — Rebrand & Architecture Split

- Rename UI copy WarkopKuu → Warungin.
- Update receipt prefix from `WKK` to default `WRG`, with optional custom prefix in Settings later.
- Split `main.jsx` into feature modules/routes.
- Introduce app providers.
- Preserve current feature parity.

### Phase 2 — Data Model & Local DB

- Implement IndexedDB/Dexie schema.
- Implement local repository functions.
- Render UI from local DB.
- Seed demo data.
- Add onboarding state.

### Phase 3 — Cloud Sync

- Implement Supabase v2 schema.
- Implement initial pull.
- Implement mutation queue.
- Implement push sync.
- Add sync status UI.
- Add retry handling.

### Phase 4 — Core POS v2

- Product/menu management with HPP.
- Cashier checkout.
- Atomic stock handling/RPC.
- Transaction history.
- Expense tracking.
- Dashboard metrics.

### Phase 5 — Receipt PNG & Sharing

- Receipt component.
- PNG generation.
- Web Share API.
- WhatsApp text fallback.

### Phase 6 — Hardening

- RLS tests/manual verification.
- Offline/online scenario tests.
- Mobile responsive QA.
- Build/lint cleanup.
- Deployment checklist.

### Phase 7 — Play Store Preparation Later

- PWA manifest/service worker polish.
- Capacitor wrapper.
- Android internal testing.
- Privacy Policy/Data Safety.

---

## 16. Testing Strategy

### 16.1 Build & Static Checks

- `npm run build`
- `npm run lint`
- Typecheck TypeScript.

### 16.2 Manual QA — Core Flow

- Register/login.
- Onboarding with sample data.
- Add product without HPP.
- Add/update HPP later.
- Checkout transaction.
- Stock decreases locally.
- Receipt PNG generated.
- Share receipt.
- Add expense.
- Dashboard updates.
- Transaction history detail works.

### 16.3 Manual QA — Offline Flow

- Login and load data while online.
- Turn off internet.
- Create transaction.
- Create expense.
- Update product/stock.
- Confirm UI updates locally.
- Confirm sync status pending.
- Restore internet.
- Confirm sync completes.
- Confirm cloud data visible after refresh/other device.

### 16.4 Manual QA — Conflict Flow

- Simulate stock changed in cloud while mobile offline.
- Checkout locally with stale stock.
- Restore internet.
- Confirm conflict state appears if cloud stock insufficient.
- Confirm user can resolve or retry.

### 16.5 RLS Verification

- User A cannot read User B store/products/transactions/expenses.
- User A cannot update/delete User B rows.
- RPC checkout rejects unauthorized store ID.

---

## 17. Risks & Mitigation

### Risk 1 — Offline sync complexity grows too large

Mitigation:

- Keep MVP single-user.
- Make transactions append-only.
- Avoid Open Bill in v2.
- Add conflict UI only for critical stock cases.

### Risk 2 — Stock conflicts create user confusion

Mitigation:

- Local UI clearly shows pending sync.
- Use server-side RPC for checkout when online.
- Keep conflict copy simple: “Stok cloud berbeda, perlu dicek.”

### Risk 3 — Receipt PNG/share inconsistent across browsers

Mitigation:

- Test early on Android Chrome.
- Provide fallback download/copy text.
- Use Capacitor Share plugin later.

### Risk 4 — Schema migration breaks existing v1 data

Mitigation:

- Add v2 tables separately.
- Keep old tables during transition.
- Migration script optional and reversible.

### Risk 5 — Play Store submission delayed by policy/assets

Mitigation:

- Prepare Privacy Policy and Data Safety early.
- Keep permissions minimal.
- Delay Play Store submission until web/PWA stable.

---

## 18. Open Technical Questions

1. Will v2 migrate to TypeScript immediately or stay JavaScript for speed? **Answered:** migrate to TypeScript immediately.
2. Should v2 use Tailwind/shadcn or continue custom CSS initially? **Answered:** use Tailwind CSS + shadcn/ui.
3. Should receipt PNG be stored locally only or uploaded to Supabase Storage? **Answered:** store locally only in MVP; auto-delete after successful share when possible or after 14 days by default.
4. What is the final receipt prefix: `WRG`, `WRN`, or another prefix? **Answered:** default `WRG`; user can customize prefix later from Settings using the same format.
5. Should old WarkopKuu cloud data be auto-migrated or left as separate legacy data? **Answered:** keep old cloud data as separate legacy data; no auto-migration in MVP.
6. Should cloud sync use direct table operations first, or RPC-first for all mutations? **Pending explanation/decision.**
7. How much desktop dashboard foundation should be implemented in v2 vs only schema-ready? **Pending explanation/decision.**

---

## 19. Recommended Technical Decisions

For fastest safe path:

1. Move v2 to TypeScript immediately.
2. Use Tailwind CSS + shadcn/ui for UI foundation.
3. Use Dexie for IndexedDB.
4. Use Supabase as cloud source of truth.
5. Add v2 schema as new tables instead of mutating v1 tables heavily.
6. Keep old WarkopKuu cloud data as separate legacy data; no auto-migration in MVP.
7. Use local DB as UI source, not Supabase response directly.
8. Start sync with simple queue and last-write-wins for non-stock entities, pending final answer for direct operations vs RPC-first.
9. Use RPC/server-side transaction for checkout + stock update unless final sync strategy changes.
10. Keep Open Bill out of MVP v2.
11. Generate receipt PNG locally only; do not upload to Supabase Storage in MVP.
12. Auto-delete local receipt PNG after successful share when enabled, or after 14 days by default.
13. Use receipt prefix `WRG` by default and allow optional customization in Settings with same format.
14. Prepare for Capacitor after web/PWA core is stable.

---

## 20. Acceptance Criteria TRD

TRD is ready for implementation planning when:

- Supabase v2 schema is approved.
- Local IndexedDB/Dexie approach is approved.
- Sync strategy is accepted for MVP.
- Stock conflict rule is accepted.
- Receipt PNG/share approach is accepted.
- Android strategy direction is accepted.
- Open technical questions are answered or assigned to implementation discovery.
