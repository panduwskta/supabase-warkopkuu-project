export interface ReceiptLineItem {
  id?: string;
  name: string;
  quantity: number;
  price: number;
  subtotal: number;
}

export interface ReceiptData {
  transactionLocalId: string;
  transactionRemoteId?: string;
  storeName: string;
  receiptNumber: string;
  transactionDate: Date;
  items: ReceiptLineItem[];
  total: number;
  paymentAmount?: number;
  changeAmount?: number;
  footer: string;
}
