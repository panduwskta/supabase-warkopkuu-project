# Sprint 13 — Hardening & QA Notes

## Source-of-Truth Audit

Sprint 13 follows `docs/SRD-Warungin-v2.md`:

- Objective: stabilize MVP before release.
- Excluded: new features.

Related hardening requirements checked:

- PRD Phase 7: mobile QA, offline/online QA, RLS verification, export QA.
- TRD Phase 9: build/lint/typecheck, RLS verification, offline/online QA, export QA, mobile responsive QA.
- TRD Testing Strategy: static/build checks, core flow, offline flow, conflict flow, RLS verification.
- SRS: authentication, onboarding, POS, transaction, expense, dashboard/report, receipt, offline/sync, desktop, security, usability, maintainability requirements.

## QA Checklist

### Static / Build Checks

- `npm run build` — passed.
- `npm run lint` — passed.
- `npx tsc --noEmit` — initially failed, then passed after Sprint 13 hardening fixes.
- `npm audit --omit=dev` — passed with 0 vulnerabilities.
- `git diff --check` — to be run before PR.

Known build note:

- Vite continues to warn about a large client chunk due to existing export/receipt libraries. This remains non-blocking because the production build succeeds.

### Public Route / Desktop Smoke QA

Local preview smoke checks:

- `/` returns the app shell for the public landing portal.
- `/login` returns the app shell for login/register.
- `/login?mode=register` returns the app shell for register mode.

Route hardening:

- `vercel.json` from Sprint 12 keeps SPA direct routes resolving to `index.html` on Vercel.

### Core Flow QA Coverage

Covered by source inspection and existing implementation paths:

- Register/login/logout path remains unchanged except `/login` entry routing.
- Product/menu creation/update/delete remains on existing app flow.
- Checkout still validates cart, stock, payment amount, then records order and decrements stock.
- Transaction history uses selected period filter and CSV export.
- Expense creation/deletion remains on existing app flow.
- Dashboard/report exports still reuse Sprint 11 helpers.
- Receipt PNG/share still uses Sprint 10 receipt sharing helper.

Manual browser interaction with a real Supabase account is still recommended before external trial.

### Offline / Sync QA Coverage

Inspected source paths:

- Local fallback account/data remains isolated by `user_id` in local storage.
- Existing local DB / sync queue modules remain present.
- Sprint 13 did not change sync architecture or apply migrations.
- Checkout RPC sync response handling was type-hardened without changing runtime behavior.

Limitation:

- Full offline/online conflict simulation requires a real Supabase project/session and browser/network toggling. This was not executed in this repository-only QA pass.

### RLS / Security QA Coverage

Inspected migrations and source:

- `supabase/migrations/001_warkop_schema.sql` enables RLS for v1 app tables and has owner policies by `auth.uid() = user_id`.
- `supabase/migrations/002_warungin_v2_schema.sql` enables RLS for v2 tables and scopes store-owned entities through `stores.owner_user_id = auth.uid()`.
- `supabase/migrations/003_checkout_rpc_stock_safety.sql` verifies authenticated user and store ownership before checkout writes.
- No service-role key or private secret was added.
- `vercel.json` only adds SPA rewrite behavior.

Limitation:

- Live RLS verification with two Supabase users was not executed from this environment.

### Responsive QA Coverage

Source/style inspection:

- Mobile bottom nav remains mobile-only.
- Desktop sidebar/dashboard remains desktop-focused.
- Public landing page has mobile/desktop media rules.
- Desktop dashboard entry is hidden on mobile via `.desktop-only-nav`.

Manual device/browser review is still recommended before external trial.

## Hardening Fixes Applied

### Typecheck Support

- Added Vite env typing through `src/vite-env.d.ts`.
- Raised TypeScript target/lib from ES2020 to ES2021 so `String.replaceAll` is supported by typecheck.

### JSX / Component Prop Hardening

- Made `Splash.small`, `Card.action`, and `Empty.action/onClick` explicitly optional through defaults.
- Moved React `key` usage for `OrderCard` lists onto fragments to satisfy typecheck.
- Added numeric casting for best-selling sort values.

### Checkout Sync Type Hardening

- Added explicit error-response typing for checkout RPC conflict/failure handling.
- Runtime behavior remains the same; the change makes TypeScript narrowing explicit.

## Scope Kept Out

- No new features.
- No new dashboard modules.
- No sync architecture changes.
- No Supabase migrations applied.
- No release prep / README / CHANGELOG / version bump.
- No Play Store / Capacitor work.

## Follow-up Before Preview/Trial

After Sprint 13 merge and before external trial, perform the planned Alignment Review / Roadmap Reconciliation, then run a real browser/device QA pass with Supabase credentials and at least two users for RLS verification.
