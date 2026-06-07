# Sprint 12 — Desktop Dashboard Minimal Notes

## Source-of-Truth Audit

Sprint 12 follows `docs/SRD-Warungin-v2.md`:

- Objective: implement landing page, desktop login, basic reports, export, and Coming Soon nav.
- Excluded: full desktop CRUD/managerial features.

Related requirements checked before implementation:

- PRD: Desktop Dashboard Minimal scope.
- SRS: FR-DESK-001 through FR-DESK-005.
- TRD: Desktop dashboard Option B — landing page + simple desktop login + basic reporting dashboard.

## Implemented Scope

- Public landing page is available at `/` for unauthenticated visitors.
- Login/register is available separately at `/login`.
- Vercel SPA rewrite is configured so direct `/login` visits resolve to the app shell.
- Authenticated desktop dashboard view from sidebar navigation.
- Desktop dashboard shows:
  - Pendapatan.
  - Jumlah Transaksi.
  - Pengeluaran.
  - Perkiraan Laba.
  - Menu Terlaris.
  - Period summary / recent transactions.
- Desktop dashboard uses the same period filters as Sprint 11:
  - Hari ini.
  - Minggu ini.
  - Bulan ini.
  - Semua.
- Desktop export actions reuse Sprint 11 export helpers:
  - Excel `.xlsx`.
  - PDF report-ready.
- Future desktop modules are clearly marked as Coming Soon.

## Scope Kept Out

- Full desktop CRUD.
- Stock management from desktop.
- Multi-user/staff management.
- Advanced report builder.
- Chart library / chart snapshots.
- Server-rendered PDF.
- Sync engine changes.
- Supabase migration/apply.
- Release prep / README / CHANGELOG / version bump.

## Implementation Notes

- No new dependency was added.
- The existing auth and report/export logic is reused to avoid broad refactors late in the roadmap.
- Public landing is intentionally separate from onboarding: landing is pre-auth product information, onboarding remains post-auth setup.
- `vercel.json` adds a minimal SPA rewrite for direct route visits.
- `src/features/desktop/` only contains lightweight Coming Soon nav metadata/types.
- Mobile bottom navigation intentionally does not expose the desktop dashboard.

## Verification

- `npm run build` — passed.
- `npm run lint` — passed.
- `npm audit --omit=dev` — passed with 0 vulnerabilities.

Known build note:

- Vite may continue to report a large chunk warning due to existing client-side export/receipt libraries. This is not treated as a Sprint 12 blocker unless build fails.
