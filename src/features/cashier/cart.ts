import type { LocalProduct } from '@/lib/db';

import type { CartItem, CartValidationResult, ResolvedCartItem } from './types';

export function calculateCartTotal(items: Pick<ResolvedCartItem, 'lineTotal'>[]) {
  return items.reduce((total, item) => total + item.lineTotal, 0);
}

export function calculateCartProfit(items: Pick<ResolvedCartItem, 'lineProfitEstimate'>[]) {
  return items.reduce((total, item) => total + item.lineProfitEstimate, 0);
}

export function calculateChange(total: number, paymentAmount: number) {
  return Math.max(0, paymentAmount - total);
}

export function validateCartInput(cartItems: CartItem[]): CartValidationResult {
  const errors: string[] = [];

  if (!cartItems.length) errors.push('Cart cannot be empty.');

  cartItems.forEach((item) => {
    if (!item.productLocalId) errors.push('Cart item product ID is required.');
    if (!Number.isFinite(item.quantity) || item.quantity <= 0) {
      errors.push('Cart item quantity must be greater than 0.');
    }
  });

  return { valid: errors.length === 0, errors };
}

export function resolveCartItems(cartItems: CartItem[], products: LocalProduct[]): ResolvedCartItem[] {
  const productMap = new Map(products.map((product) => [product.localId, product]));

  return cartItems.map((item) => {
    const product = productMap.get(item.productLocalId);
    if (!product) throw new Error(`Product not found: ${item.productLocalId}`);
    if (!product.isActive || product.isDeleted || product.deletedAt) throw new Error(`Product is inactive: ${product.name}`);

    const lineTotal = product.price * item.quantity;
    const lineProfitEstimate = (product.price - (product.hpp ?? 0)) * item.quantity;

    return {
      product,
      quantity: item.quantity,
      lineTotal,
      lineProfitEstimate,
    };
  });
}

export function validateCartStock(items: ResolvedCartItem[]): CartValidationResult {
  const errors: string[] = [];

  items.forEach(({ product, quantity }) => {
    if (quantity > product.stock) {
      errors.push(`Insufficient stock for ${product.name}. Available: ${product.stock}.`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function assertValidCart(result: CartValidationResult) {
  if (!result.valid) {
    throw new Error(result.errors.join(' '));
  }
}
