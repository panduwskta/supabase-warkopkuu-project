import { checkoutLocal } from '@/features/cashier';
import type { CartItem } from '@/features/cashier';
import { ensureOnboardingState as ensureWizardOnboardingState, seedSampleData } from '@/features/onboarding';
import { createCategory, createProduct, deactivateProduct, listCategories, listActiveProducts, updateProduct } from '@/features/products';
import { enqueueSyncQueueItem } from '@/features/sync-queue';
import {
  createLocalId,
  createSyncFields,
  nowIso,
  warunginDb,
  type LocalCategory,
  type LocalExpense,
  type LocalExpenseCategory,
  type LocalPaymentMethod,
  type LocalProduct,
  type LocalStore,
  type LocalTransaction,
  type LocalTransactionItem,
} from '@/lib/db';

const DEFAULT_CATEGORIES = ['Minuman', 'Makanan', 'Cemilan', 'Paket'];
const DEFAULT_EXPENSE_CATEGORIES = ['Belanja Bahan', 'Operasional', 'Gaji', 'Sewa', 'Lainnya'];

export interface AppUserLike {
  id?: string;
  email?: string;
  name?: string;
  user_metadata?: {
    name?: string;
  };
}

export interface MenuViewItem {
  id: string;
  name: string;
  price: number;
  hpp: number;
  category: string;
  categoryLocalId?: string;
  stock: number;
  syncStatus?: string;
}

export interface OrderViewItem {
  id?: string;
  name: string;
  qty: number;
  price: number;
  hppSnapshot?: number;
  _receipt_no?: string;
  _paid_amount?: number;
  _change_amount?: number;
}

export interface OrderView {
  id: string;
  timestamp: number;
  items: OrderViewItem[];
  total: number;
  paymentMethodSnapshot?: string;
  paymentMethodKind?: LocalPaymentMethod['kind'];
  syncStatus?: string;
}

export interface PaymentMethodView {
  id: string;
  name: string;
  kind: LocalPaymentMethod['kind'];
  isDefault: boolean;
}

export interface ExpenseView {
  id: string;
  name: string;
  amount: number;
  category: string;
  timestamp: number;
  syncStatus?: string;
}

function userName(user: AppUserLike) {
  return user.user_metadata?.name || user.name || user.email?.split('@')[0] || 'Warungin';
}

function categoryName(product: LocalProduct, categories: LocalCategory[]) {
  return categories.find((category) => category.localId === product.categoryLocalId)?.name || 'Menu';
}

function expenseCategoryName(expense: LocalExpense, categories: LocalExpenseCategory[]) {
  return categories.find((category) => category.localId === expense.expenseCategoryLocalId)?.name || 'Lainnya';
}

function transactionTimestamp(transaction: LocalTransaction) {
  return new Date(transaction.transactionDate).getTime();
}

function toMenuView(product: LocalProduct, categories: LocalCategory[]): MenuViewItem {
  return {
    id: product.localId,
    name: product.name,
    price: product.price,
    hpp: product.hpp ?? 0,
    category: categoryName(product, categories),
    categoryLocalId: product.categoryLocalId,
    stock: product.stock ?? 0,
    syncStatus: product.syncStatus,
  };
}

function toOrderView(transaction: LocalTransaction, items: LocalTransactionItem[]): OrderView {
  return {
    id: transaction.localId,
    timestamp: transactionTimestamp(transaction),
    total: transaction.total,
    paymentMethodSnapshot: transaction.paymentMethodSnapshot,
    paymentMethodKind: transaction.paymentMethodKind,
    syncStatus: transaction.syncStatus,
    items: items.map((item) => ({
      id: item.productLocalId,
      name: item.productNameSnapshot,
      qty: item.quantity,
      price: item.priceSnapshot,
      hppSnapshot: item.hppSnapshot,
      _receipt_no: transaction.receiptNumber,
      _paid_amount: transaction.paymentAmount,
      _change_amount: transaction.changeAmount,
    })),
  };
}

function toExpenseView(expense: LocalExpense, categories: LocalExpenseCategory[]): ExpenseView {
  return {
    id: expense.localId,
    name: expense.title,
    amount: expense.amount,
    category: expenseCategoryName(expense, categories),
    timestamp: new Date(expense.expenseDate).getTime(),
    syncStatus: expense.syncStatus,
  };
}

async function findOrCreateCategory(storeId: string, name: string) {
  const normalized = name.trim() || 'Menu';
  const categories = await listCategories(storeId);
  const existing = categories.find((category) => category.name.toLowerCase() === normalized.toLowerCase());
  if (existing) return existing;
  const category = await createCategory({ storeId, name: normalized, sortOrder: categories.length });
  await enqueueSyncQueueItem({
    storeId,
    entityType: 'category',
    entityLocalId: category.localId,
    operation: 'create',
    payload: { ...category },
  });
  return category;
}

