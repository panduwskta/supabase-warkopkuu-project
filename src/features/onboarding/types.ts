import type { BusinessType, PaymentMethodKind } from '@/lib/db';

export interface SampleCategoryInput {
  key: string;
  name: string;
  color?: string;
  icon?: string;
  sortOrder: number;
}

export interface SampleProductInput {
  name: string;
  categoryKey: string;
  price: number;
  hpp: number;
  stock: number;
  unit?: string;
  sku?: string;
}

export interface SamplePaymentMethodInput {
  name: string;
  kind: PaymentMethodKind;
  isDefault?: boolean;
}

export interface SampleExpenseInput {
  title: string;
  categoryName: string;
  amount: number;
  notes?: string;
}

export interface SampleExpenseCategoryInput {
  key: string;
  name: string;
  color?: string;
  icon?: string;
  isDefault?: boolean;
}

export interface DefaultSampleData {
  store: {
    name: string;
    businessType: BusinessType;
    receiptPrefix: string;
    receiptFooter: string;
    themeKey: string;
  };
  categories: SampleCategoryInput[];
  products: SampleProductInput[];
  paymentMethods: SamplePaymentMethodInput[];
  expenseCategories: SampleExpenseCategoryInput[];
  expenses: SampleExpenseInput[];
}

export interface SeedSampleDataOptions {
  storeId: string;
  ownerUserId?: string;
  resetExistingSampleData?: boolean;
}

export interface SeedSampleDataResult {
  storeId: string;
  categoryCount: number;
  productCount: number;
  paymentMethodCount: number;
  expenseCategoryCount: number;
  expenseCount: number;
}

export interface ResetSampleDataResult {
  storeId: string;
  deletedCategories: number;
  deletedProducts: number;
  deletedPaymentMethods: number;
  deletedExpenseCategories: number;
  deletedExpenses: number;
}
