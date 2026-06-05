# Sprint 0 — Technical Reference & Release Workflow

**Status:** Draft v0.1 — recommendation for review  
**Product:** Warungin / Warungin POS  
**Sprint Type:** Research / technical reference / release workflow planning  
**Related PRD:** `docs/PRD-Warungin-v2.md`  
**Related SRS:** `docs/SRS-Warungin-v2.md`  
**Related TRD:** `docs/TRD-Warungin-v2.md`  
**Related DOR:** `docs/SRD-Warungin-v2.md`  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Purpose

Sprint 0 exists to reduce implementation risk before coding starts.

This sprint does not implement product features. It defines recommended technical patterns, library candidates, branch strategy, environment strategy, and Play Store readiness workflow for Warungin v2.

---

## 2. Current Baseline Observed

Current repository baseline:

- App entry is still `src/main.jsx`.
- Styling is still concentrated in `src/styles.css`.
- Current app is effectively a compact React/Vite app, not yet modularized.
- Existing dependencies already include:
  - React 19.
  - Vite 7.
  - TypeScript package installed, but source is still JSX.
  - Supabase JS.
  - Lucide React.
  - ESLint.
- Existing Supabase migration:
  - `supabase/migrations/001_warkop_schema.sql`.

Implication:

- Sprint 1 should focus on TypeScript baseline and modular app structure before deeper feature work.
- No runtime library should be added before the specific sprint that needs it, unless approved.

---

## 3. Reference Sources Used

### 3.1 Frontend / Vite / React / TypeScript

References:

- Vite/React TypeScript structure best practices from current ecosystem references.
- Common feature-based React structure patterns.

Relevant conclusions:

- Use a feature-based structure rather than keeping most logic in one file.
- Keep route-level pages separate from reusable UI components.
- Keep domain/data logic outside UI components.
- Use TypeScript models/types per feature or shared domain folder.
- Use path alias `@/*` after TypeScript/Vite configuration is stable.

### 3.2 shadcn/ui + Tailwind

References:

- Official shadcn/ui Vite installation guidance.
- Tailwind CSS Vite setup guidance.

Relevant conclusions:

- shadcn/ui works best when TypeScript and path alias are already configured.
- Tailwind/shadcn should be introduced after TypeScript baseline, not before.
- Components should be added selectively, not all at once.

### 3.3 Dexie / IndexedDB

References:

- Dexie official docs.
- Dexie React tutorial and `useLiveQuery()` guidance.
- IndexedDB/offline app best practices.

Relevant conclusions:

- Create one Dexie DB module.
- Use schema versioning from the start.
- Use indexed fields for frequent queries.
- Use Dexie transactions for multi-step local writes.
- Avoid network/fetch calls inside Dexie transactions.
- Use `dexie-react-hooks` only when local DB reactivity is needed.
- Use client-generated IDs for synced records.

### 3.4 Supabase RLS / RPC

References:

- Supabase RLS documentation.
- Supabase database functions / RPC documentation.
- Supabase RLS performance best-practice references.

Relevant conclusions:

- Enable RLS on all user-facing tables.
- Use clear `SELECT`, `INSERT`, `UPDATE`, `DELETE` policies.
- Index columns used by RLS policies, especially owner/store/user IDs.
- Avoid overly complex RLS policies.
- Use RPC for atomic checkout + stock update.
- Prefer `SECURITY INVOKER` unless elevated behavior is absolutely required.
- If `SECURITY DEFINER` is used, manually verify `auth.uid()`, set safe `search_path`, validate inputs, and restrict execute permissions.
- Never expose Supabase service role key in client code.

### 3.5 Capacitor / Android / Play Store

References:

- Capacitor Android deployment guidance.
- Google Play Console testing and publishing requirements.

Relevant conclusions:

- Web/PWA should stabilize before Capacitor wrapper.
- Play Store submission requires a signed Android App Bundle (`.aab`).
- Android Studio will be needed for final build/release checks.
- Google Play Developer account and Play Console are required.
- Privacy Policy URL is required.
- Data Safety form is required for app listings beyond internal-only testing.
- New personal developer accounts may need closed testing with at least 12 opted-in testers for 14 days before production access.
- Store listing assets must be prepared before release.