async function findOrCreateExpenseCategory(storeId: string, name: string) {
  const normalized = name.trim() || 'Lainnya';
  const categories = await warunginDb.expenseCategories.where({ storeId }).toArray();
  const existing = categories.find((category) => !category.isDeleted && category.name.toLowerCase() === normalized.toLowerCase());
  if (existing) return existing;

  const timestamp = nowIso();
  const category = {
    ...createSyncFields(storeId),
    localId: createLocalId('expense-category'),
    name: normalized,
    isDefault: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies LocalExpenseCategory;

  await warunginDb.expenseCategories.add(category);
  await enqueueSyncQueueItem({
    storeId,
    entityType: 'expenseCategory',
    entityLocalId: category.localId,
    operation: 'create',
    payload: { ...category },
  });
  return category;
}

async function ensureDefaultCategories(storeId: string) {
  const existing = await listCategories(storeId);
  for (const [index, name] of DEFAULT_CATEGORIES.entries()) {
    const category = existing.find((item) => item.name.toLowerCase() === name.toLowerCase());
    const defaultCategory = category ?? (await createCategory({ storeId, name, sortOrder: index, isSample: true }));

    if (defaultCategory.syncStatus !== 'synced' || !defaultCategory.remoteId) {
      await enqueueSyncQueueItem({
        storeId,
        entityType: 'category',
        entityLocalId: defaultCategory.localId,
        operation: defaultCategory.remoteId ? 'update' : 'create',
        payload: { ...defaultCategory },
      });
    }
  }
}

async function ensureDefaultPaymentMethods(storeId: string) {
  const existing = await warunginDb.paymentMethods.where({ storeId }).toArray();
  const activeMethods = existing.filter((method) => !method.isDeleted && !method.deletedAt);

  const timestamp = nowIso();
  const defaults = [
    { name: 'Tunai', kind: 'cash', isDefault: true },
    { name: 'QRIS', kind: 'qris', isDefault: false },
    { name: 'Transfer', kind: 'transfer', isDefault: false },
    { name: 'E-wallet', kind: 'ewallet', isDefault: false },
  ];

  for (const method of defaults) {
    const existingMethod = activeMethods.find((item) => item.name.toLowerCase() === method.name.toLowerCase());
    const defaultMethod =
      existingMethod ??
      ({
        ...createSyncFields(storeId, { isSample: true }),
        localId: createLocalId('payment-method'),
        name: method.name,
        kind: method.kind as LocalPaymentMethod['kind'],
        isDefault: method.isDefault,
        isActive: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      } satisfies LocalPaymentMethod);

    if (!existingMethod) await warunginDb.paymentMethods.add(defaultMethod);

    if (defaultMethod.syncStatus !== 'synced' || !defaultMethod.remoteId) {
      await enqueueSyncQueueItem({
        storeId,
        entityType: 'paymentMethod',
        entityLocalId: defaultMethod.localId,
        operation: defaultMethod.remoteId ? 'update' : 'create',
        payload: { ...defaultMethod },
      });
    }
  }
}

async function ensureDefaultExpenseCategories(storeId: string) {
  const existing = await warunginDb.expenseCategories.where({ storeId }).toArray();
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    const category = existing.find((item) => !item.isDeleted && !item.deletedAt && item.name.toLowerCase() === name.toLowerCase());
    let defaultCategory = category;

    if (!defaultCategory) {
      const timestamp = nowIso();
      defaultCategory = {
        ...createSyncFields(storeId, { isSample: true }),
        localId: createLocalId('expense-category'),
        name,
        isDefault: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      } satisfies LocalExpenseCategory;
      await warunginDb.expenseCategories.add(defaultCategory);
    }

    if (defaultCategory.syncStatus !== 'synced' || !defaultCategory.remoteId) {
      await enqueueSyncQueueItem({
        storeId,
        entityType: 'expenseCategory',
        entityLocalId: defaultCategory.localId,
        operation: defaultCategory.remoteId ? 'update' : 'create',
        payload: { ...defaultCategory },
      });
    }
  }
}

