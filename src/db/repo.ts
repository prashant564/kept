import type { SQLiteDatabase } from 'expo-sqlite';

import { uid } from '@/lib/format';
import type { Attachment, AttachmentKind, CategoryId, Item, ItemInput, Settings } from '@/lib/types';

interface ItemRow {
  id: string;
  name: string;
  store: string;
  category: string;
  price: number | null;
  currency: string;
  purchase_date: string;
  warranty_months: number;
  return_days: number;
  serial: string;
  notes: string;
  notification_ids: string;
  created_at: string;
  updated_at: string;
}

interface AttachmentRow {
  id: string;
  item_id: string;
  uri: string;
  kind: string;
  name: string;
  created_at: string;
}

function toAttachment(r: AttachmentRow): Attachment {
  return { id: r.id, itemId: r.item_id, uri: r.uri, kind: r.kind as AttachmentKind, name: r.name, createdAt: r.created_at };
}

function toItem(r: ItemRow, attachments: Attachment[]): Item {
  let notificationIds: string[] = [];
  try {
    notificationIds = JSON.parse(r.notification_ids);
  } catch {}
  return {
    id: r.id,
    name: r.name,
    store: r.store,
    category: r.category as CategoryId,
    price: r.price,
    currency: r.currency,
    purchaseDate: r.purchase_date,
    warrantyMonths: r.warranty_months,
    returnDays: r.return_days,
    serial: r.serial,
    notes: r.notes,
    notificationIds,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    attachments,
  };
}

export async function fetchItems(db: SQLiteDatabase): Promise<Item[]> {
  const [rows, atts] = await Promise.all([
    db.getAllAsync<ItemRow>('SELECT * FROM items ORDER BY created_at DESC'),
    db.getAllAsync<AttachmentRow>('SELECT * FROM attachments ORDER BY created_at ASC'),
  ]);
  const byItem = new Map<string, Attachment[]>();
  for (const a of atts) {
    const list = byItem.get(a.item_id) ?? [];
    list.push(toAttachment(a));
    byItem.set(a.item_id, list);
  }
  return rows.map((r) => toItem(r, byItem.get(r.id) ?? []));
}

/** Inserts or replaces an item and its full attachment list. Returns the item id. */
export async function upsertItem(
  db: SQLiteDatabase,
  input: ItemInput,
  opts: { id?: string; notificationIds: string[]; createdAt?: string },
): Promise<string> {
  const id = opts.id ?? uid();
  const now = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO items (id, name, store, category, price, currency, purchase_date, warranty_months, return_days, serial, notes, notification_ids, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(id) DO UPDATE SET
         name = excluded.name, store = excluded.store, category = excluded.category, price = excluded.price,
         currency = excluded.currency, purchase_date = excluded.purchase_date, warranty_months = excluded.warranty_months,
         return_days = excluded.return_days, serial = excluded.serial, notes = excluded.notes,
         notification_ids = excluded.notification_ids, updated_at = excluded.updated_at`,
      id,
      input.name.trim(),
      input.store.trim(),
      input.category,
      input.price,
      input.currency,
      input.purchaseDate,
      input.warrantyMonths,
      input.returnDays,
      input.serial.trim(),
      input.notes.trim(),
      JSON.stringify(opts.notificationIds),
      opts.createdAt ?? now,
      now,
    );
    await db.runAsync('DELETE FROM attachments WHERE item_id = ?', id);
    for (const a of input.attachments) {
      await db.runAsync(
        'INSERT INTO attachments (id, item_id, uri, kind, name, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        uid(),
        id,
        a.uri,
        a.kind,
        a.name,
        now,
      );
    }
  });
  return id;
}

export async function deleteItemRow(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('DELETE FROM attachments WHERE item_id = ?', id);
    await db.runAsync('DELETE FROM items WHERE id = ?', id);
  });
}

export async function deleteAllRows(db: SQLiteDatabase): Promise<void> {
  await db.execAsync('DELETE FROM attachments; DELETE FROM items;');
}

export const DEFAULT_SETTINGS: Settings = {
  onboarded: false,
  isPro: false,
  remindersEnabled: true,
  currency: 'USD',
};

export async function fetchSettings(db: SQLiteDatabase): Promise<Settings> {
  const rows = await db.getAllAsync<{ key: string; value: string }>('SELECT key, value FROM settings');
  const out: Settings = { ...DEFAULT_SETTINGS };
  for (const { key, value } of rows) {
    if (key in out) {
      try {
        (out as unknown as Record<string, unknown>)[key] = JSON.parse(value);
      } catch {}
    }
  }
  return out;
}

export async function saveSetting<K extends keyof Settings>(db: SQLiteDatabase, key: K, value: Settings[K]): Promise<void> {
  await db.runAsync(
    'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    key,
    JSON.stringify(value),
  );
}
