import type { ReceiptData } from './types';
import { formatReceiptCurrency, formatReceiptDate } from './receipt-text';

interface ReceiptTemplateProps {
  receipt: ReceiptData;
}

const templateStyles = {
  page: {
    width: '360px',
    padding: '24px',
    background: '#fffdf7',
    color: '#1f2937',
    fontFamily: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    border: '1px solid #e5e7eb',
    borderRadius: '18px',
  },
  header: { textAlign: 'center' as const, borderBottom: '1px dashed #d1d5db', paddingBottom: '14px' },
  brand: { margin: 0, fontSize: '24px', fontWeight: 800, color: '#047857' },
  meta: { margin: '4px 0 0', fontSize: '12px', color: '#6b7280' },
  row: { display: 'flex', justifyContent: 'space-between', gap: '16px', fontSize: '13px', margin: '10px 0' },
  itemName: { fontWeight: 700 },
  muted: { color: '#6b7280', fontSize: '12px' },
  total: { display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 800, borderTop: '1px dashed #d1d5db', paddingTop: '12px', marginTop: '12px' },
  footer: { textAlign: 'center' as const, borderTop: '1px dashed #d1d5db', paddingTop: '14px', marginTop: '14px', fontSize: '12px', color: '#6b7280' },
};

export function ReceiptTemplate({ receipt }: ReceiptTemplateProps) {
  return (
    <div style={templateStyles.page}>
      <div style={templateStyles.header}>
        <h1 style={templateStyles.brand}>{receipt.storeName}</h1>
        <p style={templateStyles.meta}>Warungin POS</p>
        <p style={templateStyles.meta}>No: {receipt.receiptNumber}</p>
        <p style={templateStyles.meta}>{formatReceiptDate(receipt.transactionDate)}</p>
      </div>

      <div>
        {receipt.items.map((item, index) => (
          <div key={item.id ?? `${item.name}-${index}`} style={templateStyles.row}>
            <div>
              <div style={templateStyles.itemName}>{item.name}</div>
              <div style={templateStyles.muted}>
                {item.quantity} x {formatReceiptCurrency(item.price)}
              </div>
            </div>
            <strong>{formatReceiptCurrency(item.subtotal)}</strong>
          </div>
        ))}
      </div>

      <div style={templateStyles.total}>
        <span>Total</span>
        <span>{formatReceiptCurrency(receipt.total)}</span>
      </div>

      {receipt.paymentAmount != null ? (
        <>
          <div style={templateStyles.row}>
            <span>Dibayar</span>
            <strong>{formatReceiptCurrency(receipt.paymentAmount)}</strong>
          </div>
          <div style={templateStyles.row}>
            <span>Kembalian</span>
            <strong>{formatReceiptCurrency(receipt.changeAmount ?? 0)}</strong>
          </div>
        </>
      ) : null}

      <div style={templateStyles.footer}>{receipt.footer}</div>
    </div>
  );
}
