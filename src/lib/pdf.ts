import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';

import { getCategory } from './categories';
import { formatDate, parseISODate } from './dates';
import { readBase64 } from './files';
import { formatMoney, primaryTotal } from './format';
import type { Item } from './types';
import { getCoverage, warrantyLabel } from './warranty';

const esc = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const baseCss = `
  @page { margin: 32px; }
  body { font-family: -apple-system, 'Helvetica Neue', Roboto, Arial, sans-serif; color: #15140F; }
  h1 { font-family: Georgia, 'Times New Roman', serif; font-weight: 400; font-size: 34px; margin: 0 0 4px; }
  .muted { color: #67625A; font-size: 12px; }
  .brand { font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #67625A; margin-bottom: 24px; }
  table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
  td, th { padding: 10px 8px; border-bottom: 1px solid #E2DDD3; text-align: left; vertical-align: top; }
  th { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #67625A; font-weight: 600; }
  .label { color: #67625A; width: 38%; }
  .receipt { margin-top: 24px; page-break-inside: avoid; }
  .receipt img { max-width: 100%; max-height: 640px; border-radius: 8px; border: 1px solid #E2DDD3; }
  .pill { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 600; }
  .ok { background: #DDEFE3; color: #2E7D57; } .soon { background: #F8E7CF; color: #C9761A; }
  .exp { background: #F6DCD7; color: #BE4436; } .na { background: #E7E3DB; color: #67625A; }
`;

function statusPill(item: Item): string {
  const c = getCoverage(item);
  const map = {
    active: ['ok', 'Covered'],
    lifetime: ['ok', 'Lifetime'],
    expiring: ['soon', 'Expiring soon'],
    expired: ['exp', 'Expired'],
    none: ['na', 'No warranty'],
  } as const;
  const [cls, label] = map[c.status];
  return `<span class="pill ${cls}">${label}</span>`;
}

async function shareHtml(html: string, title: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: title });
  }
}

/** A one-item "claim pack": all details plus embedded receipt images. */
export async function exportItemPdf(item: Item): Promise<void> {
  const c = getCoverage(item);
  const rows: [string, string][] = [
    ['Category', getCategory(item.category).label],
    ['Store', item.store || '—'],
    ['Purchase date', formatDate(parseISODate(item.purchaseDate))],
    ['Price paid', formatMoney(item.price, item.currency)],
    ['Warranty', warrantyLabel(item.warrantyMonths)],
    ['Warranty ends', c.expiresOn ? formatDate(c.expiresOn) : c.status === 'lifetime' ? 'Never' : '—'],
    ['Return deadline', c.returnDeadline ? formatDate(c.returnDeadline) : '—'],
    ['Serial number', item.serial || '—'],
    ['Notes', item.notes || '—'],
  ];

  const images: string[] = [];
  for (const a of item.attachments) {
    if (a.kind !== 'image') continue;
    const b64 = await readBase64(a.uri);
    if (b64) images.push(`<div class="receipt"><img src="data:image/jpeg;base64,${b64}" /></div>`);
  }
  const pdfNames = item.attachments.filter((a) => a.kind === 'pdf').map((a) => esc(a.name));

  const html = `<html><head><meta charset="utf-8"/><style>${baseCss}</style></head><body>
    <div class="brand">Kept · Proof of purchase</div>
    <h1>${esc(item.name)}</h1>
    <div>${statusPill(item)}</div>
    <table>${rows.map(([k, v]) => `<tr><td class="label">${k}</td><td>${esc(v)}</td></tr>`).join('')}</table>
    ${pdfNames.length ? `<p class="muted">Attached documents: ${pdfNames.join(', ')}</p>` : ''}
    ${images.join('')}
    <p class="muted" style="margin-top:32px">Generated ${formatDate(new Date())}</p>
  </body></html>`;

  await shareHtml(html, `${item.name} — proof of purchase`);
}

/** Whole-vault inventory, e.g. for an insurance claim. */
export async function exportInventoryPdf(items: Item[], currency: string): Promise<void> {
  const total = primaryTotal(items, currency);
  const body = items
    .map((i) => {
      const c = getCoverage(i);
      return `<tr>
        <td><strong>${esc(i.name)}</strong><br/><span class="muted">${esc(i.store || getCategory(i.category).label)}</span></td>
        <td>${formatDate(parseISODate(i.purchaseDate))}</td>
        <td>${c.expiresOn ? formatDate(c.expiresOn) : c.status === 'lifetime' ? 'Lifetime' : '—'}</td>
        <td>${statusPill(i)}</td>
        <td style="text-align:right">${formatMoney(i.price, i.currency)}</td>
      </tr>`;
    })
    .join('');

  const html = `<html><head><meta charset="utf-8"/><style>${baseCss}</style></head><body>
    <div class="brand">Kept · Household inventory</div>
    <h1>${items.length} items · ${formatMoney(total.amount, total.currency)}${total.mixed ? ` <span class="muted">(${total.currency} items only)</span>` : ''}</h1>
    <div class="muted">Generated ${formatDate(new Date())}</div>
    <table>
      <tr><th>Item</th><th>Purchased</th><th>Warranty ends</th><th>Status</th><th style="text-align:right">Price</th></tr>
      ${body}
    </table>
  </body></html>`;

  await shareHtml(html, 'Kept inventory');
}
