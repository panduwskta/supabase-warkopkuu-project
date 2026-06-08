# Sprint BF-4 — Payment Method Selection Notes

## Scope

- Add minimal checkout payment method selection for Tunai, QRIS, Transfer, and E-wallet.
- Preserve cash received/change flow for Tunai.
- Treat non-cash methods as exact payment for the transaction total.
- Store selected payment method local ID, remote ID when available, snapshot, and kind on local transactions.
- Let checkout RPC payload use a synced payment method remote ID when it is available before RPC execution.
- Display payment method in transaction history and transaction CSV export.

## Changes

- Checkout modal now shows payment method buttons sourced from local-v2 payment methods.
- Cash keeps `Uang diterima`, quick amount buttons, and `Kembalian`.
- QRIS/Transfer/E-wallet skip cash change input and submit the total as paid.
- `checkoutCartLocal()` resolves the selected payment method and passes local/remote/snapshot/kind to `checkoutLocal()`.
- `LocalTransaction` now stores `paymentMethodKind` in addition to existing payment method fields.
- Checkout sync resolves a payment method remote ID from the local payment method at RPC time if the transaction snapshot does not already have it.
- Transaction history cards/table and transaction CSV include the selected payment method.

## Verification

Passed locally before PR:

- `npm run build`
- `npm run lint`
- `npx tsc --noEmit`
- `npm audit --omit=dev`
- `git diff --check`

Known non-blocking warning:

- Vite large chunk warning from existing export/receipt libraries remains.

## Out of Scope

- Payment gateway integration.
- QRIS generation or settlement status.
- Payment method CRUD/settings page.
- Advanced split payments or payment details.
