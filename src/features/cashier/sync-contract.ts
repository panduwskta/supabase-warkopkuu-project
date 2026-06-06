import type { LocalProduct, LocalStore, LocalTransaction, LocalTransactionItem } from '@/lib/db';

export type CheckoutRpcErrorCode =
  | 'UNAUTHENTICATED'
  | 'UNAUTHORIZED_STORE'
  | 'INVALID_PAYLOAD'
  | 'INSUFFICIENT_STOCK'
  | 'DUPLICATE_RECEIPT';

export interface CheckoutRpcPayloadItem {
  localTransactionItemId: string;
  productId: string;
  productLocalId?: string;
  productNameSnapshot: string;
  priceSnapshot: number;
  hppSnapshot: number;
  quantity: number;
  subtotal: number;
  profitEstimate: number;
  notes?: string | null;
}

export interface CheckoutRpcPayload {
  clientMutationId: string;
  storeId: string;
  localTransactionId: string;
  receiptNumber: string;
  transactionDate: string;
  subtotal: number;
  discountAmount: number;
  total: number;
  paymentMethodId?: string | null;
  paymentMethodSnapshot?: string | null;
  paymentAmount: number;
  changeAmount: number;
  profitEstimate: number;
  status: LocalTransaction['status'];
  notes?: string | null;
  items: CheckoutRpcPayloadItem[];
}

export interface CheckoutRpcSuccessResponse {
  ok: true;
  transactionId: string;
  receiptNumber: string;
  transactionItems: Array<{
    localTransactionItemId: string;
    transactionItemId: string;
  }>;
  products: Array<{
    productLocalId?: string;
    productId: string;
    stock: number;
  }>;
  syncedAt: string;
}

export interface CheckoutRpcErrorResponse {
  ok: false;
  code: CheckoutRpcErrorCode;
  message: string;
  transactionId?: string | null;
  conflicts?: Array<{
    productId: string;
    productLocalId?: string;
    requestedQuantity: number;
    availableStock: number;
  }>;
  details?: unknown;
}

export type CheckoutRpcResponse = CheckoutRpcSuccessResponse | CheckoutRpcErrorResponse;

export interface BuildCheckoutRpcPayloadInput {
  store: LocalStore;
  transaction: LocalTransaction;
  transactionItems: LocalTransactionItem[];
  products: LocalProduct[];
}

function productRemoteIdForItem(item: LocalTransactionItem, products: LocalProduct[]) {
  return item.productRemoteId ?? products.find((product) => product.localId === item.productLocalId)?.remoteId;
}

export function buildCheckoutRpcPayload(input: BuildCheckoutRpcPayloadInput): CheckoutRpcPayload {
  const { store, transaction, transactionItems, products } = input;

  if (!store.remoteId) {
    throw new Error('Remote store ID is required before checkout sync can run.');
  }

  if (transactionItems.length === 0) {
    throw new Error('Checkout sync requires at least one transaction item.');
  }

  const items = transactionItems.map((item) => {
    const productId = productRemoteIdForItem(item, products);

    if (!productId) {
      throw new Error(`Remote product ID is required before checkout sync can run for item ${item.localId}.`);
    }

    return {
      localTransactionItemId: item.localId,
      productId,
      productLocalId: item.productLocalId,
      productNameSnapshot: item.productNameSnapshot,
      priceSnapshot: item.priceSnapshot,
      hppSnapshot: item.hppSnapshot,
      quantity: item.quantity,
      subtotal: item.subtotal,
      profitEstimate: item.profitEstimate,
      notes: item.notes ?? null,
    } satisfies CheckoutRpcPayloadItem;
  });

  return {
    clientMutationId: transaction.localId,
    storeId: store.remoteId,
    localTransactionId: transaction.localId,
    receiptNumber: transaction.receiptNumber,
    transactionDate: transaction.transactionDate,
    subtotal: transaction.subtotal,
    discountAmount: transaction.discountAmount,
    total: transaction.total,
    paymentMethodId: transaction.paymentMethodRemoteId ?? null,
    paymentMethodSnapshot: transaction.paymentMethodSnapshot ?? null,
    paymentAmount: transaction.paymentAmount,
    changeAmount: transaction.changeAmount,
    profitEstimate: transaction.profitEstimate,
    status: transaction.status,
    notes: transaction.notes ?? null,
    items,
  };
}

export function isCheckoutRpcResponse(value: unknown): value is CheckoutRpcResponse {
  if (!value || typeof value !== 'object') return false;
  return 'ok' in value && typeof (value as { ok: unknown }).ok === 'boolean';
}