### 3.6 Branch / Release Workflow

References:

- Gitflow, GitHub Flow, GitLab Flow comparisons.
- Production/staging branch workflow best practices.

Relevant conclusions:

- `main` should represent production-ready code once real users exist.
- Feature work should not happen directly on `main` after development begins.
- Hotfix branches are needed once production users exist.
- A lightweight Gitflow/GitLab Flow hybrid fits Warungin better than full Gitflow complexity.

### 3.7 Receipt PNG

References:

- DOM-to-image library comparisons.
- React component-to-image patterns.

Relevant conclusions:

- Receipt should be rendered as a dedicated hidden/print-safe React component.
- Conversion should target a ref, not the full page.
- `html-to-image` or `dom-to-image-more` appears preferable to `html2canvas` for modern CSS, performance, and smaller footprint.
- `html2canvas` remains a fallback option if rendering compatibility is better in our target devices.
- Avoid external cross-origin assets inside receipt image.

### 3.8 Excel Export

References:

- SheetJS/XLSX usage references.
- ExcelJS and other export alternatives.

Relevant conclusions:

- For MVP report export, SheetJS (`xlsx`) is the simplest likely option.
- Avoid enterprise grid/spreadsheet packages because they are too heavy for MVP.
- ExcelJS is stronger for styled workbook control but may be unnecessary for MVP.
- CSV export can remain simpler and may not require a library.

### 3.9 PDF Export

References:

- jsPDF documentation references.
- `jspdf-autotable` references.
- React PDF generation alternatives.

Relevant conclusions:

- For report-ready PDF tables, `jspdf` + `jspdf-autotable` is likely the simplest MVP option.
- `@react-pdf/renderer` is stronger for complex layouts but may be more work.
- Browser print-to-PDF can be a fallback for visually formatted reports.
- Avoid server-side Puppeteer for MVP unless client-side PDF proves insufficient.

---

## 4. Recommended Technical Pattern

### 4.1 App Structure

Recommended target structure:

```text
src/
  app/
    App.tsx
    router.tsx
    providers.tsx
  components/
    ui/
    layout/
    common/
  features/
    auth/
    onboarding/
    products/
    cashier/
    transactions/
    expenses/
    dashboard/
    reports/
    settings/
  lib/
    supabase/
    db/
    sync/
    export/
    receipt/
  types/
  utils/
  styles/
```

Guidelines:

- `features/*` owns feature-specific components/hooks/services.
- `lib/db` owns Dexie schema and local repositories.
- `lib/supabase` owns Supabase client and cloud data access helpers.
- `lib/sync` owns queue and sync orchestration.
- `lib/export` owns CSV/Excel/PDF generation.
- `lib/receipt` owns receipt PNG rendering helpers.
- Keep global state minimal; do not add Zustand/Redux unless a later sprint proves need.

### 4.2 TypeScript Migration

Recommended approach:

1. Convert entrypoint from `main.jsx` to `main.tsx`.
2. Add `App.tsx` shell.
3. Configure `tsconfig` and Vite path alias.
4. Move existing app into modular files gradually.
5. Use permissive-but-safe first pass if needed, then tighten types as features are migrated.

Do not perform a full UI rewrite during TypeScript baseline.

### 4.3 Tailwind / shadcn

Recommended approach:

1. Do after TypeScript baseline.
2. Install/configure Tailwind.
3. Initialize shadcn/ui.
4. Add only required components for first UI foundation:
   - button,
   - card,
   - input,
   - label,
   - dialog/sheet if needed,
   - tabs if needed.
5. Preserve mobile-first usability.

### 4.4 Local DB / Sync

Recommended approach:

- Use Dexie for local data and sync queue.
- Use client-generated IDs, preferably UUID/ULID-style strings.
- Local operational UI reads from Dexie.
- Writes update local DB first, then enqueue sync mutation.
- Simple tables sync via direct Supabase operations.
- Checkout cloud sync uses RPC to preserve transaction + stock safety.
- Keep conflict handling simple for MVP:
  - latest `updated_at` wins for simple entities,
  - checkout transactions should be append-only once committed,
  - failed sync appears in a small status/error state.

### 4.5 Supabase Schema / RLS

Recommended approach:

