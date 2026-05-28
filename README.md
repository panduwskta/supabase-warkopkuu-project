# WarkopKuu — Manajemen Warkop/Kedai/Warung

App kasir Indonesia dengan login, manajemen menu, kasir/POS, riwayat transaksi, pengeluaran, dashboard, CSV export.

## Mode data
- Jika `VITE_SUPABASE_URL` dan `VITE_SUPABASE_ANON_KEY` tersedia: memakai Supabase/Vibecode Cloud Auth + database.
- Jika env belum tersedia: fallback ke akun lokal browser supaya app tetap bisa dipakai/demo.

## Jalankan
```bash
npm install
npm run dev
```

## Database
Jalankan SQL di `supabase/migrations/001_warkop_schema.sql` pada Supabase/Vibecode Cloud SQL editor.
