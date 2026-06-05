# PRD — Warungin v2

**Status:** Draft v0.1  
**Product:** Warungin  
**Previous baseline:** WarkopKuu v1  
**Reference benchmark:** KasirGratisan repo (`panduwskta/kasirgratisan`)  
**Owner:** Pandu W Aji / Takis Agency  
**Tagline candidate:** Kelola warung dari genggaman.

---

## 1. Ringkasan Produk

Warungin v2 adalah major update dari WarkopKuu v1 menjadi aplikasi kasir dan manajemen warung/kedai/warkop/UMKM yang lebih serius, rapi, dan siap diposisikan sebagai produk.

Fokus utama v2 adalah mempertahankan kesederhanaan v1, tetapi memperkuat fondasi produk lewat rebrand, alur kasir yang lebih matang, manajemen operasional harian, dan laporan yang lebih berguna untuk pemilik usaha kecil.

Warungin tidak perlu meniru KasirGratisan secara mentah. KasirGratisan menjadi benchmark fitur POS offline-first yang lengkap, sedangkan Warungin diarahkan sebagai aplikasi cloud-first yang ringan, mobile-first, dan mudah dipakai pemilik warung Indonesia.

---

## 2. Latar Belakang

### 2.1 Kondisi v1

WarkopKuu v1 sudah memiliki fondasi utama:

- Login/register
- Data per akun berbasis Supabase/cloud
- Dashboard pendapatan, transaksi, pengeluaran, laba
- Kasir/POS
- Manajemen menu dan stok
- Stok otomatis berkurang saat checkout
- Riwayat pesanan
- Export CSV
- Catat pengeluaran
- Mobile-first bottom navigation
- Quick add menu bottom sheet
- Pembayaran uang diterima dan kembalian
- Nomor transaksi
- Share struk WhatsApp
- Filter pesanan
- Kategori chip
- Badge menu terlaris
- Credit kecil: “Built by Takis Agency · Crafted by Pandu W Aji”

### 2.2 Alasan v2

Perubahan ke Warungin bukan sekadar rename. Beberapa elemen v1 masih membawa identitas WarkopKuu, tone visual warkop, prefix struk lama, dan copy yang perlu disesuaikan.

v2 dibutuhkan untuk:

- Membuat identitas produk baru yang lebih luas dari warkop
- Meningkatkan kualitas UX kasir dan pengelolaan stok
- Menyusun fitur berdasarkan kebutuhan UMKM nyata
- Membuat fondasi teknis yang siap dikembangkan bertahap
- Mengurangi kesan “demo app” dan menaikkan kesan “produk siap pakai”

---

## 3. Problem Statement

Pemilik warung/kedai kecil sering mencatat transaksi, stok, dan pengeluaran secara manual atau terpisah di buku/WhatsApp/Excel. Akibatnya:

- Penjualan harian sulit dipantau real-time
- Stok sering tidak akurat
- Laba sulit dihitung karena pengeluaran tidak tercatat rapi
- Riwayat transaksi sulit dicari
- Kasir sederhana sering terlalu kompleks atau terlalu mahal
- Banyak aplikasi POS terasa berat untuk warung kecil

Warungin v2 harus membantu pemilik usaha kecil menjalankan operasional harian dengan cepat tanpa harus memahami sistem akuntansi yang rumit.

---

## 4. Target Pengguna

### 4.1 Primary User

**Pemilik warung/kedai/warkop kecil**

Karakteristik:

- Mengelola bisnis sendiri atau bersama keluarga/karyawan kecil
- Butuh pencatatan transaksi harian
- Ingin tahu pendapatan, pengeluaran, laba, dan stok
- Lebih sering memakai HP daripada laptop
- Membutuhkan app sederhana, cepat, dan berbahasa Indonesia

### 4.2 Secondary User

**Kasir/staf warung**

Karakteristik:

- Fokus input transaksi cepat
- Tidak perlu akses semua laporan/settings
- Butuh UI kasir yang jelas dan minim distraksi

### 4.3 Future User

**Owner multi-outlet / UMKM bertumbuh**

Belum menjadi fokus utama v2, tetapi beberapa fondasi perlu disiapkan agar fitur multi-user, permission, dan outlet bisa masuk di versi berikutnya.

---

## 5. Value Proposition

Warungin membantu pemilik warung mencatat pesanan, memantau stok, menghitung pengeluaran, dan melihat laporan harian dalam satu aplikasi sederhana yang bisa digunakan dari HP.

