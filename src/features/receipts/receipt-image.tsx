import { createRoot } from 'react-dom/client';

import { ReceiptTemplate } from './receipt-template';
import type { ReceiptData } from './types';

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Gagal membuat PNG struk.'));
    }, 'image/png');
  });
}

export async function generateReceiptPngBlob(receipt: ReceiptData) {
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-10000px';
  container.style.top = '0';
  container.style.zIndex = '-1';
  container.style.pointerEvents = 'none';
  document.body.appendChild(container);

  const root = createRoot(container);
  root.render(<ReceiptTemplate receipt={receipt} />);

  await new Promise((resolve) => window.requestAnimationFrame(() => resolve(undefined)));

  try {
    const { default: html2canvas } = await import('html2canvas');
    const canvas = await html2canvas(container.firstElementChild as HTMLElement, {
      backgroundColor: '#fffdf7',
      scale: Math.min(window.devicePixelRatio || 1, 2),
      useCORS: true,
    });

    return canvasToBlob(canvas);
  } finally {
    root.unmount();
    container.remove();
  }
}
