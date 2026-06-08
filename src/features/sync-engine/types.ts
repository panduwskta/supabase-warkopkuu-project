import type { SyncEntityType } from '@/lib/db';

export type SimpleSyncEntityType = Extract<
  SyncEntityType,
  'store' | 'category' | 'product' | 'paymentMethod' | 'expenseCategory' | 'expense'
>;

export interface EntitySyncResult {
  entityType: SimpleSyncEntityType | 'profile' | 'checkout';
  localId: string;
  status: 'synced' | 'failed' | 'skipped' | 'conflict';
  error?: string;
}

export interface SyncRunResult {
  ok: boolean;
  synced: number;
  failed: number;
  conflict: number;
  skipped: number;
  errors: string[];
  results: EntitySyncResult[];
}