### Positioning Statement

**Warungin adalah aplikasi kasir dan manajemen warung mobile-first untuk UMKM Indonesia yang ingin operasional harian lebih rapi tanpa sistem yang ribet.**

### Tagline

**Kelola warung dari genggaman.**

### Supporting Copy

Catat pesanan, pantau stok, hitung pengeluaran, dan lihat laporan harian dalam satu aplikasi sederhana untuk warung, kedai, dan usaha kecil Indonesia.

---

## 6. Goals v2

### 6.1 Product Goals

1. Rebrand WarkopKuu menjadi Warungin secara konsisten.
2. Membuat alur kasir lebih cepat, jelas, dan siap dipakai harian.
3. Memperkuat manajemen menu, stok, transaksi, dan pengeluaran.
4. Meningkatkan kualitas dashboard/laporan agar owner bisa mengambil keputusan sederhana.
5. Menyiapkan fondasi fitur lanjutan tanpa membuat MVP terlalu berat.

### 6.2 Business Goals

1. Membuat Warungin terlihat sebagai produk yang bisa dipromosikan.
2. Meningkatkan kredibilitas Takis Agency sebagai builder produk UMKM.
3. Membuka peluang versi premium/freemium di masa depan.
4. Membuat demo/live app lebih meyakinkan untuk calon user/klien.

### 6.3 UX Goals

1. Bisa dipakai nyaman dari layar HP.
2. Alur transaksi selesai dalam beberapa tap.
3. Bahasa sederhana, tidak terlalu akuntansi.
4. State kosong, error, dan feedback harus jelas.
5. Tidak membuat user takut salah input.

---

## 7. Non-Goals v2

Hal-hal berikut belum menjadi fokus v2 awal:

- Multi-outlet penuh
- Integrasi payment gateway sungguhan
- Akuntansi lengkap
- Payroll/karyawan lengkap
- Marketplace/inventory warehouse kompleks
- Native iOS app
- Android Play Store release sebagai target distribusi jangka pendek/menengah, tetapi tidak wajib mengubah MVP v2 menjadi native app penuh sejak awal
- AI assistant di dalam app
- Subscription billing
- Integrasi printer thermal yang kompleks

Fitur ini boleh masuk backlog future, tetapi tidak boleh menghambat rilis v2.

---

## 8. Scope v2

### 8.1 Must-Have

#### A. Rebrand & Product Identity

- Rename WarkopKuu menjadi Warungin di seluruh UI utama.
- Update title, metadata, receipt copy, empty states, dan onboarding copy.
- Ubah prefix nomor struk dari format lama ke kandidat baru, misalnya `WRG`.
- Visual direction: green primary + warm amber accent.
- Tone: ramah, sederhana, tapi product-ready.

#### B. Dashboard Owner

Dashboard harus menampilkan ringkasan harian:

- Total penjualan hari ini
- Jumlah transaksi hari ini
- Total pengeluaran hari ini
- Estimasi laba hari ini
- Menu terlaris
- Stok rendah
- Transaksi terbaru
- Shortcut ke Kasir, Menu, Pengeluaran, Riwayat

#### C. Kasir/POS

Kasir harus mendukung:

- Pilih menu dari list/kategori
- Search menu
- Cart dengan tambah/kurang qty
- Checkout
- Input uang diterima
- Hitung kembalian otomatis
- Pilih metode pembayaran sederhana
- Nomor transaksi/struk
- Stok otomatis berkurang setelah checkout
- Share struk ke WhatsApp
- Validasi stok tidak cukup

#### D. Manajemen Menu & Stok

- CRUD menu/produk
- Kategori menu
- Harga jual
- Stok tersedia
- Quick add menu
- Edit stok manual
- Status stok rendah
- Soft delete atau minimal proteksi agar data transaksi lama tetap aman

#### E. Riwayat Transaksi

- List transaksi terbaru
- Detail transaksi
- Filter berdasarkan tanggal/status/kata kunci sederhana
- Export CSV
- Share ulang struk
- Ringkasan total periode terpilih

#### F. Pengeluaran

- Catat pengeluaran
- Kategori pengeluaran sederhana
- Tanggal pengeluaran
- Catatan opsional
- Masuk ke perhitungan laba dashboard

#### G. Account & Cloud Data

- Login/register tetap dipertahankan.
- Data user terpisah per akun.
- Supabase tetap menjadi sumber data utama.
- Fallback lokal boleh tetap ada untuk demo jika env Supabase tidak tersedia.

