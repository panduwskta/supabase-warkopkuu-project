import { checkoutLocal } from '@/features/cashier';
import type { CartItem } from '@/features/cashier';
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
  syncStatus?: string;
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
    if (!existing.some((category) => category.name.toLowerCase() === name.toLowerCase())) {
      await createCategory({ storeId, name, sortOrder: index, isSample: true });
    }
  }
}

async function ensureDefaultPaymentMethods(storeId: string) {
  const existing = await warunginDb.paymentMethods.where({ storeId }).toArray();
  if (existing.some((method) => !method.isDeleted)) return;

  const timestamp = nowIso();
  const methods: LocalPaymentMethod[] = [
    { name: 'Tunai', kind: 'cash', isDefault: true },
    { name: 'QRIS', kind: 'qris', isDefault: false },
    { name: 'Transfer', kind: 'transfer', isDefault: false },
    { name: 'E-wallet', kind: 'ewallet', isDefault: false },
  ].map((method) => ({
    ...createSyncFields(storeId, { isSample: true }),
    localId: createLocalId('payment-method'),
    name: method.name,
    kind: method.kind as LocalPaymentMethod['kind'],
    isDefault: method.isDefault,
    isActive: true,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));

  await warunginDb.paymentMethods.bulkAdd(methods);
}

async function ensureDefaultExpenseCategories(storeId: string) {
  const existing = await warunginDb.expenseCategories.where({ storeId }).toArray();
  for (const name of DEFAULT_EXPENSE_CATEGORIES) {
    if (!existing.some((category) => !category.isDeleted && category.name.toLowerCase() === name.toLowerCase())) {
      const timestamp = nowIso();
      await warunginDb.expenseCategories.add({
        ...createSyncFields(storeId, { isSample: true }),
        localId: createLocalId('expense-category'),
        name,
        isDefault: true,
        createdAt: timestamp,
        updatedAt: timestamp,
      });
    }
  }
}

async function ensureOnboardingState(storeId: string) {
  const existing = await warunginDb.onboardingState.where({ storeId }).first();
  if (existing) return existing;
  const timestamp = nowIso();
  const state = {
    id: createLocalId('onboarding'),
    storeId,
    currentStep: 'local-v2-cutover',
    completed: true,
    demoDataSeeded: false,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
  await warunginDb.onboardingState.add(state);
  return state;
}

export async function ensureLocalV2Store(user: AppUserLike): Promise<LocalStore> {
  const ownerUserId = user.id || user.email || 'local-user';
  const existing = await warunginDb.stores.where({ ownerUserId }).first();
  if (existing && !existing.isDeleted) {
    await Promise.all([
      ensureDefaultCategories(existing.localId),
      ensureDefaultPaymentMethods(existing.localId),
      ensureDefaultExpenseCategories(existing.localId),
      ensureOnboardingState(existing.localId),
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
    onboardingCompleted: true,
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
    ensureOnboardingState(store.localId),
  ]);
  return store;
}

export async function loadLocalV2AppData(storeId: string) {
  const [store, categories, products, transactions, transactionItems, expenses, expenseCategories, syncQueue] = await Promise.all([
    warunginDb.stores.get(storeId),
    listCategories(storeId),
    listActiveProducts(storeId),
    warunginDb.transactions.where({ storeId }).toArray(),
    warunginDb.transactionItems.where({ storeId }).toArray(),
    warunginDb.expenses.where({ storeId }).toArray(),
    warunginDb.expenseCategories.where({ storeId }).toArray(),
    warunginDb.syncQueue.where({ storeId }).toArray(),
  ]);

  const activeExpenses = expenses.filter((expense) => !expense.isDeleted && !expense.deletedAt);
  const activeExpenseCategories = expenseCategories.filter((category) => !category.isDeleted && !category.deletedAt);

  return {
    store,
    menu: products.map((product) => toMenuView(product, categories)),
    orders: transactions
      .filter((transaction) => !transaction.isDeleted && !transaction.deletedAt)
      .map((transaction) => toOrderView(transaction, transactionItems.filter((item) => item.transactionLocalId === transaction.localId)))
      .sort((a, b) => b.timestamp - a.timestamp),
    expenses: activeExpenses.map((expense) => toExpenseView(expense, activeExpenseCategories)).sort((a, b) => b.timestamp - a.timestamp),
    syncSummary: {
      pending: syncQueue.filter((item) => item.status === 'pending').length,
      syncing: syncQueue.filter((item) => item.status === 'syncing').length,
      failed: syncQueue.filter((item) => item.status === 'failed').length,
      conflict: syncQueue.filter((item) => item.status === 'conflict').length,
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

export async function checkoutCartLocal(store: LocalStore, cart: Array<{ id: string; qty: number }>, paymentAmount: number) {
  const cartItems: CartItem[] = cart.map((item) => ({ productLocalId: item.id, quantity: item.qty }));
  return checkoutLocal({
    storeId: store.localId,
    cartItems,
    paymentAmount,
    paymentMethodSnapshot: 'Tunai',
    paymentMethodKind: 'cash',
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
