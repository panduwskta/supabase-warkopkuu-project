# DOR — Warungin v2

**Status:** Draft v0.2 — English-first baseline  
**Document Type:** Development Operating Rules / Sprint & Vibecoding Rules  
**Product:** Warungin / Warungin POS  
**Related PRD:** `docs/PRD-Warungin-v2.md`  
**Related SRS:** `docs/SRS-Warungin-v2.md`  
**Related TRD:** `docs/TRD-Warungin-v2.md`  
**Owner:** Pandu W Aji / Takis Agency

---

## 1. Purpose

This document defines the operating rules for developing Warungin v2.

- PRD defines **what product should be built and why**.
- SRS defines **formal system requirements**.
- TRD defines **how the system should be technically built**.
- DOR defines **how development should be executed safely and reviewably**.

This document exists to prevent scope creep, over-engineering, unapproved library changes, and uncontrolled AI/vibecoding behavior.

---

## 2. Core Development Rules

1. Do not add unrequested features.
2. Do not change or add major libraries without confirmation.
3. If uncertain, ask first.
4. Follow PRD, SRS, and TRD.
5. Build minimum viable scope first.
6. Avoid over-engineering.
7. Do not perform large refactors without reason and approval.
8. Do not combine too many unrelated changes in one sprint.
9. Do not edit sensitive config/deploy files without confirmation.
10. Do not claim completion without verification summary and evidence.

---

## 3. Official Development Flow

```text
brainstorming
  → PRD / SRS / TRD / DOR
  → technical reference & skill search
  → small sprint breakdown
  → per sprint:
      implementation plan
      → review/approval
      → execution
      → verification summary
      → user review
  → repeat
```

No non-trivial coding should start without an approved implementation plan.

---

## 4. Source of Truth Hierarchy

If instructions conflict, follow this order:

1. Latest explicit user instruction.
2. DOR — development process and approval rules.
3. SRS — formal system requirements.
4. PRD — product scope and product decisions.
5. TRD — technical architecture and stack decisions.
6. Existing codebase.
7. External references, skills, and framework documentation.

Notes:

- PRD/SRS/TRD/DOR may be updated when decisions change.
- If implementation would change scope or architecture, update the relevant document first.
- Do not silently encode product/technical decisions in code without updating docs.

---

## 5. Stack Discipline

Warungin v2 stack follows TRD:

- React + Vite.
- TypeScript.
- Tailwind CSS.
- shadcn/ui.
- Supabase Auth + Postgres + RLS.
- IndexedDB via Dexie.js.
- Hybrid sync strategy:
  - direct table operations for simple entities,
  - RPC/server-side transaction for checkout + stock update.
- Receipt PNG local-only with retention policy.
- Desktop dashboard minimal with Excel/PDF export.
- Future Android wrapper via Capacitor after web/PWA stability.

Major library changes require approval.

Examples requiring approval:

- Replacing Dexie.
- Replacing shadcn/ui.
- Replacing Supabase.
- Adding a global state management library.
- Adding PDF/export/charting libraries.
- Adding a new routing/framework layer.

---

## 6. Technical Reference Step

Before major development begins, run a technical reference step.

Purpose:

- Identify framework-specific best practices.
- Find relevant design patterns.
- Review proven boilerplate/structure.
- Reduce guesswork before implementation.

Required output:

1. References or skills used.
2. Why each reference is relevant.
3. Recommended pattern.
4. Risks and trade-offs.
5. Any proposed library additions and whether they need approval.

This step is required before major work such as:

- TypeScript migration.
- Tailwind/shadcn setup.
- Dexie local DB.
- Sync engine.
- Supabase RLS/RPC.
- Excel/PDF export.
- Capacitor wrapper.

---

## 7. Sprint Discipline

### 7.1 Sprint Size

Each sprint should have:

- one primary objective,
- limited scope,
- reviewable file changes,
- clear verification steps,
- no unrelated feature bundling.

If a sprint feels large, split it.

