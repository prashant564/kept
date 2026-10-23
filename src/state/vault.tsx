import { useSQLiteContext } from 'expo-sqlite';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  DEFAULT_SETTINGS,
  deleteAllRows,
  deleteItemRow,
  fetchItems,
  fetchSettings,
  saveSetting,
  upsertItem,
} from '@/db/repo';
import { demoItems } from '@/lib/demo';
import { deleteFile } from '@/lib/files';
import { uid } from '@/lib/format';
import { cancelReminders, ensureNotificationPermission, scheduleReminders } from '@/lib/notifications';
import type { Item, ItemInput, Settings } from '@/lib/types';

/** Items allowed on the free tier before the paywall appears. */
export const FREE_ITEM_LIMIT = 10;

interface VaultValue {
  ready: boolean;
  items: Item[];
  settings: Settings;
  canAddItem: boolean;
  getItem: (id: string) => Item | undefined;
  saveItem: (input: ItemInput, id?: string) => Promise<string>;
  deleteItem: (id: string) => Promise<void>;
  updateSetting: <K extends keyof Settings>(key: K, value: Settings[K]) => Promise<void>;
  loadDemoData: () => Promise<void>;
  resetVault: () => Promise<void>;
}

const VaultContext = createContext<VaultValue | null>(null);

export function VaultProvider({ children }: { children: ReactNode }) {
  const db = useSQLiteContext();
  const [ready, setReady] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);

  const reload = useCallback(async () => {
    setItems(await fetchItems(db));
  }, [db]);

  useEffect(() => {
    (async () => {
      const [s] = await Promise.all([fetchSettings(db), reload()]);
      setSettings(s);
      setReady(true);
    })();
  }, [db, reload]);

  const getItem = useCallback((id: string) => items.find((i) => i.id === id), [items]);

  const saveItem = useCallback(
    async (input: ItemInput, id?: string) => {
      const existing = id ? items.find((i) => i.id === id) : undefined;
      if (existing) {
        await cancelReminders(existing.notificationIds);
        // Remove files that were detached during the edit.
        const kept = new Set(input.attachments.map((a) => a.uri));
        existing.attachments.filter((a) => !kept.has(a.uri)).forEach((a) => deleteFile(a.uri));
      }
      const itemId = id ?? uid();
      const notificationIds = settings.remindersEnabled ? await scheduleReminders({ ...input, id: itemId }) : [];
      await upsertItem(db, input, { id: itemId, notificationIds, createdAt: existing?.createdAt });
      await reload();
      return itemId;
    },
    [db, items, reload, settings.remindersEnabled],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      const existing = items.find((i) => i.id === id);
      if (existing) {
        await cancelReminders(existing.notificationIds);
        existing.attachments.forEach((a) => deleteFile(a.uri));
      }
      await deleteItemRow(db, id);
      await reload();
    },
    [db, items, reload],
  );

  const updateSetting = useCallback(
    async <K extends keyof Settings>(key: K, value: Settings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      await saveSetting(db, key, value);

      if (key === 'remindersEnabled') {
        // Re-sync every item's reminders with the new preference.
        const enabled = value as boolean;
        if (enabled) await ensureNotificationPermission();
        for (const item of items) {
          await cancelReminders(item.notificationIds);
          const ids = enabled ? await scheduleReminders(item) : [];
          await upsertItem(db, item, { id: item.id, notificationIds: ids, createdAt: item.createdAt });
        }
        await reload();
      }
    },
    [db, items, reload],
  );

  const loadDemoData = useCallback(async () => {
    for (const input of demoItems(settings.currency)) {
      const id = uid();
      await upsertItem(db, input, { id, notificationIds: [] });
    }
    await reload();
  }, [db, reload, settings.currency]);

  const resetVault = useCallback(async () => {
    for (const item of items) {
      await cancelReminders(item.notificationIds);
      item.attachments.forEach((a) => deleteFile(a.uri));
    }
    await deleteAllRows(db);
    await reload();
  }, [db, items, reload]);

  const value = useMemo<VaultValue>(
    () => ({
      ready,
      items,
      settings,
      canAddItem: settings.isPro || items.length < FREE_ITEM_LIMIT,
      getItem,
      saveItem,
      deleteItem,
      updateSetting,
      loadDemoData,
      resetVault,
    }),
    [ready, items, settings, getItem, saveItem, deleteItem, updateSetting, loadDemoData, resetVault],
  );

  return <VaultContext.Provider value={value}>{children}</VaultContext.Provider>;
}

export function useVault(): VaultValue {
  const ctx = useContext(VaultContext);
  if (!ctx) throw new Error('useVault must be used inside <VaultProvider>');
  return ctx;
}
