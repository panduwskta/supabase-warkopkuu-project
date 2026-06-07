import type { SyncEntityType } from '@/lib/db';

export type SimpleSyncEntityType = Extract<
  SyncEntityType,
  'store' | 'category' | 'product' | 'paymentMethod' | 'expenseCategory' | 'expense'
>;

export interface EntitySyncResult {
  entityType: SimpleSyncEntityType | 'profile';
  localId: string;
  status: 'synced' | 'failed' | 'skipped';
  error?: string;
}

export interface SyncRunResult {
  ok: boolean;
  synced: number;
  failed: number;
  skipped: number;
  errors: string[];
  results: EntitySyncResult[];
}
