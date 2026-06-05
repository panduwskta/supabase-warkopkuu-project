# SRD — Warungin v2

**Status:** Draft v0.1  
**Document type:** Source Rules Document / Sprint Requirements Document  
**Product:** Warungin / Warungin POS  
**Related PRD:** `docs/PRD-Warungin-v2.md`  
**Related TRD:** `docs/TRD-Warungin-v2.md`  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Purpose

SRD ini adalah source of truth untuk cara kerja development Warungin v2.

PRD menjawab: **apa yang mau dibangun.**  
TRD menjawab: **gimana cara bangunnya.**  
SRD menjawab: **aturan eksekusi, sprint, approval gate, dan disiplin development supaya proses coding tidak melebar.**

Dokumen ini wajib dipakai sebelum masuk tahap development, terutama saat vibecoding dengan AI assistant.

---

## 2. Core Development Rule

Warungin v2 harus dikembangkan secara bertahap, kecil, terukur, dan bisa direview cepat.

Aturan utama:

1. Jangan tambah fitur yang tidak diminta.
2. Jangan ganti library tanpa konfirmasi.
3. Kalau tidak yakin, tanya dulu.
4. Ikuti stack dan arsitektur di TRD.
5. Minimal viable dulu, jangan langsung kompleks.
6. Jangan over-engineering.
7. Jangan refactor besar tanpa alasan dan approval.
8. Jangan menggabungkan terlalu banyak perubahan dalam satu sprint.
9. Jangan edit file sensitif/config/deploy tanpa konfirmasi jika dampaknya belum jelas.
10. Jangan klaim selesai tanpa verification plan dan hasil verifikasi.

---

## 3. Development Flow

Alur kerja resmi Warungin v2:

```text
brainstorming
  → PRD / TRD / SRD
  → cari skill & acuan teknis
  → bagi jadi sprint kecil
  → per sprint:
      implementation plan
      → review/approval
      → eksekusi
      → verification plan
      → review hasil
  → ulangi
```

Development tidak boleh langsung loncat ke coding tanpa implementation plan yang disetujui.

---

## 4. Source of Truth Hierarchy

Jika ada konflik instruksi:

1. Instruksi user terbaru.
2. SRD — aturan eksekusi dan sprint.
3. PRD — scope produk dan kebutuhan user.
4. TRD — arsitektur dan keputusan teknis.
5. Existing codebase.
6. Referensi eksternal/skill/framework docs.

Catatan:

- PRD/TRD/SRD bisa diupdate jika keputusan berubah.
- Update dokumen harus dilakukan sebelum implementasi jika perubahan berdampak ke scope/arsitektur.
- Jangan diam-diam mengubah keputusan produk/teknis di kode tanpa update dokumen.

---

## 5. Stack Discipline

Stack utama mengikuti TRD:

- React + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui
- Supabase Auth + Postgres + RLS
- IndexedDB via Dexie.js
- Hybrid sync strategy:
  - direct table operations untuk entity sederhana
  - RPC/server-side transaction untuk checkout + update stok
- Receipt PNG local-only dengan retention policy
- Desktop dashboard minimal dengan Excel/PDF export
- Future Android wrapper via Capacitor setelah web/PWA stabil

Dilarang mengganti atau menambahkan library besar tanpa approval.

Contoh perlu approval:

- Mengganti Dexie ke library local DB lain.
- Mengganti shadcn/ui ke UI kit lain.
- Mengganti Supabase ke backend lain.
- Menambah state management global besar.
- Menambah PDF/export library yang belum dibahas.
- Menambah charting library baru.
- Menambah routing/framework baru.

---

## 6. Skill & Technical Reference Step

Sebelum development sprint besar dimulai, lakukan tahap pencarian acuan teknis.

Tujuan:

- Mencari framework-specific best practice.
- Mencari pattern yang relevan dengan stack.
- Mencari boilerplate/proven structure yang cocok.
- Mengurangi eksperimen liar di tengah implementasi.

Output tahap ini minimal:

1. Daftar referensi/skill yang dipakai.
2. Ringkasan kenapa relevan.
3. Keputusan pattern yang akan diikuti.
4. Risiko/kompromi dari pattern tersebut.
5. Library tambahan yang diusulkan, jika ada, beserta alasan dan approval requirement.

Tahap ini harus dilakukan sebelum sprint teknis besar seperti:

- TypeScript migration.
- Tailwind/shadcn setup.
- Dexie local DB.
- Sync engine.
- Supabase RPC/RLS.
- PDF export.
- Capacitor wrapper.

---

## 7. Sprint Discipline

Sprint harus kecil, jelas, dan punya batas.

### 7.1 Sprint Size

Satu sprint idealnya:

- 1 tujuan utama.
- 3–7 file utama maksimal jika memungkinkan.
- Bisa diverifikasi dalam satu sesi review.
- Tidak mencampur UI besar + schema besar + sync engine besar sekaligus.

Jika scope terasa besar, pecah lagi.

### 7.2 Sprint Naming

Format:

```text
Sprint N — Nama singkat
```

Contoh:

