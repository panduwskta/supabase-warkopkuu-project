import { createLocalId, nowIso, warunginDb, type LocalReceiptAsset } from '@/lib/db';

import type { ReceiptData } from './types';
import { buildReceiptShareText } from './receipt-text';

function addDays(date: Date, days: number) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export async function saveReceiptAssetMetadata(receipt: ReceiptData, pngBlob: Blob, autoDeleteAfterShare = true) {
  const generatedAt = nowIso();
  const asset = {
    id: createLocalId('receipt-asset'),
    transactionLocalId: receipt.transactionLocalId,
    transactionRemoteId: receipt.transactionRemoteId,
    receiptNumber: receipt.receiptNumber,
    pngBlob,
    shareText: buildReceiptShareText(receipt),
    generatedAt,
    expiresAt: addDays(new Date(generatedAt), 14).toISOString(),
    autoDeleteAfterShare,
  } satisfies LocalReceiptAsset;

  await warunginDb.receiptAssets.put(asset);
  return asset;
}

export async function markReceiptAssetShared(id: string) {
  const asset = await warunginDb.receiptAssets.get(id);
  if (!asset) return undefined;

  const updated = {
    ...asset,
    sharedAt: nowIso(),
  } satisfies LocalReceiptAsset;

  await warunginDb.receiptAssets.put(updated);
  return updated;
}

export async function deleteReceiptAsset(id: string) {
  await warunginDb.receiptAssets.delete(id);
}