- Create v2 tables instead of mutating v1 tables aggressively.
- Preserve v1 data as legacy unless a separate migration is approved.
- Include `store_id`, `owner_user_id`, `created_at`, `updated_at`, `deleted_at`, and sync metadata where needed.
- RLS should isolate data by authenticated user/store ownership.
- Index RLS and sync query columns.
- Keep RPC functions few and focused.

---

## 5. Recommended Branch Strategy

Use a lightweight Gitflow/GitLab Flow hybrid.

### 5.1 Branches

```text
main
  production-ready stable branch

develop
  integration branch for approved development work

feature/sprint-x-short-name
  one sprint or one focused feature

release/vx.y.z
  release stabilization branch before production / Play Store update

hotfix/short-issue-name
  urgent fix from main for production users
```

### 5.2 Current Recommendation

- Keep `main` as current stable baseline.
- Create `develop` before Sprint 1 coding starts.
- Each sprint should use a `feature/sprint-*` branch.
- Merge feature branches into `develop` after verification.
- Merge `develop` into `main` only when a release candidate is approved.
- Tag production releases:
  - `v2.0.0-beta.1`
  - `v2.0.0-rc.1`
  - `v2.0.0`

### 5.3 Why This Fits Warungin

Warungin will eventually have real Play Store users. Once that happens:

- `main` must remain safe for production hotfixes.
- Beta/staging work must not break real users.
- Play Store builds need version traceability.
- Urgent production fixes must bypass unfinished feature work.

---

## 6. Recommended Environment Strategy

### 6.1 Environments

Recommended minimum:

```text
local
  developer machine / local browser

staging
  beta testing, internal testing, QA, preview users

production
  real users / Play Store production / public domain
```

### 6.2 Vercel

Recommended:

- Production Vercel project/domain points to `main`.
- Preview deployments are used for feature branches and PR review.
- Optional staging domain points to `develop`.

Candidate domains:

- Production: `warungin.com` or final public domain.
- Staging: `staging.warungin.com` or Vercel preview URL.

### 6.3 Supabase

Recommended ideal setup:

- Supabase production project for real users.
- Supabase staging project for testing/beta.

Alternative minimal setup:

- Use one Supabase project initially, but separate test users/data carefully.

Recommendation:

- Use separate Supabase staging + production before public Play Store production.
- During early Sprint 1–4 development, one project can be acceptable if no real users are affected.
- Before beta/real users, split staging and production.

### 6.4 Environment Variables

Recommended:

- `.env.local` for local development.
- Vercel environment variables for preview/staging/production.
- Never commit real secrets.
- Supabase anon key can be public, but service role key must never be used client-side.

---

## 7. Recommended Play Store Workflow

### 7.1 Required Tools / Accounts

Required later:

- Google Play Developer account.
- Google Play Console.
- Android Studio.
- Java/JDK and Gradle via Android build toolchain.
- Capacitor Android project.
- Play App Signing / signing key process.
- Privacy Policy page hosted on public URL.
- Support/contact email.
- Store listing assets.

Already used:

- GitHub for source code.
- Supabase for auth/database.
- Vercel for web deployment.

### 7.2 Release Tracks

Recommended release path:

1. Web/PWA local QA.
2. Vercel staging QA.
3. Capacitor Android internal build.
4. Play Console Internal Testing.
5. Closed Testing if required by account policy.
6. Open Testing if useful.
7. Production release.

### 7.3 Play Store Submission Assets

Prepare before submission:

- App name/title.
- Short description.
- Full description.
- App icon 512×512.
- Feature graphic 1024×500.
- Phone screenshots.
- Optional tablet/desktop screenshots if applicable.
- Privacy Policy URL.
- Data Safety answers.
- Content rating questionnaire.
- App category.
- Support/contact email.
- Test account credentials for Google review if app requires login.

### 7.4 Versioning

Recommended:

- Web/package version: semantic versioning.
- Android `versionName`: same semantic version, e.g. `2.0.0`.
- Android `versionCode`: monotonically increasing integer.
- Git tag every Play Store upload.

Example:

```text
v2.0.0-beta.1
v2.0.0-rc.1
v2.0.0
v2.0.1-hotfix.1
```

---