#### H. Play Store Readiness Foundation

Warungin v2 perlu disiapkan agar tidak menutup jalan menuju Google Play Store.

Requirement awal:

- UI tetap mobile-first dan layak digunakan sebagai app Android.
- App harus punya nama, ikon, warna brand, dan deskripsi produk yang konsisten.
- Alur login/register tidak boleh terasa seperti demo internal.
- App harus punya halaman/legal copy untuk Privacy Policy sebelum submit Play Store.
- Penggunaan permission Android harus minimal. Hindari permission sensitif kecuali benar-benar dibutuhkan.
- Jika memakai wrapper Android/PWA-to-APK, pengalaman utama tetap harus stabil: login, kasir, dashboard, transaksi, dan riwayat.

### 8.2 Should-Have

#### A. Open Bill / Simpan Pesanan

Terinspirasi dari KasirGratisan.

Use case:

- Warung/kedai menerima pesanan meja tetapi bayar belakangan.
- Kasir bisa menyimpan cart sebagai bill terbuka.

Fields kandidat:

- Nama pelanggan opsional
- Nomor meja opsional
- Catatan pesanan opsional
- Status: `open` / `completed` / `cancelled`

#### B. HPP / Modal Produk Sederhana

Agar laba lebih akurat:

- Produk punya harga modal/HPP opsional
- Laba transaksi dihitung dari harga jual - HPP
- Jika HPP kosong, laba bisa dihitung sebagai pendapatan - pengeluaran saja atau diberi label estimasi

#### C. Payment Method

- Cash
- QRIS
- Transfer
- E-wallet

Minimal v2 cukup selectable dan muncul di riwayat/struk.

#### D. Backup/Export Data

Karena Warungin cloud-first, backup JSON bukan prioritas utama, tetapi tetap berguna untuk trust.

- Export transaksi/menu/pengeluaran ke CSV/JSON
- Import belum wajib di v2 awal

#### E. Better Empty States & Onboarding

- First-run guide singkat
- Contoh menu dummy opsional
- Empty state: “Belum ada menu”, “Belum ada transaksi”, dst.

### 8.3 Nice-to-Have

- Barcode scanning
- Foto produk
- Supplier management
- Stock in/out terpisah
- HPP weighted average
- Multi-user owner/staff + permission
- PWA install prompt
- Dark mode
- Theme customization
- Bluetooth print
- Receipt PNG download
- WhatsApp customer receipt template lebih rapi

---

## 9. Benchmark Insight dari KasirGratisan

KasirGratisan memberikan benchmark kuat untuk POS UMKM:

### Fitur yang layak diadaptasi

- Open bill
- Multi-user mode
- Barcode scanner
- Product SKU/unit/photo/barcode
- Stock in/out
- HPP weighted average
- Supplier
- Backup/restore JSON
- PWA offline
- Receipt print/share/download
- Dark mode dan theme color

### Yang tidak perlu dicopy langsung

- Offline-only data model
- Kompleksitas permission di MVP awal
- Semua master data sekaligus
- Bluetooth print jika belum ada kebutuhan nyata
- HPP weighted average penuh jika HPP sederhana sudah cukup

### Prinsip adaptasi

KasirGratisan = lengkap dan offline-first.  
Warungin = sederhana, cloud-first, mobile-first, lebih ringan untuk pemilik warung yang ingin data aman lintas perangkat.

---

## 10. User Flow Utama

### 10.1 First-Time User

1. User membuka Warungin.
2. User register/login.
3. User mengisi nama warung.
4. User menambahkan menu pertama atau memakai contoh menu.
5. User diarahkan ke dashboard/kasir.

### 10.2 Flow Transaksi Cepat

1. Kasir buka tab Kasir.
2. Pilih menu dari kategori/search.
3. Atur qty di cart.
4. Klik checkout.
5. Pilih metode pembayaran.
6. Input uang diterima jika cash.
7. Sistem hitung kembalian.
8. Transaksi tersimpan.
9. Stok berkurang otomatis.
10. Struk bisa dibagikan via WhatsApp.

### 10.3 Flow Catat Pengeluaran

1. Owner buka Pengeluaran.
2. Klik tambah pengeluaran.
3. Isi judul/kategori/nominal/tanggal/catatan.
4. Simpan.
5. Dashboard memperbarui total pengeluaran dan laba.

