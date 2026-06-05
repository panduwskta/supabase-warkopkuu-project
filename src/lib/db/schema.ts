export const WARUNGIN_DB_NAME = 'warungin-local-v2';
export const WARUNGIN_DB_VERSION = 1;

export const warunginDbStores = {
  profiles: 'localId, remoteId, userId, email, syncStatus, updatedAt, lastSyncedAt',
  stores: 'localId, remoteId, ownerUserId, name, receiptPrefix, syncStatus, updatedAt, deletedAt, isDeleted, lastSyncedAt',
  categories: 'localId, remoteId, storeId, name, sortOrder, syncStatus, updatedAt, deletedAt, isDeleted, isSample, lastSyncedAt',
  products:
    'localId, remoteId, storeId, categoryLocalId, categoryRemoteId, name, sku, barcode, isActive, syncStatus, updatedAt, deletedAt, isDeleted, isSample, lastSyncedAt',
  paymentMethods:
    'localId, remoteId, storeId, kind, isDefault, isActive, syncStatus, updatedAt, deletedAt, isDeleted, lastSyncedAt',
  transactions:
    'localId, remoteId, storeId, receiptNumber, transactionDate, status, syncStatus, updatedAt, deletedAt, isDeleted, isSample, lastSyncedAt',
  transactionItems:
    'localId, remoteId, transactionLocalId, transactionRemoteId, storeId, productLocalId, productRemoteId, syncStatus, updatedAt, lastSyncedAt',
  expenseCategories:
    'localId, remoteId, storeId, name, isDefault, syncStatus, updatedAt, deletedAt, isDeleted, isSample, lastSyncedAt',
  expenses:
    'localId, remoteId, storeId, expenseCategoryLocalId, expenseCategoryRemoteId, expenseDate, syncStatus, updatedAt, deletedAt, isDeleted, isSample, lastSyncedAt',
  receiptAssets: 'id, transactionLocalId, transactionRemoteId, receiptNumber, generatedAt, expiresAt, sharedAt',
  syncQueue: 'id, storeId, entityType, entityLocalId, entityRemoteId, operation, status, retryCount, createdAt, updatedAt, syncedAt',
  syncState: 'id, storeId, entityType, lastPulledAt, lastPushedAt, updatedAt',
  onboardingState: 'id, storeId, currentStep, completed, demoDataSeeded, updatedAt',
} as const;
