import {
  createLocalId,
  nowIso,
  warunginDb,
  type SyncEntityType,
  type SyncOperation,
  type SyncQueueItem,
  type SyncStatus,
} from '@/lib/db';

export interface EnqueueSyncQueueInput {
  storeId: string;
  entityType: SyncEntityType;
  entityLocalId: string;
  entityRemoteId?: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
}

export interface ListSyncQueueOptions {
  storeId?: string;
  statuses?: SyncStatus[];
}

function sortOldestFirst(a: SyncQueueItem, b: SyncQueueItem) {
  return a.createdAt.localeCompare(b.createdAt) || a.updatedAt.localeCompare(b.updatedAt);
}

function isActiveQueueStatus(status: SyncStatus) {
  return status === 'pending' || status === 'syncing' || status === 'failed' || status === 'conflict';
}

async function findExistingQueueItem(input: EnqueueSyncQueueInput) {
  const queueItems = await warunginDb.syncQueue.where({ storeId: input.storeId }).toArray();

  return queueItems.find(
    (item) =>
      item.entityType === input.entityType &&
      item.entityLocalId === input.entityLocalId &&
      item.operation === input.operation &&
      isActiveQueueStatus(item.status)
  );
}

export async function enqueueSyncQueueItem(input: EnqueueSyncQueueInput): Promise<SyncQueueItem> {
  const timestamp = nowIso();
  const existing = await findExistingQueueItem(input);

  const queueItem = {
    id: existing?.id ?? createLocalId('sync-queue'),
    storeId: input.storeId,
    entityType: input.entityType,
    entityLocalId: input.entityLocalId,
    entityRemoteId: input.entityRemoteId,
    operation: input.operation,
    payload: input.payload,
    status: 'pending',
    retryCount: existing?.retryCount ?? 0,
    createdAt: existing?.createdAt ?? timestamp,
    updatedAt: timestamp,
  } satisfies SyncQueueItem;

  await warunginDb.syncQueue.put(queueItem);
  return queueItem;
}

export async function enqueueSyncQueueItems(inputs: EnqueueSyncQueueInput[]): Promise<SyncQueueItem[]> {
  const queueItems: SyncQueueItem[] = [];

  for (const input of inputs) {
    queueItems.push(await enqueueSyncQueueItem(input));
  }

  return queueItems;
}

export async function listSyncQueueItems(options: ListSyncQueueOptions = {}) {
  const queueItems = options.storeId
    ? await warunginDb.syncQueue.where({ storeId: options.storeId }).toArray()
    : await warunginDb.syncQueue.toArray();

  return queueItems
    .filter((item) => (options.statuses?.length ? options.statuses.includes(item.status) : true))
    .sort(sortOldestFirst);
}

export async function listPendingSyncQueueItems(storeId?: string) {
  return listSyncQueueItems({ storeId, statuses: ['pending', 'failed'] });
}

export async function markSyncQueueItemSyncing(id: string) {
  const existing = await warunginDb.syncQueue.get(id);
  if (!existing) throw new Error('Sync queue item not found.');

  const updated = {
    ...existing,
    status: 'syncing',
    updatedAt: nowIso(),
  } satisfies SyncQueueItem;

  await warunginDb.syncQueue.put(updated);
  return updated;
}

export async function markSyncQueueItemSynced(id: string, entityRemoteId?: string) {
  const existing = await warunginDb.syncQueue.get(id);
  if (!existing) throw new Error('Sync queue item not found.');

  const timestamp = nowIso();
  const updated = {
    ...existing,
    entityRemoteId: entityRemoteId ?? existing.entityRemoteId,
    status: 'synced',
    lastError: undefined,
    updatedAt: timestamp,
    syncedAt: timestamp,
  } satisfies SyncQueueItem;

  await warunginDb.syncQueue.put(updated);
  return updated;
}

export async function markSyncQueueItemFailed(id: string, error: unknown) {
  const existing = await warunginDb.syncQueue.get(id);
  if (!existing) throw new Error('Sync queue item not found.');

  const updated = {
    ...existing,
    status: 'failed',
    retryCount: existing.retryCount + 1,
    lastError: error instanceof Error ? error.message : String(error),
    updatedAt: nowIso(),
  } satisfies SyncQueueItem;

  await warunginDb.syncQueue.put(updated);
  return updated;
}

export async function resetFailedSyncQueueItems(storeId?: string) {
  const failedItems = await listSyncQueueItems({ storeId, statuses: ['failed'] });
  const timestamp = nowIso();
  const resetItems = failedItems.map(
    (item) =>
      ({
        ...item,
        status: 'pending',
        lastError: undefined,
        updatedAt: timestamp,
      }) satisfies SyncQueueItem
  );

  if (resetItems.length > 0) {
    await warunginDb.syncQueue.bulkPut(resetItems);
  }

  return resetItems;
}
