export const DEFAULT_RECEIPT_PREFIX = 'WRG';

export function generateReceiptNumber(prefix = DEFAULT_RECEIPT_PREFIX, date = new Date()) {
  const cleanPrefix = prefix.trim() || DEFAULT_RECEIPT_PREFIX;
  const datePart = date.toISOString().slice(0, 10).replace(/-/g, '');
  const timePart = date.getTime().toString(36).toUpperCase();

  return `${cleanPrefix}-${datePart}-${timePart}`;
}
