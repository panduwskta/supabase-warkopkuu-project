# Sprint 10 — Receipt PNG + Share Notes

**Status:** Draft v0.1  
**Scope:** Receipt PNG generation and sharing. Local-only. No Supabase Storage upload, no Bluetooth print, no sync engine work.

---

## 1. Summary

Sprint 10 adds MVP receipt PNG generation and sharing for transaction history.

The implementation follows the PRD/SRS/TRD direction:

- receipt is visual,
- receipt can be shared as PNG when supported,
- text fallback remains available,
- receipt asset metadata is stored locally and temporarily,
- receipt PNG is not uploaded to cloud.

---

## 2. Files Added

- `src/features/receipts/types.ts`
- `src/features/receipts/receipt-template.tsx`
- `src/features/receipts/receipt-text.ts`
- `src/features/receipts/receipt-image.tsx`
- `src/features/receipts/share-receipt.ts`
- `src/features/receipts/repository.ts`
- `src/features/receipts/index.ts`
- `docs/Sprint-10-Receipt-PNG-Share-Notes.md`

Files modified:

- `package.json`
- `package-lock.json`
- `src/app/App.tsx`

---

## 3. Dependency Added

Added approved dependency:

- `html2canvas`

Reason:

- listed as a TRD candidate for DOM-to-PNG receipt generation,
- simple fit for MVP,
- avoids custom canvas rendering logic.

---

## 4. Receipt Data

The receipt data shape includes:

- transaction local ID,
- optional transaction remote ID,
- store name,
- receipt number,
- transaction date,
- item rows,
- total,
- payment amount,
- change amount,
- footer.

---

## 5. Receipt PNG Generation

`generateReceiptPngBlob(receipt)`:

1. renders the React receipt template offscreen,
2. converts it to a PNG blob using `html2canvas`,
3. removes the temporary offscreen DOM node.

---

## 6. Share Behavior

`shareReceipt(receipt)`:

1. generates the PNG blob,
2. saves local receipt asset metadata,
3. creates a PNG `File`,
4. uses Web Share API with file support when available,
5. falls back to PNG download + WhatsApp/text share when file sharing is unsupported,
6. marks/deletes temporary receipt asset after successful native share when enabled.

---

## 7. Local Receipt Asset Metadata

The existing Dexie `receiptAssets` table is used for local metadata and temporary PNG storage.

Default expiry:

- 14 days after generation.

If native share succeeds and `autoDeleteAfterShare` is enabled, the receipt asset is deleted after share.

---

## 8. Current UI Wiring

The existing transaction/history share action now calls PNG sharing:

- mobile transaction cards,
- desktop transaction table rows,
- dashboard recent transaction cards.

The existing app transaction shape is preserved to avoid a broad rewrite in this sprint.

---

## 9. Guardrails Preserved

This sprint does not:

- upload receipt PNGs to Supabase Storage,
- add a cloud receipt table,
- add Bluetooth print,
- add PDF export,
- add dashboard/reporting changes,
- add sync engine/direct sync work,
- add a major UI redesign,
- add Capacitor/native plugins.

---

## 10. Known Limitations

- Browser support for sharing files varies.
- Unsupported browsers use PNG download + text share fallback.
- Receipt UI is MVP-simple and can be visually polished later.
- Receipt metadata cleanup is handled when native share succeeds; broader expired-asset cleanup can be added later if needed.
- Existing legacy `App.tsx` transaction shape is still used for minimal compatibility.

---

## 11. Recommended Follow-Up

Recommended next step after review:

- Keep following SRD roadmap.
- Do not return to sync overengineering unless a tested bug/requirement forces it.
- Sprint 11 should focus on Dashboard + Reports Export if Sprint 10 is accepted.