## 8. Recommended Library Decisions

### 8.1 Already Locked by Source of Truth

- React + Vite.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Supabase JS.
- Dexie.js.
- Capacitor later after web/PWA stability.

### 8.2 Recommended for Approval Later

Do not install immediately. Approve when the relevant sprint begins.

| Need | Recommended Candidate | Alternative | Recommendation |
|---|---|---|---|
| Dexie React integration | `dexie-react-hooks` | custom subscription hooks | Approve with Dexie sprint if live local queries are needed |
| Receipt PNG | `html-to-image` | `dom-to-image-more`, `html2canvas` | Prefer `html-to-image`; test on target Android browsers |
| Excel export | `xlsx` / SheetJS | ExcelJS | Prefer SheetJS for MVP; CSV can remain custom |
| PDF export | `jspdf` + `jspdf-autotable` | `@react-pdf/renderer`, browser print | Prefer jsPDF/autotable for MVP tabular reports |
| Charts | none yet | Recharts, Tremor, Chart.js | Defer until dashboard/report needs are concrete |
| Global state | none yet | Zustand, Redux Toolkit | Defer; local DB + React state may be enough |

---

## 9. Risks and Mitigations

### 9.1 Offline Sync Complexity

Risk:

- Sync can become the hardest part of the product.

Mitigation:

- Keep MVP conflict handling simple.
- Use append-only transactions where possible.
- Implement sync status visibility early.
- Avoid multi-user edits in MVP.

### 9.2 Supabase RLS Mistakes

Risk:

- Incorrect RLS could leak or block user data.

Mitigation:

- Keep policies simple.
- Index ownership columns.
- Test with multiple users.
- Avoid service role key on client.

### 9.3 Receipt Rendering Differences

Risk:

- DOM-to-image output may differ across browsers/WebViews.

Mitigation:

- Use simple receipt CSS.
- Avoid external assets.
- Test on Android Chrome and Capacitor WebView before locking.

### 9.4 Play Store Review Requirements

Risk:

- Missing privacy policy, test access, or Data Safety details can delay release.

Mitigation:

- Prepare Play Store checklist before Android submission sprint.
- Add privacy policy page before closed/open testing.

### 9.5 Branch/Environment Drift

Risk:

- Staging and production may diverge in schema or config.

Mitigation:

- Use migrations as source of truth.
- Track Supabase schema changes in repo.
- Use clear release branches and tags.

---

## 10. Approval Items Before Sprint 1

Recommended decisions to approve before coding begins:

1. Create `develop` branch before Sprint 1.
2. Use feature branch per sprint.
3. Keep `main` as production/stable branch.
4. Use lightweight Gitflow/GitLab Flow hybrid.
5. Use separate Supabase staging + production before real Play Store users.
6. Use Vercel preview/staging for beta review.
7. Defer Capacitor until web/PWA is stable.
8. Approve future candidate libraries only at the relevant sprint, not now:
   - `dexie-react-hooks`,
   - `html-to-image`,
   - `xlsx`,
   - `jspdf`,
   - `jspdf-autotable`.

---

## 11. Proposed Sprint 1

Recommended next sprint:

```text
Sprint 1 — TypeScript Baseline & App Structure
```

Objective:

- Create the TypeScript-ready foundation and modular app shell without changing user-facing product scope.

Suggested scope:

- Create `develop` branch.
- Create feature branch `feature/sprint-1-typescript-baseline`.
- Convert `src/main.jsx` to `src/main.tsx`.
- Create `src/app/App.tsx`.
- Prepare basic folder structure.
- Configure TypeScript/Vite path alias if safe.
- Keep existing behavior working.
- Run build/lint.

Explicitly excluded:

- Tailwind/shadcn setup.
- Dexie/local DB.
- Supabase schema v2.
- Sync engine.
- UI redesign.
- Play Store/Capacitor setup.

---

## 12. Sprint 0 Acceptance Criteria

Sprint 0 is complete when:

- Technical references have been reviewed.
- Recommended app structure is defined.
- Recommended branch strategy is defined.
- Recommended environment strategy is defined.
- Play Store toolchain and workflow are identified.
- Library candidates are listed with approval timing.
- Sprint 1 can be planned safely without guessing.
