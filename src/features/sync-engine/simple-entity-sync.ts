import { getSupabaseClient } from '@/lib/supabase';
import {
  nowIso,
  warunginDb,
  type LocalCategory,
  type LocalExpense,
  type LocalExpenseCategory,
  type LocalPaymentMethod,
  type LocalProduct,
  type LocalStore,
  type SyncableEntity,
} from '@/lib/db';
import { markRelatedQueueItemsFailed, markRelatedQueueItemsSynced } from './queue-helpers';
import type { EntitySyncResult, SimpleSyncEntityType } from './types';

function shouldSync(entity: SyncableEntity) {
  return entity.syncStatus === 'pending' || entity.syncStatus === 'failed' || !entity.remoteId;
}

function remoteStoreId(store: LocalStore) {
  if (!store.remoteId) throw new Error('Remote store belum tersedia. Jalankan bootstrap sync dulu.');
  return store.remoteId;
}

async function markEntitySynced<T extends SyncableEntity>(put: (value: T) => Promise<unknown>, entity: T, remoteId: string) {
  const timestamp = nowIso();
  const synced = {
    ...entity,
    remoteId,
    syncStatus: 'synced' as const,
    lastSyncedAt: timestamp,
    updatedAt: timestamp,
  };
  await put(synced as T);
  return synced as T;
}

async function markEntityFailed<T extends SyncableEntity>(put: (value: T) => Promise<unknown>, entity: T) {
  const failed = {
    ...entity,
    syncStatus: 'failed' as const,
    updatedAt: nowIso(),
  };
  await put(failed as T);
}

const putCategory = (value: LocalCategory) => warunginDb.categories.put(value);
const putPaymentMethod = (value: LocalPaymentMethod) => warunginDb.paymentMethods.put(value);
const putExpenseCategory = (value: LocalExpenseCategory) => warunginDb.expenseCategories.put(value);
const putProduct = (value: LocalProduct) => warunginDb.products.put(value);
const putExpense = (value: LocalExpense) => warunginDb.expenses.put(value);

function categoryPayload(category: LocalCategory, store: LocalStore) {
  return {
    store_id: remoteStoreId(store),
    name: category.name,
    color: category.color ?? null,
    icon: category.icon ?? null,
    sort_order: category.sortOrder,
    deleted_at: category.deletedAt ?? null,
    is_deleted: category.isDeleted ?? false,
    is_sample: category.isSample ?? false,
  };
}

function paymentMethodPayload(method: LocalPaymentMethod, store: LocalStore) {
  return {
    store_id: remoteStoreId(store),
    name: method.name,
    kind: method.kind,
    is_default: method.isDefault,
    is_active: method.isActive,
    deleted_at: method.deletedAt ?? null,
  };
}

function expenseCategoryPayload(category: LocalExpenseCategory, store: LocalStore) {
  return {
    store_id: remoteStoreId(store),
    name: category.name,
    color: category.color ?? null,
    icon: category.icon ?? null,
    is_default: category.isDefault,
    deleted_at: category.deletedAt ?? null,
    is_deleted: category.isDeleted ?? false,
    is_sample: category.isSample ?? false,
  };
}

async function productPayload(product: LocalProduct, store: LocalStore) {
  let categoryRemoteId = product.categoryRemoteId;
  if (!categoryRemoteId && product.categoryLocalId) {
    const category = await warunginDb.categories.get(product.categoryLocalId);
    categoryRemoteId = category?.remoteId;
  }

  return {
    store_id: remoteStoreId(store),
    category_id: categoryRemoteId ?? null,
    name: product.name,
    price: product.price,
    hpp: product.hpp,
    stock: product.stock,
    unit: product.unit,
    sku: product.sku ?? null,
    barcode: product.barcode ?? null,
    photo_url: product.photoUrl ?? null,
    is_active: product.isActive,
    deleted_at: product.deletedAt ?? null,
    is_deleted: product.isDeleted ?? false,
    is_sample: product.isSample ?? false,
  };
}

async function expensePayload(expense: LocalExpense, store: LocalStore) {
  let expenseCategoryRemoteId = expense.expenseCategoryRemoteId;
  if (!expenseCategoryRemoteId && expense.expenseCategoryLocalId) {
    const category = await warunginDb.expenseCategories.get(expense.expenseCategoryLocalId);
    expenseCategoryRemoteId = category?.remoteId;
  }

  return {
    store_id: remoteStoreId(store),
    expense_category_id: expenseCategoryRemoteId ?? null,
    expense_date: expense.expenseDate,
    title: expense.title,
    amount: expense.amount,
    notes: expense.notes ?? null,
    deleted_at: expense.deletedAt ?? null,
    is_deleted: expense.isDeleted ?? false,
    is_sample: expense.isSample ?? false,
  };
}