### 10.4 Flow Open Bill — Should-Have

1. Kasir memilih produk ke cart.
2. Klik Simpan Bill.
3. Isi nama pelanggan/meja/catatan opsional.
4. Bill muncul di daftar Open Bill.
5. Saat pelanggan bayar, kasir buka bill dan checkout.

---

## 11. Data Requirement Awal

Entitas minimal v2:

### User/Profile

- id
- email/auth id
- display name opsional
- created_at

### Store

- id
- user_id/owner_id
- store_name
- address opsional
- phone opsional
- receipt_footer opsional
- created_at
- updated_at

### Category

- id
- store_id/user_id
- name
- color/icon opsional
- created_at

### Product/Menu

- id
- store_id/user_id
- category_id
- name
- price
- stock
- hpp/modal opsional
- is_active/is_deleted
- created_at
- updated_at

### Transaction

- id
- store_id/user_id
- receipt_number
- subtotal
- discount opsional future
- total
- payment_method
- payment_amount
- change
- profit_estimate
- status
- date
- created_at

### Transaction Item

- id
- transaction_id
- product_id
- product_name snapshot
- qty
- price snapshot
- hpp snapshot opsional
- subtotal

### Expense

- id
- store_id/user_id
- category/name
- amount
- date
- notes
- created_at

---

## 12. Functional Requirements

### FR-001 Rebrand

Seluruh referensi WarkopKuu di UI utama harus diganti ke Warungin.

### FR-002 Authentication

User harus bisa login/register dan hanya melihat data miliknya sendiri.

### FR-003 Dashboard Summary

User harus bisa melihat ringkasan performa harian.

### FR-004 Product/Menu Management

User harus bisa membuat, mengedit, menghapus/menonaktifkan, dan mencari menu.

### FR-005 Stock Tracking

Stok produk harus otomatis berkurang setelah transaksi berhasil.

### FR-006 Cashier Checkout

User harus bisa membuat transaksi dari cart dan menyimpan pembayaran.

### FR-007 Receipt

Setiap transaksi harus menghasilkan nomor struk dan detail item.

### FR-008 WhatsApp Share

User harus bisa share struk ke WhatsApp.

### FR-009 Transaction History

User harus bisa melihat dan memfilter transaksi lama.

### FR-010 Expense Tracking

User harus bisa mencatat pengeluaran dan melihat dampaknya di dashboard.

### FR-011 Export

User harus bisa export data transaksi minimal CSV.

### FR-012 Open Bill — Should-Have

User bisa menyimpan cart sebagai bill terbuka dan melanjutkan checkout nanti.

---

## 13. Non-Functional Requirements

### Performance

- Initial load harus terasa ringan di mobile.
- Interaksi kasir harus responsif.
- Search menu harus cepat untuk puluhan hingga ratusan item.

### Reliability

- Transaksi tidak boleh tersimpan setengah jika stok gagal update.
- Validasi stok harus mencegah penjualan melebihi stok.
- Error dari Supabase harus ditampilkan dengan bahasa yang bisa dimengerti.

### Security & Privacy

- Data user harus terisolasi per akun.
- Supabase RLS harus aktif untuk tabel user/store.
- Tidak boleh expose secret key di frontend.

### Mobile UX

- Layout mobile-first.
- Bottom navigation tetap mudah dijangkau.
- Form input nominal harus nyaman di keyboard HP.

### Android / Play Store Readiness

- Produk harus bisa dikemas sebagai Android app tanpa mengubah core business logic secara besar.
- Kandidat pendekatan teknis perlu dibandingkan di TRD: PWA installable, Trusted Web Activity (TWA), Capacitor, atau native rebuild di masa depan.
- App harus memiliki Privacy Policy publik sebelum Play Store submission.
- Data Safety Form Google Play harus bisa dijawab dengan jelas berdasarkan data yang dikumpulkan: akun, email, data toko, produk, transaksi, pengeluaran.
- Permission Android harus dijaga seminimal mungkin. Kamera/barcode, storage, Bluetooth print, atau notifikasi tidak boleh menjadi permission wajib jika fiturnya belum masuk scope.
- App listing assets perlu disiapkan: app icon, feature graphic, screenshot mobile, short description, full description, dan contact email.

### Maintainability

- Struktur kode harus siap untuk pemisahan fitur.
- Nama entity harus mulai dinormalisasi dari WarkopKuu ke Warungin.
- Hindari menambah fitur besar tanpa data model yang jelas.