- Sprint 0 — Technical Baseline & Tooling
- Sprint 1 — TypeScript + App Structure
- Sprint 2 — Tailwind/shadcn Foundation
- Sprint 3 — Supabase v2 Schema Draft
- Sprint 4 — Local DB Foundation
- Sprint 5 — Onboarding Sample Data

### 7.3 Sprint Must-Have

Setiap sprint harus punya:

- Objective
- Scope included
- Scope excluded
- Files to create/change
- Implementation plan
- Verification plan
- Known risks
- Approval before coding

---

## 8. Implementation Plan Requirement

Sebelum menulis/mengedit kode, assistant harus membuat implementation plan.

Implementation plan harus dikirim untuk review sebelum eksekusi.

### 8.1 Implementation Plan Template

```md
## Implementation Plan — Sprint X: [Name]

### Objective
[Tujuan sprint dalam 1–3 kalimat]

### Scope Included
- [Item yang akan dikerjakan]

### Scope Excluded
- [Item yang sengaja tidak dikerjakan]

### Files to Create
- `path/file` — alasan dibuat

### Files to Modify
- `path/file` — perubahan yang direncanakan

### Functions/Modules to Add
- `function/module` — tanggung jawab

### Step-by-Step Plan
1. [Langkah 1]
2. [Langkah 2]
3. [Langkah 3]

### Dependencies / Libraries
- [Library existing yang dipakai]
- [Library baru jika ada — butuh approval]

### Risks / Questions
- [Risiko atau hal yang perlu keputusan]

### Verification Plan Preview
- [Cara validasi setelah implementasi]
```

### 8.2 Approval Gate

Coding hanya boleh mulai setelah user memberi approval eksplisit, misalnya:

- “oke eksekusi”
- “lanjut implement”
- “approve plan”

Jika user mengoreksi plan, update plan dulu sebelum coding.

---

## 9. Execution Rules

Saat eksekusi sprint:

1. Ikuti implementation plan yang sudah disetujui.
2. Jangan menambah scope baru di tengah jalan.
3. Jika menemukan blocker, berhenti dan jelaskan.
4. Jika perlu library baru, minta approval.
5. Jika perlu mengubah schema/arsitektur dari TRD, update dokumen/ask first.
6. Gunakan perubahan sekecil mungkin.
7. Commit harus representatif dan tidak mencampur banyak unrelated changes.
8. Jangan menghapus data/file penting tanpa approval.
9. Jangan melakukan deploy production tanpa approval.
10. Jangan submit Play Store/ubah config eksternal tanpa approval.

---

## 10. Verification Plan Requirement

Setelah eksekusi sprint, assistant wajib membuat verification plan/result summary.

User tidak perlu membaca seluruh diff manual. Assistant harus merangkum perubahan dan cara validasinya.

### 10.1 Verification Summary Template

```md
## Verification Summary — Sprint X: [Name]

### Files Changed
- `path/file` — dibuat/diubah/dihapus, alasannya

### What Changed
- [Perubahan utama]

### What Was Added
- [Fitur/modul/fungsi baru]

### What Was Modified
- [Modifikasi existing behavior]

### What Was Removed
- [Jika ada]

### Verification Performed
- `command` — hasil
- Manual check — hasil

### How User Can Review
1. [Langkah review user]
2. [Hal yang perlu diperhatikan]

### Known Limitations / Follow-up
- [Limitasi atau task berikutnya]
```

### 10.2 Minimum Verification Gate

Minimal salah satu harus dilakukan sebelum klaim selesai:

- `npm run build`
- `npm run lint`
- typecheck
- unit test jika tersedia
- manual browser/app check jika relevan
- SQL/RLS verification jika schema berubah
- direct inspection jika belum ada test/build gate

Jika gate tidak bisa dijalankan, jelaskan alasannya.

---

## 11. Documentation Update Rules

PRD/TRD/SRD harus diupdate jika ada perubahan pada:

- Scope fitur.
- Stack/library.
- Data model/schema.
- Sync strategy.
- Export/reporting behavior.
- Desktop dashboard scope.
- Android/Play Store approach.
- Sprint/development process.

Dokumen tidak perlu diupdate untuk:

- Bug fix kecil.
- Copy/UI polish kecil.
- Refactor internal yang tidak mengubah arsitektur.
- Test/lint cleanup yang tidak mengubah behavior.

---

## 12. Scope Control Rules

### 12.1 Allowed in MVP v2

Mengacu PRD/TRD:

- Rebrand Warungin.
- TypeScript migration.
- Tailwind/shadcn foundation.
- Supabase v2 schema.
- Local IndexedDB/Dexie.
- Offline-capable sync.
- Single-user account/store.
- Product/menu/stok dasar.
- HPP/modal field.
- Cashier checkout.
- Transaction history.
- Expenses.
- Dashboard mobile.
- Receipt PNG local-only.
- Export CSV/Excel.
- PDF report-ready.
- Onboarding sample data.
- Desktop minimal dashboard.
- Coming Soon nav for future desktop modules.

### 12.2 Not Allowed Without New Approval

