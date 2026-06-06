import type { ReceiptData } from './types';

export function formatReceiptCurrency(amount: number) {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
    Number(amount || 0)
  );
}

export function formatReceiptDate(date: Date) {
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

export function buildReceiptShareText(receipt: ReceiptData) {
  const lines = [
    `Struk ${receipt.storeName}`,
    `No: ${receipt.receiptNumber}`,
    `Waktu: ${formatReceiptDate(receipt.transactionDate)}`,
    '',
    ...receipt.items.map((item) => `${item.quantity}x ${item.name} — ${formatReceiptCurrency(item.subtotal)}`),
    '',
    `Total: ${formatReceiptCurrency(receipt.total)}`,
  ];

  if (receipt.paymentAmount != null) {
    lines.push(`Dibayar: ${formatReceiptCurrency(receipt.paymentAmount)}`);
    lines.push(`Kembalian: ${formatReceiptCurrency(receipt.changeAmount ?? 0)}`);
  }

  lines.push('', receipt.footer);
  return lines.join('\n');
}
