# Sprint 11 — Dashboard + Reports Export Notes

## Source-of-Truth Audit

Sprint 11 follows `docs/SRD-Warungin-v2.md`:

- Objective: implement dashboard metrics and CSV/Excel/PDF export.
- Excluded: advanced report builder.

Related requirements checked before implementation:

- PRD: mobile dashboard, export/reporting, report-ready PDF.
- SRS: FR-DASH-001, FR-DASH-002, FR-DASH-003, FR-REP-001, FR-REP-002, Reporting Requirements 7.1–7.3.
- TRD: export requirements and candidate client-side PDF approach.

## Implemented Scope

- Dashboard period filter: Hari ini, Minggu ini, Bulan ini, Semua.
- Dashboard summary metrics:
  - Pendapatan.
  - Jumlah Transaksi.
  - Pengeluaran.
  - Perkiraan Laba.
- Operational insight cards:
  - Menu Terlaris.
  - Stok Menipis.
  - Transaksi Terbaru.
- Report exports from dashboard:
  - CSV report.
  - Excel `.xlsx` report with multiple sheets.
  - Report-ready PDF with header, period, timestamp, summary, top products, recent transactions, expenses, and footer branding.
- Transaction CSV export now respects the selected transaction-history period.

## Library Decision

Previously proposed Excel/PDF libraries were `xlsx`, `jspdf`, and `jspdf-autotable`.

During verification, `xlsx` was found to have a high-severity audit finding with no available fix. Because the TRD allows SheetJS (`xlsx`) **or equivalent**, Excel export uses `write-excel-file` instead.

PDF export uses:

- `jspdf`.
- `jspdf-autotable`.

## Scope Kept Out

- Advanced report builder.
- Desktop dashboard minimal.
- Chart library / visual chart snapshots.
- Full accounting logic beyond simple UMKM-friendly estimated profit.
- Server-rendered PDF.

## Verification

- `npm run build` — passed.
- `npm run lint` — passed.
- `npm audit --omit=dev` — passed with 0 vulnerabilities.

Known build note:

- Vite reports a large chunk warning due to client-side export/receipt libraries. This does not fail the build; code-splitting can be considered in a later hardening sprint if needed.