### 7.2 Sprint Naming

Format:

```text
Sprint N — Short Name
```

Examples:

- Sprint 0 — Technical Reference & Pattern Search
- Sprint 1 — TypeScript Baseline
- Sprint 2 — Tailwind/shadcn Foundation
- Sprint 3 — Supabase v2 Schema
- Sprint 4 — Local DB Foundation

### 7.3 Required Sprint Components

Every sprint must include:

- Objective.
- Scope included.
- Scope excluded.
- Files to create/modify.
- Implementation plan.
- Verification plan.
- Known risks/questions.
- Approval before coding.

---

## 8. Implementation Plan Requirement

Before editing or writing code, create an implementation plan and wait for approval.

### 8.1 Implementation Plan Template

```md
## Implementation Plan — Sprint X: [Name]

### Objective
[Goal of the sprint]

### Scope Included
- [Included work]

### Scope Excluded
- [Explicitly excluded work]

### Files to Create
- `path/file` — why it is created

### Files to Modify
- `path/file` — planned change

### Functions/Modules to Add
- `function/module` — responsibility

### Step-by-Step Plan
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Dependencies / Libraries
- [Existing libraries]
- [New libraries, if any — require approval]

### Risks / Questions
- [Risks or decisions needed]

### Verification Plan Preview
- [How this will be verified]
```

### 8.2 Approval Gate

Coding may only start after explicit approval, such as:

- “approve plan”
- “okay execute”
- “lanjut implement”

If the user corrects the plan, update the plan first before coding.

---

## 9. Execution Rules

During execution:

1. Follow the approved plan.
2. Do not add new scope mid-sprint.
3. Stop and report blockers.
4. Ask before adding libraries.
5. Ask before changing architecture/schema beyond the approved plan.
6. Keep changes as small as possible.
7. Use representative commits.
8. Do not delete important files/data without approval.
9. Do not deploy production without approval.
10. Do not submit Play Store or change external production settings without approval.

---

## 10. Verification Summary Requirement

After execution, provide a verification summary so the user does not need to manually inspect the full diff.

### 10.1 Verification Summary Template

```md
## Verification Summary — Sprint X: [Name]

### Files Changed
- `path/file` — created/modified/deleted and why

### What Changed
- [Main changes]

### What Was Added
- [New functionality/modules]

### What Was Modified
- [Changed behavior]

### What Was Removed
- [Removed items, if any]

### Verification Performed
- `command` — result
- Manual check — result

### How User Can Review
1. [Review step]
2. [What to check]

### Known Limitations / Follow-up
- [Limitations or next tasks]
```

### 10.2 Minimum Verification Gate

Before claiming completion, run the smallest meaningful verification gate:

- `npm run build`,
- `npm run lint`,
- TypeScript typecheck,
- unit tests if available,
- manual browser/app check if relevant,
- SQL/RLS verification if schema changed,
- direct inspection if no automated gate exists.

If verification cannot be run, state why.

---

## 11. Documentation Update Rules

Update PRD/SRS/TRD/DOR when changes affect:

- feature scope,
- system requirements,
- non-functional requirements,
- stack/library decisions,
- data model/schema,
- sync strategy,
- export/reporting behavior,
- desktop scope,
- Android/Play Store approach,
- development process.

No documentation update is required for:

- minor copy changes,
- small UI polish,
- internal refactor with no behavior change,
- bug fix that does not alter requirements.

---

## 12. Scope Control

### 12.1 Allowed in MVP v2

- Rebrand Warungin.
- TypeScript migration.
- Tailwind/shadcn foundation.
- Supabase v2 schema.
- IndexedDB/Dexie local DB.
- Offline-capable sync.
- Single-user account/store.
- Product/menu/basic stock.
- HPP/modal field.
- Cashier checkout.
- Transaction history.
- Expenses.
- Mobile dashboard.
- Receipt PNG local-only.
- CSV/Excel export.
- PDF report-ready export.
- Onboarding sample data.
- Desktop dashboard minimal.
- Coming Soon desktop nav.

