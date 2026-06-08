import { warunginDb } from '@/lib/db';
import { syncCheckoutTransactionGroup } from '@/features/cashier';
import { bootstrapRemoteStore } from './bootstrap';
import {
  loadSimpleEntities,
  syncCategory,
  syncExpense,
  syncExpenseCategory,
  syncPaymentMethod,
  syncProduct,
} from './simple-entity-sync';
import type { EntitySyncResult, SyncRunResult } from './types';

function summarize(results: EntitySyncResult[]): SyncRunResult {
  const synced = results.filter((result) => result.status === 'synced').length;
  const failed = results.filter((result) => result.status === 'failed').length;
  const conflict = results.filter((result) => result.status === 'conflict').length;
  const skipped = results.filter((result) => result.status === 'skipped').length;
  const errors = results.filter((result) => result.error).map((result) => `${result.entityType}: ${result.error}`);

  return {
    ok: failed === 0 && conflict === 0,
    synced,
    failed,
    conflict,
    skipped,
    errors,
    results,
  };
}

function checkoutResultError(result: Awaited<ReturnType<typeof syncCheckoutTransactionGroup>>) {
  if (result.error) return result.error;
  if (result.status === 'conflict' && result.response && 'message' in result.response) return result.response.message;
  return undefined;
}

async function loadCheckoutTransactionLocalIds(storeId: string) {
  const queueItems = await warunginDb.syncQueue.where({ storeId }).toArray();
  return Array.from(
    new Set(
      queueItems
        .filter(
          (item) =>
            item.entityType === 'transaction' &&
            item.operation === 'create' &&
            (item.status === 'pending' || item.status === 'failed')
        )
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt) || a.updatedAt.localeCompare(b.updatedAt))
        .map((item) => item.entityLocalId)
    )
  );
}

export async function runSimpleEntitySync(storeId: string): Promise<SyncRunResult> {
  const results: EntitySyncResult[] = [];
  const store = await bootstrapRemoteStore(storeId);
  results.push({ entityType: 'profile', localId: store.ownerUserId ?? 'profile', status: 'synced' });
  results.push({ entityType: 'store', localId: store.localId, status: 'synced' });

  const { categories, paymentMethods, expenseCategories, products, expenses } = await loadSimpleEntities(store.localId);

  for (const category of categories) results.push(await syncCategory(category, store));
  for (const method of paymentMethods) results.push(await syncPaymentMethod(method, store));
  for (const category of expenseCategories) results.push(await syncExpenseCategory(category, store));

  const refreshedStore = (await warunginDb.stores.get(store.localId)) ?? store;
  for (const product of products) results.push(await syncProduct(product, refreshedStore));
  for (const expense of expenses) results.push(await syncExpense(expense, refreshedStore));

  const checkoutTransactionLocalIds = await loadCheckoutTransactionLocalIds(store.localId);
  for (const transactionLocalId of checkoutTransactionLocalIds) {
    const result = await syncCheckoutTransactionGroup(transactionLocalId);
    results.push({
      entityType: 'checkout',
      localId: transactionLocalId,
      status: result.status,
      error: checkoutResultError(result),
    });
  }

  return summarize(results);
}
