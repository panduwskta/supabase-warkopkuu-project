import { getSupabaseClient } from '@/lib/supabase';
import {
  nowIso,
  warunginDb,
  type LocalProduct,
  type LocalTransaction,
  type LocalTransactionItem,
  type SyncQueueItem,
  type SyncStatus,
} from '@/lib/db';

import { buildCheckoutRpcPayload, isCheckoutRpcResponse, type CheckoutRpcResponse } from './sync-contract';

export type CheckoutSyncResultStatus = 'synced' | 'failed' | 'conflict';

export interface CheckoutSyncResult {
  status: CheckoutSyncResultStatus;
  response?: CheckoutRpcResponse;
  error?: string;
}

interface CheckoutSyncGroup {
  transaction: LocalTransaction;
  transactionItems: LocalTransactionItem[];
  products: LocalProduct[];
  queueItems: SyncQueueItem[];
}

function relatedProductLocalIds(transactionItems: LocalTransactionItem[]) {
  return Array.from(new Set(transactionItems.map((item) => item.productLocalId).filter(Boolean) as string[]));
}

function findCheckoutQueueItems(transaction: LocalTransaction, transactionItems: LocalTransactionItem[], products: LocalProduct[]) {
  const transactionItemIds = new Set(transactionItems.map((item) => item.localId));
  const productIds = new Set(products.map((product) => product.localId));

  return warunginDb.syncQueue
    .where({ storeId: transaction.storeId })
    .filter((item) => {
      if (item.entityType === 'transaction') return item.entityLocalId === transaction.localId && item.operation === 'create';
      if (item.entityType === 'transactionItem') return transactionItemIds.has(item.entityLocalId) && item.operation === 'create';
      if (item.entityType === 'product') return productIds.has(item.entityLocalId) && item.operation === 'update';
      return false;
    })
    .toArray();
}

async function loadCheckoutSyncGroup(transactionLocalId: string): Promise<CheckoutSyncGroup> {
  const transaction = await warunginDb.transactions.get(transactionLocalId);
  if (!transaction) throw new Error('Transaction not found.');

  const transactionItems = await warunginDb.transactionItems.where({ transactionLocalId }).toArray();
  if (transactionItems.length === 0) throw new Error('Transaction items not found.');

  const products = (await warunginDb.products.bulkGet(relatedProductLocalIds(transactionItems))).filter(Boolean) as LocalProduct[];
  const queueItems = await findCheckoutQueueItems(transaction, transactionItems, products);

  return {
    transaction,
    transactionItems,
    products,
    queueItems,
  };
}

function updateQueueItems(queueItems: SyncQueueItem[], status: SyncStatus, timestamp: string, error?: string) {
  return queueItems.map(
    (item) =>
      ({
        ...item,
        status,
        retryCount: status === 'failed' ? item.retryCount + 1 : item.retryCount,
        lastError: status === 'failed' || status === 'conflict' ? error : undefined,
        updatedAt: timestamp,
        syncedAt: status === 'synced' ? timestamp : item.syncedAt,
      }) satisfies SyncQueueItem
  );
}

async function markCheckoutGroupSyncing(group: CheckoutSyncGroup) {
  if (group.queueItems.length === 0) return;

  const timestamp = nowIso();
  const syncingItems = updateQueueItems(group.queueItems, 'syncing', timestamp);
  await warunginDb.syncQueue.bulkPut(syncingItems);
}

async function markCheckoutGroupFailed(group: CheckoutSyncGroup, error: string): Promise<CheckoutSyncResult> {
  const timestamp = nowIso();
  const failedQueueItems = updateQueueItems(group.queueItems, 'failed', timestamp, error);

  await warunginDb.transaction('rw', [warunginDb.transactions, warunginDb.syncQueue], async () => {
    await warunginDb.transactions.put({
      ...group.transaction,
      syncStatus: 'failed',
      updatedAt: timestamp,
    });

    if (failedQueueItems.length > 0) {
      await warunginDb.syncQueue.bulkPut(failedQueueItems);
    }
  });

  return { status: 'failed', error };
}

async function markCheckoutGroupConflict(group: CheckoutSyncGroup, response: CheckoutRpcResponse): Promise<CheckoutSyncResult> {
  const timestamp = nowIso();
  const message = response.ok ? 'Checkout sync conflict.' : response.message;
  const conflictQueueItems = updateQueueItems(group.queueItems, 'conflict', timestamp, message);

  await warunginDb.transaction('rw', [warunginDb.transactions, warunginDb.syncQueue], async () => {
    await warunginDb.transactions.put({
      ...group.transaction,
      syncStatus: 'conflict',
      updatedAt: timestamp,
    });

    if (conflictQueueItems.length > 0) {
      await warunginDb.syncQueue.bulkPut(conflictQueueItems);
    }
  });

  return { status: 'conflict', response };
}

