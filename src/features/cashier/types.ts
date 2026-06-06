import type { LocalProduct, LocalTransaction, LocalTransactionItem, PaymentMethodKind } from '@/lib/db';

export interface CartItem {
  productLocalId: string;
  quantity: number;
}

export interface ResolvedCartItem {
  product: LocalProduct;
  quantity: number;
  lineTotal: number;
  lineProfitEstimate: number;
}

export interface CheckoutInput {
  storeId: string;
  cartItems: CartItem[];
  paymentAmount: number;
  paymentMethodLocalId?: string;
  paymentMethodSnapshot?: string;
  paymentMethodKind?: PaymentMethodKind;
  receiptPrefix?: string;
  discountAmount?: number;
  notes?: string;
}

export interface CheckoutResult {
  transaction: LocalTransaction;
  transactionItems: LocalTransactionItem[];
  updatedProducts: LocalProduct[];
}

export interface CartValidationResult {
  valid: boolean;
  errors: string[];
}
