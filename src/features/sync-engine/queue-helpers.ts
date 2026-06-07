import { nowIso, warunginDb, type SyncEntityType, type SyncQueueItem } from '@/lib/db';

export async function markRelatedQueueItemsSynced(entityType: SyncEntityType, entityLocalId: string, entityRemoteId?: string) {
  const timestamp = nowIso();
  const queueItems = await warunginDb.syncQueue
    .where({ entityLocalId })
    .filter((item) => item.entityType === entityType && item.status !== 'synced')
    .toArray();

  if (!queueItems.length) return;

  const syncedItems: SyncQueueItem[] = queueItems.map((item) => ({
    ...item,
    entityRemoteId: entityRemoteId ?? item.entityRemoteId,
    status: 'synced',
    lastError: undefined,
    updatedAt: timestamp,
    syncedAt: timestamp,
  }));

  await warunginDb.syncQueue.bulkPut(syncedItems);
}

export async function markRelatedQueueItemsFailed(entityType: SyncEntityType, entityLocalId: string, error: unknown) {
  const timestamp = nowIso();
  const message = error instanceof Error ? error.message : String(error);
  const queueItems = await warunginDb.syncQueue
    .where({ entityLocalId })
    .filter((item) => item.entityType === entityType && item.status !== 'synced')
    .toArray();

  if (!queueItems.length) return;

  const failedItems: SyncQueueItem[] = queueItems.map((item) => ({
    ...item,
    status: 'failed',
    retryCount: item.retryCount + 1,
    lastError: message,
    updatedAt: timestamp,
  }));

  await warunginDb.syncQueue.bulkPut(failedItems);
}
