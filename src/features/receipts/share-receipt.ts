import type { ReceiptData } from './types';
import { buildReceiptShareText } from './receipt-text';
import { generateReceiptPngBlob } from './receipt-image';
import { deleteReceiptAsset, markReceiptAssetShared, saveReceiptAssetMetadata } from './repository';

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function openWhatsAppFallback(text: string) {
  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
}

export async function shareReceipt(receipt: ReceiptData) {
  const blob = await generateReceiptPngBlob(receipt);
  const asset = await saveReceiptAssetMetadata(receipt, blob);
  const text = buildReceiptShareText(receipt);
  const filename = `struk-${receipt.receiptNumber}.png`;
  const file = new File([blob], filename, { type: 'image/png' });

  try {
    if (navigator.canShare?.({ files: [file] }) && navigator.share) {
      await navigator.share({ title: `Struk ${receipt.receiptNumber}`, text, files: [file] });
      await markReceiptAssetShared(asset.id);
      if (asset.autoDeleteAfterShare) await deleteReceiptAsset(asset.id);
      return { mode: 'native-share' as const };
    }

    downloadBlob(blob, filename);
    openWhatsAppFallback(text);
    return { mode: 'download-and-text' as const };
  } catch (error) {
    if ((error as Error).name === 'AbortError') {
      return { mode: 'cancelled' as const };
    }

    downloadBlob(blob, filename);
    openWhatsAppFallback(text);
    return { mode: 'fallback-after-error' as const, error };
  }
}