---

## 14. Success Metrics

### Product Metrics

- User bisa menyelesaikan transaksi pertama dalam < 5 menit setelah register.
- User bisa menambah menu pertama tanpa bantuan.
- User bisa memahami pendapatan, pengeluaran, dan laba dari dashboard.
- Minimal 0 error kritis pada flow checkout.

### Technical Metrics

- Build production berhasil.
- Lint tidak memiliki error kritis.
- RLS Supabase lolos basic access test.
- Tidak ada data bocor antar akun.

### UX Metrics

- Flow checkout maksimal 4 langkah utama: pilih menu → cart → bayar → struk.
- Empty state membantu user mengambil aksi berikutnya.
- Copy UI konsisten menggunakan istilah Indonesia sederhana.

---

## 15. Release Plan Kandidat

### Phase 1 — Foundation/Rebrand

- Rename WarkopKuu → Warungin
- Update visual identity
- Update copy, metadata, receipt prefix
- Rapikan dashboard dan empty states

### Phase 2 — Core POS Improvement

- Perbaiki kasir/cart/checkout
- Payment method
- Riwayat transaksi lebih rapi
- Share receipt lebih baik

### Phase 3 — Operational Control

- Menu/stok lebih matang
- Pengeluaran lebih rapi
- HPP/modal sederhana
- Export lebih jelas

### Phase 4 — Advanced Candidate

- Open bill
- PWA polish
- Backup/export JSON
- Multi-user planning
- Barcode/foto produk jika dibutuhkan

### Phase 5 — Android / Play Store Candidate

- Tentukan pendekatan distribusi Android: TWA/PWA wrapper, Capacitor, atau native rebuild future
- Siapkan Privacy Policy dan halaman legal publik
- Siapkan app icon, feature graphic, screenshot, short description, full description
- Siapkan Google Play Console account, package name, signing key, internal testing track
- Uji flow utama di perangkat Android: login/register, kasir, checkout, riwayat, share struk
- Isi Data Safety Form berdasarkan data collection Warungin

---

## 16. Open Questions

1. Apakah Warungin v2 tetap pure cloud-first, atau perlu offline-first/PWA sebagai requirement utama?
2. Apakah Open Bill masuk MVP v2 atau v2.1?
3. Apakah HPP/modal wajib di produk sejak v2 awal?
4. Apakah target awal single-user dulu atau langsung owner/staff?
5. Apakah Warungin akan punya landing page publik terpisah?
6. Apakah struk perlu format PNG/download, atau WhatsApp text dulu cukup?
7. Apakah data demo/sample menu perlu disediakan saat onboarding?
8. Apakah target Play Store memakai pendekatan PWA/TWA, Capacitor wrapper, atau native app di fase berikutnya?
9. Apakah Play Store submission ditargetkan untuk v2 awal, v2.1, atau setelah produk web stabil?
10. Apakah kita sudah punya Google Play Console developer account dan nama package kandidat, misalnya `id.takisagency.warungin`?

---

## 17. Recommendation Awal

Untuk rilis v2 yang realistis, rekomendasi scope adalah:

### MVP v2

- Rebrand total ke Warungin
- Dashboard lebih matang
- Kasir/cart/checkout lebih rapi
- Menu/stok solid
- Pengeluaran solid
- Riwayat transaksi + export
- Receipt/share WhatsApp
- HPP sederhana opsional

### v2.1

- Open bill
- Payment method lebih detail
- PWA polish
- Backup JSON

### v2.2+

- Multi-user owner/staff
- Barcode
- Supplier
- Stock in/out
- Weighted average HPP
- Printer/receipt PNG

### Android / Play Store Track

- Rekomendasi awal: stabilkan Warungin sebagai web/PWA mobile-first dulu, lalu bungkus ke Android memakai TWA atau Capacitor setelah flow core terbukti stabil.
- Jangan rebuild native dari nol untuk tahap awal karena akan memperlambat validasi produk.
- Play Store readiness mulai disiapkan sejak PRD/TRD: privacy policy, data safety, app assets, dan package/signing plan.

---

## 18. Acceptance Criteria PRD

PRD ini dianggap siap lanjut ke TRD jika:

- Scope MVP v2 disetujui.
- Open questions utama sudah dijawab.
- Must-have vs should-have sudah dikunci.
- Data requirement sudah cukup untuk diturunkan menjadi schema Supabase.
- User flow utama sudah disepakati.