export async function ensureLocalV2Store(user: AppUserLike): Promise<LocalStore> {
  const ownerUserId = user.id || user.email || 'local-user';
  const existing = await warunginDb.stores.where({ ownerUserId }).first();
  if (existing && !existing.isDeleted) {
    await Promise.all([
      ensureDefaultCategories(existing.localId),
      ensureDefaultPaymentMethods(existing.localId),
      ensureDefaultExpenseCategories(existing.localId),
      ensureWizardOnboardingState(existing.localId),
    ]);
    return existing;
  }

  const timestamp = nowIso();
  const store = {
    ...createSyncFields('pending-store'),
    localId: createLocalId('store'),
    storeId: '',
    ownerUserId,
    name: userName(user),
    businessType: 'warung',
    receiptPrefix: 'WRG',
    onboardingCompleted: false,
    demoDataSeeded: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies LocalStore;
  store.storeId = store.localId;

  await warunginDb.stores.add(store);
  await enqueueSyncQueueItem({
    storeId: store.localId,
    entityType: 'store',
    entityLocalId: store.localId,
    operation: 'create',
    payload: { ...store },
  });
  await Promise.all([
    ensureDefaultCategories(store.localId),
    ensureDefaultPaymentMethods(store.localId),
    ensureDefaultExpenseCategories(store.localId),
    ensureWizardOnboardingState(store.localId),
  ]);
  return store;
}

async function repairBypassedOnboardingIfEmpty(store: LocalStore) {
  if (!store.onboardingCompleted) return store;

  const state = await warunginDb.onboardingState.where({ storeId: store.localId }).first();
  if (state?.currentStep !== 'local-v2-cutover') return store;

  const [productCount, transactionCount, expenseCount] = await Promise.all([
    warunginDb.products.where({ storeId: store.localId }).count(),
    warunginDb.transactions.where({ storeId: store.localId }).count(),
    warunginDb.expenses.where({ storeId: store.localId }).count(),
  ]);

  if (productCount + transactionCount + expenseCount > 0) return store;

  const timestamp = nowIso();
  const repairedStore = { ...store, onboardingCompleted: false, updatedAt: timestamp } satisfies LocalStore;
  await Promise.all([
    warunginDb.stores.put(repairedStore),
    warunginDb.onboardingState.put({ ...state, currentStep: 'sample-data', completed: false, updatedAt: timestamp }),
  ]);

  return repairedStore;
}

export async function completeLocalV2Onboarding(storeId: string, options: { seedDemoData?: boolean } = {}) {
  const store = await warunginDb.stores.get(storeId);
  if (!store) throw new Error('Local store belum siap.');

  if (options.seedDemoData) {
    await seedSampleData({ storeId, ownerUserId: store.ownerUserId, resetExistingSampleData: true });
  }

  const state = await ensureWizardOnboardingState(storeId);
  const timestamp = nowIso();
  const updatedStore = {
    ...store,
    onboardingCompleted: true,
    demoDataSeeded: options.seedDemoData ? true : store.demoDataSeeded,
    updatedAt: timestamp,
  } satisfies LocalStore;

  await Promise.all([
    warunginDb.stores.put(updatedStore),
    warunginDb.onboardingState.put({
      ...state,
      currentStep: 'completed',
      completed: true,
      demoDataSeeded: options.seedDemoData ? true : state.demoDataSeeded,
      updatedAt: timestamp,
    }),
  ]);

  return updatedStore;
}

export async function loadLocalV2AppData(storeId: string) {
  const [rawStore, onboardingState, categories, products, transactions, transactionItems, expenses, expenseCategories, paymentMethods, syncQueue] = await Promise.all([
    warunginDb.stores.get(storeId),
    warunginDb.onboardingState.where({ storeId }).first(),
    listCategories(storeId),
    listActiveProducts(storeId),
    warunginDb.transactions.where({ storeId }).toArray(),
    warunginDb.transactionItems.where({ storeId }).toArray(),
    warunginDb.expenses.where({ storeId }).toArray(),
    warunginDb.expenseCategories.where({ storeId }).toArray(),
    warunginDb.paymentMethods.where({ storeId }).toArray(),
    warunginDb.syncQueue.where({ storeId }).toArray(),
  ]);

  const activeExpenses = expenses.filter((expense) => !expense.isDeleted && !expense.deletedAt);
  const activeExpenseCategories = expenseCategories.filter((category) => !category.isDeleted && !category.deletedAt);
  const store = rawStore ? await repairBypassedOnboardingIfEmpty(rawStore) : rawStore;

  return {
    store,
    onboardingState,
    menu: products.map((product) => toMenuView(product, categories)),
    orders: transactions
      .filter((transaction) => !transaction.isDeleted && !transaction.deletedAt)
      .map((transaction) => toOrderView(transaction, transactionItems.filter((item) => item.transactionLocalId === transaction.localId)))
      .sort((a, b) => b.timestamp - a.timestamp),
    expenses: activeExpenses.map((expense) => toExpenseView(expense, activeExpenseCategories)).sort((a, b) => b.timestamp - a.timestamp),
    paymentMethods: paymentMethods
      .filter((method) => !method.isDeleted && !method.deletedAt && method.isActive)
      .sort((a, b) => Number(b.isDefault) - Number(a.isDefault) || a.name.localeCompare(b.name))
      .map(
        (method) =>
          ({
            id: method.localId,
            name: method.name,
            kind: method.kind,
            isDefault: method.isDefault,
          }) satisfies PaymentMethodView
      ),
    syncSummary: {
      pending: syncQueue.filter((item) => item.status === 'pending').length,
      syncing: syncQueue.filter((item) => item.status === 'syncing').length,
      failed: syncQueue.filter((item) => item.status === 'failed').length,
      conflict: syncQueue.filter((item) => item.status === 'conflict').length,
      pendingSetup: syncQueue.filter((item) => item.status === 'pending' && item.entityType === 'store').length,
    },
  };
}

export async function createMenuProduct(storeId: string, input: { name: string; price: number; hpp?: number; category: string; stock?: number }) {
  const category = await findOrCreateCategory(storeId, input.category);
  const product = await createProduct({
    storeId,
    categoryLocalId: category.localId,
    name: input.name,
    price: input.price,
    hpp: input.hpp ?? 0,
    stock: input.stock ?? 0,
    unit: 'pcs',
  });
  await enqueueSyncQueueItem({
    storeId,
    entityType: 'product',
    entityLocalId: product.localId,
    operation: 'create',
    payload: { ...product },
  });
  return product;
}

export async function updateMenuProduct(localId: string, input: { name: string; price: number; hpp?: number; category: string; stock?: number }) {
  const existing = await warunginDb.products.get(localId);
  if (!existing) throw new Error('Product not found.');
  const category = await findOrCreateCategory(existing.storeId, input.category);
  const product = await updateProduct(localId, {
    categoryLocalId: category.localId,
    name: input.name,
    price: input.price,
    hpp: input.hpp ?? 0,
    stock: input.stock ?? 0,
    unit: 'pcs',
  });
  await enqueueSyncQueueItem({
    storeId: product.storeId,
    entityType: 'product',
    entityLocalId: product.localId,
    operation: 'update',
    payload: { ...product },
  });
  return product;
}

export async function deleteMenuProduct(localId: string) {
  const product = await deactivateProduct(localId);
  await enqueueSyncQueueItem({
    storeId: product.storeId,
    entityType: 'product',
    entityLocalId: product.localId,
    operation: 'delete',
    payload: { ...product },
  });
  return product;
}

export async function checkoutCartLocal(
  store: LocalStore,
  cart: Array<{ id: string; qty: number }>,
  paymentAmount: number,
  paymentMethodLocalId?: string
) {
  const cartItems: CartItem[] = cart.map((item) => ({ productLocalId: item.id, quantity: item.qty }));
  const selectedPaymentMethod = paymentMethodLocalId ? await warunginDb.paymentMethods.get(paymentMethodLocalId) : undefined;
  const fallbackPaymentMethod = selectedPaymentMethod
    ? undefined
    : await warunginDb.paymentMethods.where({ storeId: store.localId }).filter((method) => !method.isDeleted && method.isDefault).first();
  const paymentMethod = selectedPaymentMethod ?? fallbackPaymentMethod;

  return checkoutLocal({
    storeId: store.localId,
    cartItems,
    paymentAmount,
    paymentMethodLocalId: paymentMethod?.localId,
    paymentMethodRemoteId: paymentMethod?.remoteId,
    paymentMethodSnapshot: paymentMethod?.name ?? 'Tunai',
    paymentMethodKind: paymentMethod?.kind ?? 'cash',
    receiptPrefix: store.receiptPrefix || 'WRG',
  });
}

export async function createExpenseLocal(storeId: string, input: { name: string; amount: number; category: string }) {
  const category = await findOrCreateExpenseCategory(storeId, input.category);
  const timestamp = nowIso();
  const expense = {
    ...createSyncFields(storeId),
    localId: createLocalId('expense'),
    expenseCategoryLocalId: category.localId,
    expenseDate: timestamp,
    title: input.name.trim(),
    amount: input.amount,
    createdAt: timestamp,
    updatedAt: timestamp,
  } satisfies LocalExpense;

  await warunginDb.expenses.add(expense);
  await enqueueSyncQueueItem({
    storeId,
    entityType: 'expense',
    entityLocalId: expense.localId,
    operation: 'create',
    payload: { ...expense },
  });
  return expense;
}

export async function deleteExpenseLocal(localId: string) {
  const existing = await warunginDb.expenses.get(localId);
  if (!existing) throw new Error('Expense not found.');
  const updated = {
    ...existing,
    isDeleted: true,
    deletedAt: nowIso(),
    syncStatus: 'pending' as const,
    updatedAt: nowIso(),
  } satisfies LocalExpense;
  await warunginDb.expenses.put(updated);
  await enqueueSyncQueueItem({
    storeId: updated.storeId,
    entityType: 'expense',
    entityLocalId: updated.localId,
    operation: 'delete',
    payload: { ...updated },
  });
  return updated;
}