- Open Bill implementation.
- Multi-user owner/staff.
- Barcode scanning.
- Supplier management.
- Stock in/out advanced.
- Weighted average HPP.
- Bluetooth print.
- Payment gateway.
- Native Android rebuild.
- Full desktop managerial dashboard.
- Subscription/paywall.
- AI features.

---

## 13. Recommended Initial Sprint Breakdown

This is an initial draft. Final sprint plan should be reviewed before development.

### Sprint 0 — Technical Reference & Pattern Search

Objective:

- Cari skill/acuan teknis untuk stack dan pattern.

Scope:

- TypeScript migration approach.
- Tailwind/shadcn setup pattern.
- Dexie local DB pattern.
- Supabase RLS/RPC pattern.
- PDF/Excel export options.

Output:

- Technical reference notes.
- Final recommendation before coding.

### Sprint 1 — TypeScript Baseline & App Structure

Objective:

- Migrasi fondasi project ke TypeScript dan struktur folder yang siap v2.

Scope:

- `src/app`
- `src/features`
- `src/lib`
- `src/types`
- TypeScript config/build compatibility

Excluded:

- UI redesign besar.
- Sync engine.
- Schema migration.

### Sprint 2 — Tailwind/shadcn Foundation

Objective:

- Setup design system dasar.

Scope:

- Tailwind config.
- shadcn/ui base.
- layout shell mobile-first.
- theme token Warungin.

Excluded:

- Full page redesign.

### Sprint 3 — Supabase v2 Schema Draft

Objective:

- Membuat migration SQL v2.

Scope:

- `stores`, `categories`, `products`, `transactions`, `transaction_items`, `expenses`, etc.
- RLS policy draft.
- RPC checkout draft if approved.

Excluded:

- UI integration penuh.

### Sprint 4 — Local DB Foundation

Objective:

- Setup Dexie local DB and repositories.

Scope:

- Local schema.
- Entity types.
- Basic CRUD local repositories.

Excluded:

- Full sync engine.

### Sprint 5 — Onboarding Sample Data

Objective:

- User bisa masuk ke app dengan sample data.

Scope:

- Business type selection.
- Demo seed data.
- Reset sample data.

Excluded:

- Cloud sync.

### Sprint 6 — Core Product/Menu + HPP

Objective:

- Product/menu management dasar dengan HPP/modal.

Scope:

- Product list.
- Add/edit product.
- Category basic.
- HPP default 0/empty-friendly.

Excluded:

- Barcode.
- Supplier.
- Stock movement advanced.

### Sprint 7 — Cashier Checkout + Receipt Number

Objective:

- Core POS flow berjalan lokal.

Scope:

- Cart.
- Checkout.
- Stock deduction local.
- Receipt number default `WRG`.

Excluded:

- Receipt PNG.
- Cloud sync RPC.

### Sprint 8 — Sync Engine MVP

Objective:

- Queue mutation dan sync cloud dasar.

Scope:

- Pull cloud to local.
- Push pending mutations.
- Sync status.
- Hybrid strategy foundation.

Excluded:

- Complex conflict UI.

### Sprint 9 — Checkout RPC + Stock Safety

Objective:

- Checkout cloud sync aman.

Scope:

- RPC/server transaction.
- Stock validation.
- Conflict state basic.

Excluded:

- Open Bill.

### Sprint 10 — Receipt PNG + Share

Objective:

- Struk visual bisa dishare.

Scope:

- Receipt component.
- PNG generation.
- Web Share API.
- Local retention 14 hari.

Excluded:

- Supabase Storage upload.
- Bluetooth print.

### Sprint 11 — Dashboard + Reports Export

Objective:

- Dashboard mobile dan export dasar.

Scope:

- Sales/expense/profit summary.
- CSV/Excel export.
- PDF report-ready.

Excluded:

- Advanced report builder.

### Sprint 12 — Desktop Minimal Dashboard

Objective:

- Landing page + desktop login + laporan basic.

Scope:

- Landing entry.
- Desktop dashboard basic.
- Excel/PDF export.
- Coming Soon nav.

Excluded:

- Full desktop CRUD/manajerial.

### Sprint 13 — Hardening & QA

Objective:

- Stabilkan MVP sebelum release.

Scope:

- Build/lint/typecheck.
- Offline/online QA.
- RLS verification.
- Mobile responsive QA.

Excluded:

- New features.

---

## 14. Assistant Operating Rules for Warungin Vibecoding

When user asks to develop/code Warungin:

1. Check PRD/TRD/SRD before planning.
2. If task affects prior decisions, search memory if needed.
3. If task is bigger than a small fix, create implementation plan first.
4. Wait for approval before editing code.
5. Execute only approved scope.
6. Verify with the smallest meaningful gate.
7. Summarize verification and changed files.
8. Recommend next sprint only after current sprint is verified.

If asked to “lanjut coding” without a sprint decision, assistant should ask or propose the next smallest sprint.

---

## 15. SRD Acceptance Criteria

SRD is accepted when:

- Development flow is clear.
- Implementation plan gate is mandatory.
- Verification summary gate is mandatory.
- Sprint size and scope rules are clear.
- Stack discipline is clear.
- No-feature-creep rules are explicit.
- Initial sprint breakdown is available for review.
