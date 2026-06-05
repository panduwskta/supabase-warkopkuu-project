import type { SyncStatus, SyncableEntity } from './types';

export function createLocalId(prefix = 'local') {
  const randomId = crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomId}`;
}

export function nowIso() {
  return new Date().toISOString();
}

export function createSyncFields(
  storeId: string,
  options: Partial<Pick<SyncableEntity, 'remoteId' | 'syncStatus' | 'isDeleted' | 'isSample'>> = {}
): Pick<SyncableEntity, 'localId' | 'remoteId' | 'storeId' | 'createdAt' | 'updatedAt' | 'syncStatus' | 'isDeleted' | 'isSample'> {
  const timestamp = nowIso();

  return {
    localId: createLocalId(),
    remoteId: options.remoteId,
    storeId,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: options.syncStatus ?? ('pending' satisfies SyncStatus),
    isDeleted: options.isDeleted ?? false,
    isSample: options.isSample ?? false,
  };
}