async function upsertRemote(tableName: string, remoteId: string | undefined, payload: Record<string, unknown>) {
  const supabase = getSupabaseClient();
  if (!supabase) throw new Error('Supabase belum dikonfigurasi.');

  if (remoteId) {
    const { error } = await supabase.from(tableName).update(payload).eq('id', remoteId);
    if (error) throw error;
    return remoteId;
  }

  const { data, error } = await supabase.from(tableName).insert(payload).select('id').single();
  if (error) throw error;
  return data.id as string;
}

export async function syncCategory(category: LocalCategory, store: LocalStore): Promise<EntitySyncResult> {
  if (!shouldSync(category)) return { entityType: 'category', localId: category.localId, status: 'skipped' };
  try {
    const remoteId = await upsertRemote('categories', category.remoteId, categoryPayload(category, store));
    await markEntitySynced(putCategory, category, remoteId);
    await markRelatedQueueItemsSynced('category', category.localId, remoteId);
    return { entityType: 'category', localId: category.localId, status: 'synced' };
  } catch (error) {
    await markEntityFailed(putCategory, category);
    await markRelatedQueueItemsFailed('category', category.localId, error);
    return { entityType: 'category', localId: category.localId, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function syncPaymentMethod(method: LocalPaymentMethod, store: LocalStore): Promise<EntitySyncResult> {
  if (!shouldSync(method)) return { entityType: 'paymentMethod', localId: method.localId, status: 'skipped' };
  try {
    const remoteId = await upsertRemote('payment_methods', method.remoteId, paymentMethodPayload(method, store));
    await markEntitySynced(putPaymentMethod, method, remoteId);
    await markRelatedQueueItemsSynced('paymentMethod', method.localId, remoteId);
    return { entityType: 'paymentMethod', localId: method.localId, status: 'synced' };
  } catch (error) {
    await markEntityFailed(putPaymentMethod, method);
    await markRelatedQueueItemsFailed('paymentMethod', method.localId, error);
    return { entityType: 'paymentMethod', localId: method.localId, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function syncExpenseCategory(category: LocalExpenseCategory, store: LocalStore): Promise<EntitySyncResult> {
  if (!shouldSync(category)) return { entityType: 'expenseCategory', localId: category.localId, status: 'skipped' };
  try {
    const remoteId = await upsertRemote('expense_categories', category.remoteId, expenseCategoryPayload(category, store));
    await markEntitySynced(putExpenseCategory, category, remoteId);
    await markRelatedQueueItemsSynced('expenseCategory', category.localId, remoteId);
    return { entityType: 'expenseCategory', localId: category.localId, status: 'synced' };
  } catch (error) {
    await markEntityFailed(putExpenseCategory, category);
    await markRelatedQueueItemsFailed('expenseCategory', category.localId, error);
    return { entityType: 'expenseCategory', localId: category.localId, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function syncProduct(product: LocalProduct, store: LocalStore): Promise<EntitySyncResult> {
  if (!shouldSync(product)) return { entityType: 'product', localId: product.localId, status: 'skipped' };
  try {
    const payload = await productPayload(product, store);
    const remoteId = await upsertRemote('products', product.remoteId, payload);
    const synced = await markEntitySynced(putProduct, { ...product, categoryRemoteId: payload.category_id as string | undefined }, remoteId);
    await markRelatedQueueItemsSynced('product', synced.localId, remoteId);
    return { entityType: 'product', localId: product.localId, status: 'synced' };
  } catch (error) {
    await markEntityFailed(putProduct, product);
    await markRelatedQueueItemsFailed('product', product.localId, error);
    return { entityType: 'product', localId: product.localId, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function syncExpense(expense: LocalExpense, store: LocalStore): Promise<EntitySyncResult> {
  if (!shouldSync(expense)) return { entityType: 'expense', localId: expense.localId, status: 'skipped' };
  try {
    const payload = await expensePayload(expense, store);
    const remoteId = await upsertRemote('expenses', expense.remoteId, payload);
    const synced = await markEntitySynced(putExpense, { ...expense, expenseCategoryRemoteId: payload.expense_category_id as string | undefined }, remoteId);
    await markRelatedQueueItemsSynced('expense', synced.localId, remoteId);
    return { entityType: 'expense', localId: expense.localId, status: 'synced' };
  } catch (error) {
    await markEntityFailed(putExpense, expense);
    await markRelatedQueueItemsFailed('expense', expense.localId, error);
    return { entityType: 'expense', localId: expense.localId, status: 'failed', error: error instanceof Error ? error.message : String(error) };
  }
}

export async function loadSimpleEntities(storeId: string) {
  const [categories, paymentMethods, expenseCategories, products, expenses] = await Promise.all([
    warunginDb.categories.where({ storeId }).toArray(),
    warunginDb.paymentMethods.where({ storeId }).toArray(),
    warunginDb.expenseCategories.where({ storeId }).toArray(),
    warunginDb.products.where({ storeId }).toArray(),
    warunginDb.expenses.where({ storeId }).toArray(),
  ]);

  return { categories, paymentMethods, expenseCategories, products, expenses };
}

export const SIMPLE_ENTITY_ORDER: SimpleSyncEntityType[] = ['category', 'paymentMethod', 'expenseCategory', 'product', 'expense'];
