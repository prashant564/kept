import type { SQLiteDatabase } from 'expo-sqlite';

const DATABASE_VERSION = 1;

export async function migrateDbIfNeeded(db: SQLiteDatabase): Promise<void> {
  const row = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let version = row?.user_version ?? 0;
  if (version >= DATABASE_VERSION) return;

  if (version === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = 'wal';
      CREATE TABLE IF NOT EXISTS items (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        store TEXT NOT NULL DEFAULT '',
        category TEXT NOT NULL DEFAULT 'other',
        price REAL,
        currency TEXT NOT NULL DEFAULT 'USD',
        purchase_date TEXT NOT NULL,
        warranty_months INTEGER NOT NULL DEFAULT 0,
        return_days INTEGER NOT NULL DEFAULT 0,
        serial TEXT NOT NULL DEFAULT '',
        notes TEXT NOT NULL DEFAULT '',
        notification_ids TEXT NOT NULL DEFAULT '[]',
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
      );
      CREATE TABLE IF NOT EXISTS attachments (
        id TEXT PRIMARY KEY NOT NULL,
        item_id TEXT NOT NULL REFERENCES items(id) ON DELETE CASCADE,
        uri TEXT NOT NULL,
        kind TEXT NOT NULL,
        name TEXT NOT NULL DEFAULT '',
        created_at TEXT NOT NULL
      );
      CREATE INDEX IF NOT EXISTS attachments_item ON attachments(item_id);
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY NOT NULL,
        value TEXT NOT NULL
      );
    `);
    version = 1;
  }

  await db.execAsync(`PRAGMA user_version = ${DATABASE_VERSION}`);
}
