import { warunginDb } from '@/lib/db';

import type { ResetSampleDataResult } from './types';

export async function resetSampleData(storeId: string): Promise<ResetSampleDataResult> {
  const [products, categories, paymentMethods, expenseCategories, expenses] = await Promise.all([
    warunginDb.products.where({ storeId, isSample: true }).primaryKeys(),
    warunginDb.categories.where({ storeId, isSample: true }).primaryKeys(),
    warunginDb.paymentMethods.where({ storeId, isSample: true }).primaryKeys(),
    warunginDb.expenseCategories.where({ storeId, isSample: true }).primaryKeys(),
    warunginDb.expenses.where({ storeId, isSample: true }).primaryKeys(),
  ]);

  await warunginDb.transaction(
    'rw',
    [warunginDb.products, warunginDb.categories, warunginDb.paymentMethods, warunginDb.expenseCategories, warunginDb.expenses],
    async () => {
      await warunginDb.products.bulkDelete(products as string[]);
      await warunginDb.categories.bulkDelete(categories as string[]);
      await warunginDb.paymentMethods.bulkDelete(paymentMethods as string[]);
      await warunginDb.expenseCategories.bulkDelete(expenseCategories as string[]);
      await warunginDb.expenses.bulkDelete(expenses as string[]);
    }
  );

  return {
    storeId,
    deletedProducts: products.length,
    deletedCategories: categories.length,
    deletedPaymentMethods: paymentMethods.length,
    deletedExpenseCategories: expenseCategories.length,
    deletedExpenses: expenses.length,
  };
}