### 12.2 Not Allowed Without New Approval

- Open Bill.
- Multi-user owner/staff.
- Barcode scanning.
- Supplier management.
- Advanced stock in/out.
- Weighted average HPP.
- Bluetooth print.
- Payment gateway.
- Native Android rebuild.
- Full desktop managerial dashboard.
- Subscription/paywall.
- AI features.

---

## 13. Initial Sprint Breakdown

Final sprint plan must still be reviewed before development.

### Sprint 0 — Technical Reference & Pattern Search

Objective:

- Confirm technical patterns and library candidates before coding.

Scope:

- TypeScript migration pattern.
- Tailwind/shadcn setup pattern.
- Dexie local DB pattern.
- Supabase RLS/RPC pattern.
- Excel/PDF export options.
- Receipt PNG library options.

Output:

- Technical reference notes.
- Recommended libraries/patterns.
- Approval items.

### Sprint 1 — TypeScript Baseline & App Structure

Objective:

- Move project foundation to TypeScript and modular structure.

Excluded:

- UI redesign.
- Sync engine.
- Schema migration.

### Sprint 2 — Tailwind/shadcn Foundation

Objective:

- Set up design system foundation.

Excluded:

- Full page redesign.

### Sprint 3 — Supabase v2 Schema Draft

Objective:

- Create v2 schema migration and RLS draft.

Excluded:

- Full UI integration.

### Sprint 4 — Local DB Foundation

Objective:

- Set up Dexie local DB and repositories.

Excluded:

- Full sync engine.

### Sprint 5 — Onboarding Sample Data

Objective:

- Enable sample data onboarding.

Excluded:

- Cloud sync.

### Sprint 6 — Product/Menu + HPP

Objective:

- Implement product/menu management with HPP.

Excluded:

- Barcode.
- Supplier.
- Advanced stock movement.

### Sprint 7 — Cashier Checkout Local

Objective:

- Implement local cart/checkout flow.

Excluded:

- Receipt PNG.
- Cloud RPC sync.

### Sprint 8 — Sync Engine MVP

Objective:

- Implement queue and basic cloud sync.

Excluded:

- Complex conflict UI.

### Sprint 9 — Checkout RPC + Stock Safety

Objective:

- Implement safe checkout cloud sync.

Excluded:

- Open Bill.

### Sprint 10 — Receipt PNG + Share

Objective:

- Implement receipt PNG generation and sharing.

Excluded:

- Supabase Storage upload.
- Bluetooth print.

### Sprint 11 — Dashboard + Reports Export

Objective:

- Implement dashboard metrics and CSV/Excel/PDF export.

Excluded:

- Advanced report builder.

### Sprint 12 — Desktop Dashboard Minimal

Objective:

- Implement landing page, desktop login, basic reports, export, and Coming Soon nav.

Excluded:

- Full desktop CRUD/managerial features.

### Sprint 13 — Hardening & QA

Objective:

- Stabilize MVP before release.

Excluded:

- New features.

---

## 14. Assistant Operating Rules

When developing Warungin or similar projects:

1. Read/check relevant PRD/SRS/TRD/DOR before planning.
2. If the task affects previous decisions, check memory/docs.
3. For non-trivial work, create implementation plan first.
4. Wait for approval before code edits.
5. Execute only approved scope.
6. Verify with the smallest meaningful gate.
7. Summarize changed files and verification.
8. Recommend next sprint only after current work is verified.

If the user says “continue coding” without a sprint decision, propose the next smallest sprint or ask for confirmation.

---

## 15. DOR Acceptance Criteria

DOR is accepted when:

- Development flow is clear.
- Implementation plan gate is mandatory.
- Verification summary gate is mandatory.
- Sprint size and scope rules are clear.
- Stack discipline is clear.
- Feature-creep prevention rules are explicit.
- Initial sprint breakdown is available for review.
