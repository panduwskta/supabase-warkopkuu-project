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
} from '@/lib/db';

import { getDefaultSampleData } from './sample-data';
import { resetSampleData } from './reset-sample-data';
import { markSampleDataSeeded } from './onboarding-state';
import type { SeedSampleDataOptions, SeedSampleDataResult } from './types';

export async function hasSampleData(storeId: string) {
  const [categoryCount, productCount, paymentMethodCount, expenseCategoryCount, expenseCount] = await Promise.all([
    warunginDb.categories.where({ storeId, isSample: true }).count(),
    warunginDb.products.where({ storeId, isSample: true }).count(),
    warunginDb.paymentMethods.where({ storeId, isSample: true }).count(),
    warunginDb.expenseCategories.where({ storeId, isSample: true }).count(),
    warunginDb.expenses.where({ storeId, isSample: true }).count(),
  ]);

  return categoryCount + productCount + paymentMethodCount + expenseCategoryCount + expenseCount > 0;
}

export async function seedSampleData(options: SeedSampleDataOptions): Promise<SeedSampleDataResult> {
  const { storeId, ownerUserId, resetExistingSampleData = false } = options;
  const sampleData = getDefaultSampleData();

  if (resetExistingSampleData) {
    await resetSampleData(storeId);
  } else if (await hasSampleData(storeId)) {
    return {
      storeId,
      categoryCount: 0,
      productCount: 0,
      paymentMethodCount: 0,
      expenseCategoryCount: 0,
      expenseCount: 0,
    };
  }

  const timestamp = nowIso();
  const existingStore = await warunginDb.stores.get(storeId);
  const store = {
    ...(existingStore ?? {
      ...createSyncFields(storeId, { isSample: true }),
      localId: storeId,
      name: sampleData.store.name,
      receiptPrefix: sampleData.store.receiptPrefix,
      onboardingCompleted: false,
      demoDataSeeded: true,
    }),
    ownerUserId: ownerUserId ?? existingStore?.ownerUserId,
    businessType: existingStore?.businessType ?? sampleData.store.businessType,
    receiptFooter: existingStore?.receiptFooter ?? sampleData.store.receiptFooter,
    receiptPrefix: existingStore?.receiptPrefix ?? sampleData.store.receiptPrefix,
    themeKey: existingStore?.themeKey ?? sampleData.store.themeKey,
    demoDataSeeded: true,
    updatedAt: timestamp,
  } satisfies LocalStore;

  const categoryMap = new Map<string, string>();
  const categories: LocalCategory[] = sampleData.categories.map((category) => {
    const localId = createLocalId('category');
    categoryMap.set(category.key, localId);

    return {
      ...createSyncFields(storeId, { isSample: true }),
      localId,
      name: category.name,
      color: category.color,
      icon: category.icon,
      sortOrder: category.sortOrder,
    };
  });

  const products: LocalProduct[] = sampleData.products.map((product) => ({
    ...createSyncFields(storeId, { isSample: true }),
    localId: createLocalId('product'),
    categoryLocalId: categoryMap.get(product.categoryKey),
    name: product.name,
    price: product.price,
    hpp: product.hpp,
    stock: product.stock,
    unit: product.unit ?? 'pcs',
    sku: product.sku,
    isActive: true,
  }));

  const paymentMethods: LocalPaymentMethod[] = sampleData.paymentMethods.map((paymentMethod) => ({
    ...createSyncFields(storeId, { isSample: true }),
    localId: createLocalId('payment'),
    name: paymentMethod.name,
    kind: paymentMethod.kind,
    isDefault: paymentMethod.isDefault ?? false,
    isActive: true,
  }));

  const expenseCategoryMap = new Map<string, string>();
  const expenseCategories: LocalExpenseCategory[] = sampleData.expenseCategories.map((expenseCategory) => {
    const localId = createLocalId('expense-category');
    expenseCategoryMap.set(expenseCategory.name, localId);

    return {
      ...createSyncFields(storeId, { isSample: true }),
      localId,
      name: expenseCategory.name,
      color: expenseCategory.color,
      icon: expenseCategory.icon,
      isDefault: expenseCategory.isDefault ?? false,
    };
  });

  const expenses: LocalExpense[] = sampleData.expenses.map((expense, index) => ({
    ...createSyncFields(storeId, { isSample: true }),
    localId: createLocalId('expense'),
    expenseCategoryLocalId: expenseCategoryMap.get(expense.categoryName),
    expenseDate: new Date(Date.now() - index * 86_400_000).toISOString(),
    title: expense.title,
    amount: expense.amount,
    notes: expense.notes,
  }));

  await warunginDb.transaction(
    'rw',
    [
      warunginDb.stores,
      warunginDb.categories,
      warunginDb.products,
      warunginDb.paymentMethods,
      warunginDb.expenseCategories,
      warunginDb.expenses,
    ],
    async () => {
      await warunginDb.stores.put(store);
      await warunginDb.categories.bulkAdd(categories);
      await warunginDb.products.bulkAdd(products);
      await warunginDb.paymentMethods.bulkAdd(paymentMethods);
      await warunginDb.expenseCategories.bulkAdd(expenseCategories);
      await warunginDb.expenses.bulkAdd(expenses);
    }
  );

  await markSampleDataSeeded(storeId);

  return {
    storeId,
    categoryCount: categories.length,
    productCount: products.length,
    paymentMethodCount: paymentMethods.length,
    expenseCategoryCount: expenseCategories.length,
    expenseCount: expenses.length,
  };
}
