import Dexie, { type EntityTable } from 'dexie';

import { WARUNGIN_DB_NAME, WARUNGIN_DB_VERSION, warunginDbStores } from './schema';
import type {
  LocalCategory,
  LocalExpense,
  LocalExpenseCategory,
  LocalPaymentMethod,
  LocalProduct,
  LocalProfile,
  LocalReceiptAsset,
  LocalStore,
  LocalTransaction,
  LocalTransactionItem,
  OnboardingState,
  SyncQueueItem,
  SyncState,
} from './types';

export class WarunginLocalDatabase extends Dexie {
  profiles!: EntityTable<LocalProfile, 'localId'>;
  stores!: EntityTable<LocalStore, 'localId'>;
  categories!: EntityTable<LocalCategory, 'localId'>;
  products!: EntityTable<LocalProduct, 'localId'>;
  paymentMethods!: EntityTable<LocalPaymentMethod, 'localId'>;
  transactions!: EntityTable<LocalTransaction, 'localId'>;
  transactionItems!: EntityTable<LocalTransactionItem, 'localId'>;
  expenseCategories!: EntityTable<LocalExpenseCategory, 'localId'>;
  expenses!: EntityTable<LocalExpense, 'localId'>;
  receiptAssets!: EntityTable<LocalReceiptAsset, 'id'>;
  syncQueue!: EntityTable<SyncQueueItem, 'id'>;
  syncState!: EntityTable<SyncState, 'id'>;
  onboardingState!: EntityTable<OnboardingState, 'id'>;

  constructor() {
    super(WARUNGIN_DB_NAME);
    this.version(WARUNGIN_DB_VERSION).stores(warunginDbStores);
  }
}

export const warunginDb = new WarunginLocalDatabase();
