import {
  createLocalId,
  createSyncFields,
  nowIso,
  warunginDb,
  type LocalProduct,
  type LocalTransaction,
  type LocalTransactionItem,
} from '@/lib/db';

import { assertValidCart, calculateCartProfit, calculateCartTotal, calculateChange, resolveCartItems, validateCartInput, validateCartStock } from './cart';
import { generateReceiptNumber } from './receipt-number';
import type { CheckoutInput, CheckoutResult, ResolvedCartItem } from './types';

function buildTransaction(input: CheckoutInput, resolvedItems: ResolvedCartItem[], timestamp: string): LocalTransaction {
  const subtotal = calculateCartTotal(resolvedItems);
  const discountAmount = input.discountAmount ?? 0;
  const total = Math.max(0, subtotal - discountAmount);

  if (input.paymentAmount < total) {
    throw new Error('Payment amount must be greater than or equal to total.');
  }

  return {
    ...createSyncFields(input.storeId),
    localId: createLocalId('transaction'),
    receiptNumber: generateReceiptNumber(input.receiptPrefix),
    transactionDate: timestamp,
    subtotal,
    discountAmount,
    total,
    paymentMethodLocalId: input.paymentMethodLocalId,
    paymentMethodSnapshot: input.paymentMethodSnapshot ?? input.paymentMethodKind ?? 'cash',
    paymentAmount: input.paymentAmount,
    changeAmount: calculateChange(total, input.paymentAmount),
    profitEstimate: calculateCartProfit(resolvedItems) - discountAmount,
    status: 'completed',
    notes: input.notes,
  };
}

function buildTransactionItems(transaction: LocalTransaction, resolvedItems: ResolvedCartItem[], timestamp: string): LocalTransactionItem[] {
  return resolvedItems.map(({ product, quantity, lineTotal, lineProfitEstimate }) => ({
    localId: createLocalId('transaction-item'),
    transactionLocalId: transaction.localId,
    transactionRemoteId: transaction.remoteId,
    storeId: transaction.storeId,
    productLocalId: product.localId,
    productRemoteId: product.remoteId,
    productNameSnapshot: product.name,
    priceSnapshot: product.price,
    hppSnapshot: product.hpp ?? 0,
    quantity,
    subtotal: lineTotal,
    profitEstimate: lineProfitEstimate,
    createdAt: timestamp,
    updatedAt: timestamp,
    syncStatus: 'pending',
  }));
}

function buildUpdatedProducts(resolvedItems: ResolvedCartItem[], timestamp: string): LocalProduct[] {
  return resolvedItems.map(({ product, quantity }) => ({
    ...product,
    stock: Math.max(0, product.stock - quantity),
    syncStatus: 'pending',
    updatedAt: timestamp,
  }));
}

export async function checkoutLocal(input: CheckoutInput): Promise<CheckoutResult> {
  assertValidCart(validateCartInput(input.cartItems));

  const products = await warunginDb.products.bulkGet(input.cartItems.map((item) => item.productLocalId));
  const resolvedItems = resolveCartItems(input.cartItems, products.filter(Boolean) as LocalProduct[]);

  assertValidCart(validateCartStock(resolvedItems));

  const timestamp = nowIso();
  const transaction = buildTransaction(input, resolvedItems, timestamp);
  const transactionItems = buildTransactionItems(transaction, resolvedItems, timestamp);
  const updatedProducts = buildUpdatedProducts(resolvedItems, timestamp);

  await warunginDb.transaction(
    'rw',
    [warunginDb.transactions, warunginDb.transactionItems, warunginDb.products],
    async () => {
      await warunginDb.transactions.add(transaction);
      await warunginDb.transactionItems.bulkAdd(transactionItems);
      await warunginDb.products.bulkPut(updatedProducts);
    }
  );

  return {
    transaction,
    transactionItems,
    updatedProducts,
  };
}

export { buildTransactionItems };
