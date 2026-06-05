export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed' | 'conflict';

export type SyncOperation = 'create' | 'update' | 'delete';

export type SyncEntityType =
  | 'profile'
  | 'store'
  | 'category'
  | 'product'
  | 'paymentMethod'
  | 'transaction'
  | 'transactionItem'
  | 'expenseCategory'
  | 'expense'
  | 'receiptAsset'
  | 'onboardingState';

export type PaymentMethodKind = 'cash' | 'qris' | 'transfer' | 'ewallet' | 'other';

export type TransactionStatus = 'completed' | 'cancelled';

export type BusinessType = 'warung' | 'warkop' | 'food_stall' | 'small_shop' | 'other';

export interface SyncableEntity {
  localId: string;
  remoteId?: string;
  storeId: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
  isDeleted?: boolean;
  isSample?: boolean;
}

export interface LocalProfile {
  localId: string;
  remoteId?: string;
  userId?: string;
  displayName?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
}

export interface LocalStore extends SyncableEntity {
  ownerUserId?: string;
  name: string;
  businessType?: BusinessType;
  address?: string;
  phone?: string;
  receiptFooter?: string;
  receiptPrefix: string;
  themeKey?: string;
  onboardingCompleted: boolean;
  demoDataSeeded: boolean;
}

export interface LocalCategory extends SyncableEntity {
  name: string;
  color?: string;
  icon?: string;
  sortOrder: number;
}

export interface LocalProduct extends SyncableEntity {
  categoryLocalId?: string;
  categoryRemoteId?: string;
  name: string;
  price: number;
  hpp: number;
  stock: number;
  unit: string;
  sku?: string;
  barcode?: string;
  photoUrl?: string;
  isActive: boolean;
}

export interface LocalPaymentMethod extends SyncableEntity {
  name: string;
  kind: PaymentMethodKind;
  isDefault: boolean;
  isActive: boolean;
}

export interface LocalTransaction extends SyncableEntity {
  receiptNumber: string;
  transactionDate: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethodLocalId?: string;
  paymentMethodRemoteId?: string;
  paymentMethodSnapshot?: string;
  paymentAmount: number;
  changeAmount: number;
  profitEstimate: number;
  status: TransactionStatus;
  notes?: string;
}

export interface LocalTransactionItem {
  localId: string;
  remoteId?: string;
  transactionLocalId: string;
  transactionRemoteId?: string;
  storeId: string;
  productLocalId?: string;
  productRemoteId?: string;
  productNameSnapshot: string;
  priceSnapshot: number;
  hppSnapshot: number;
  quantity: number;
  subtotal: number;
  profitEstimate: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  syncStatus: SyncStatus;
  lastSyncedAt?: string;
}

export interface LocalExpenseCategory extends SyncableEntity {
  name: string;
  color?: string;
  icon?: string;
  isDefault: boolean;
}

export interface LocalExpense extends SyncableEntity {
  expenseCategoryLocalId?: string;
  expenseCategoryRemoteId?: string;
  expenseDate: string;
  title: string;
  amount: number;
  notes?: string;
}

export interface LocalReceiptAsset {
  id: string;
  transactionLocalId: string;
  transactionRemoteId?: string;
  receiptNumber: string;
  pngBlob?: Blob;
  pngDataUrl?: string;
  shareText: string;
  generatedAt: string;
  expiresAt?: string;
  sharedAt?: string;
  autoDeleteAfterShare?: boolean;
}

export interface SyncQueueItem {
  id: string;
  storeId: string;
  entityType: SyncEntityType;
  entityLocalId: string;
  entityRemoteId?: string;
  operation: SyncOperation;
  payload: Record<string, unknown>;
  status: SyncStatus;
  retryCount: number;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
  syncedAt?: string;
}

export interface SyncState {
  id: string;
  storeId: string;
  entityType: SyncEntityType | 'all';
  lastPulledAt?: string;
  lastPushedAt?: string;
  lastError?: string;
  updatedAt: string;
}

export interface OnboardingState {
  id: string;
  storeId: string;
  currentStep?: string;
  completed: boolean;
  demoDataSeeded: boolean;
  sampleDataResetAt?: string;
  createdAt: string;
  updatedAt: string;
}