async function markCheckoutGroupSynced(group: CheckoutSyncGroup, response: Extract<CheckoutRpcResponse, { ok: true }>): Promise<CheckoutSyncResult> {
  const timestamp = response.syncedAt || nowIso();
  const transactionItemsByLocalId = new Map(response.transactionItems.map((item) => [item.localTransactionItemId, item.transactionItemId]));
  const productsByLocalId = new Map(response.products.filter((product) => product.productLocalId).map((product) => [product.productLocalId as string, product]));
  const syncedQueueItems = updateQueueItems(group.queueItems, 'synced', timestamp).map((item) => {
    if (item.entityType === 'transaction') return { ...item, entityRemoteId: response.transactionId } satisfies SyncQueueItem;
    if (item.entityType === 'transactionItem') return { ...item, entityRemoteId: transactionItemsByLocalId.get(item.entityLocalId) ?? item.entityRemoteId } satisfies SyncQueueItem;
    if (item.entityType === 'product') return { ...item, entityRemoteId: productsByLocalId.get(item.entityLocalId)?.productId ?? item.entityRemoteId } satisfies SyncQueueItem;
    return item;
  });

  const syncedTransactionItems = group.transactionItems.map(
    (item) =>
      ({
        ...item,
        remoteId: transactionItemsByLocalId.get(item.localId) ?? item.remoteId,
        transactionRemoteId: response.transactionId,
        syncStatus: 'synced',
        lastSyncedAt: timestamp,
        updatedAt: timestamp,
      }) satisfies LocalTransactionItem
  );

  const syncedProducts = group.products.map((product) => {
    const remoteProduct = productsByLocalId.get(product.localId);

    return {
      ...product,
      remoteId: remoteProduct?.productId ?? product.remoteId,
      stock: remoteProduct?.stock ?? product.stock,
      syncStatus: 'synced',
      lastSyncedAt: timestamp,
      updatedAt: timestamp,
    } satisfies LocalProduct;
  });

  await warunginDb.transaction(
    'rw',
    [warunginDb.transactions, warunginDb.transactionItems, warunginDb.products, warunginDb.syncQueue],
    async () => {
      await warunginDb.transactions.put({
        ...group.transaction,
        remoteId: response.transactionId,
        syncStatus: 'synced',
        lastSyncedAt: timestamp,
        updatedAt: timestamp,
      });
      await warunginDb.transactionItems.bulkPut(syncedTransactionItems);
      await warunginDb.products.bulkPut(syncedProducts);

      if (syncedQueueItems.length > 0) {
        await warunginDb.syncQueue.bulkPut(syncedQueueItems);
      }
    }
  );

  return { status: 'synced', response };
}

export async function syncCheckoutTransactionGroup(transactionLocalId: string): Promise<CheckoutSyncResult> {
  const group = await loadCheckoutSyncGroup(transactionLocalId);
  const store = await warunginDb.stores.get(group.transaction.storeId);

  if (!store) {
    return markCheckoutGroupFailed(group, 'Store not found for checkout sync.');
  }

  let payload;
  try {
    payload = buildCheckoutRpcPayload({
      store,
      transaction: group.transaction,
      transactionItems: group.transactionItems,
      products: group.products,
    });
  } catch (error) {
    return markCheckoutGroupFailed(group, error instanceof Error ? error.message : String(error));
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return markCheckoutGroupFailed(group, 'Supabase client is not configured.');
  }

  await markCheckoutGroupSyncing(group);

  const { data, error } = await supabase.rpc('create_transaction_with_stock_update', { payload });

  if (error) {
    return markCheckoutGroupFailed(group, error.message);
  }

  if (!isCheckoutRpcResponse(data)) {
    return markCheckoutGroupFailed(group, 'Checkout RPC returned an invalid response.');
  }

  if (data.ok) {
    return markCheckoutGroupSynced(group, data);
  }

  if (data.code === 'INSUFFICIENT_STOCK' || data.code === 'DUPLICATE_RECEIPT') {
    return markCheckoutGroupConflict(group, data);
  }

  return markCheckoutGroupFailed(group, data.message);
}
