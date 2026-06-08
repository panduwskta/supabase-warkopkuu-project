# Warungin v2 — Kasir Warung UMKM

Warungin v2 adalah app POS mobile-first untuk warung/kedai/UMKM Indonesia dengan login, onboarding, menu/HPP/stok, kasir/POS, transaksi, pengeluaran, dashboard, receipt PNG/share, dan export laporan.

## Status

Branch `develop` adalah jalur Warungin v2 major update.

Catatan penting:

- `main` tetap legacy-safe untuk WarkopKuu v1.
- Old WarkopKuu cloud tables (`menu_items`, `orders`, `expenses`) tetap legacy dan tidak otomatis dimigrasikan ke v2.
- Supabase production migration v2 belum boleh dijalankan tanpa approval eksplisit.
- Preview `develop` harus memakai Supabase staging v2, bukan project legacy/production.

## Mode data v2

- Logged-in users memakai Supabase Auth + Supabase v2 tables sebagai cloud source of truth setelah sync.
- UI operasional membaca/menulis ke IndexedDB/Dexie local-v2 untuk UX offline-capable.
- Simple entities sync direct table operations.
- Checkout/stock cloud sync harus memakai RPC `create_transaction_with_stock_update(payload jsonb)`.

## Jalankan lokal

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run lint
npx tsc --noEmit
npm audit --omit=dev
```

## Environment variables

Gunakan placeholder ini. Jangan commit project URL/key real ke repo.

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-or-publishable-key
```

Untuk preview branch `develop`, arahkan env ke Supabase staging v2 project yang sudah diverifikasi.

## Supabase migrations

Repo berisi migration draft:

- `supabase/migrations/001_warkop_schema.sql` — legacy v1 schema.
- `supabase/migrations/002_warungin_v2_schema.sql` — Warungin v2 tables/RLS draft.
- `supabase/migrations/003_checkout_rpc_stock_safety.sql` — checkout RPC + stock safety draft.

Migration v2 ke Supabase production harus melalui approval eksplisit dan target project confirmation. Jangan menjalankan migration ke project production/legacy secara manual tanpa gate.
