# Sprint 9.5 — Checkout RPC Queue Caller Foundation Notes

**Status:** Draft v0.1  
**Scope:** Client-side checkout RPC caller foundation only. No auto background sync, no UI wiring, no production Supabase migration apply.

---

## 1. Summary

Sprint 9.5 connects the local checkout queue foundation to the Sprint 9 RPC contract with a thin callable function.

It does not start automatic sync. It only adds reusable modules that a future UI/manual/background trigger can call.

---

## 2. Files Added

- `src/lib/supabase/client.ts`
- `src/lib/supabase/index.ts`
- `src/features/cashier/sync-contract.ts`
- `src/features/cashier/sync-checkout.ts`
- `docs/Sprint-9.5-Checkout-RPC-Queue-Caller-Notes.md`

Files modified:

- `src/features/cashier/index.ts`

---

## 3. Supabase Client Module

`getSupabaseClient()` centralizes client creation using existing env vars:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

If env vars are missing, it returns `null`.

This avoids changing auth flow or `App.tsx` in this sprint.

---

## 4. RPC Contract Module

`sync-contract.ts` adds:

- `CheckoutRpcPayload`
- `CheckoutRpcPayloadItem`
- `CheckoutRpcSuccessResponse`
- `CheckoutRpcErrorResponse`
- `CheckoutRpcResponse`
- `buildCheckoutRpcPayload()`
- `isCheckoutRpcResponse()`

The payload builder requires:

- remote store ID from `store.remoteId`,
- remote product ID from item/product remote references,
- at least one transaction item.

If these prerequisites are missing, checkout sync fails clearly instead of making an invalid RPC call.

---

## 5. Checkout Sync Caller

`syncCheckoutTransactionGroup(transactionLocalId)` handles one checkout group.

Flow:

1. Load local transaction.
2. Load related transaction items.
3. Load related products.
4. Load related sync queue entries.
5. Load local store and require `store.remoteId`.
6. Build RPC payload.
7. Require Supabase client config.
8. Mark related queue entries `syncing`.
9. Call `create_transaction_with_stock_update` RPC.
10. Handle response.

---

## 6. Response Handling

### Success

On RPC success:

- transaction is marked `synced`,
- transaction `remoteId` is saved,
- transaction items are marked `synced`,
- transaction item `remoteId` values are saved,
- transaction item `transactionRemoteId` is saved,
- related products are marked `synced`,
- product stock is reconciled from RPC response,
- related queue entries are marked `synced`.

### Conflict

`INSUFFICIENT_STOCK` and `DUPLICATE_RECEIPT` are treated as conflict states.

On conflict:

- transaction is marked `conflict`,
- related queue entries are marked `conflict`,
- queue `lastError` stores the RPC message.

### Failure

Invalid/auth/config/RPC transport failures are treated as failed states.

On failure:

- transaction is marked `failed`,
- related queue entries are marked `failed`,
- queue retry count is incremented,
- queue `lastError` stores the failure reason.

---

## 7. Guardrails Preserved

This sprint does not:

- direct push checkout transaction/items/stock to Supabase tables,
- add a broad generic sync engine,
- add auto background sync,
- add online/offline listeners,
- wire UI buttons,
- apply Supabase migrations to production,
- add new libraries,
- implement receipt PNG.

The only cloud write path prepared here is the RPC call:

```ts
supabase.rpc('create_transaction_with_stock_update', { payload })
```

---

## 8. Current Limitations

- RPC migration must exist in the target Supabase project before this caller can succeed.
- Store must already have `remoteId`.
- Products must already have remote IDs.
- Product/category direct sync is still pending.
- No user-facing sync state UI exists yet.
- No automatic retry/background processing exists yet.

---

## 9. Recommended Follow-Up

Recommended next sprint:

**Sprint 9.6 — Simple Entity Direct Sync Foundation**

Why:

- checkout RPC caller now requires remote store/product IDs,
- product/category direct sync is needed before real checkout cloud sync can succeed reliably,
- simple entities are allowed to use direct table operations per TRD hybrid sync strategy.

Alternative next step:

- manual sync action/UI for checkout queue, if we want to test the RPC caller first after explicitly applying migration to a non-production Supabase project.
