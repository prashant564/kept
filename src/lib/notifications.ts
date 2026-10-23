import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

import { addDays, startOfToday } from './dates';
import type { Item } from './types';
import { getCoverage } from './warranty';

const CHANNEL_ID = 'reminders';
const REMIND_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Warranty reminders',
      // eslint-disable-next-line import/namespace -- re-exported via export *
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

interface Reminder {
  date: Date;
  title: string;
  body: string;
}

function remindersFor(item: Pick<Item, 'id' | 'name' | 'purchaseDate' | 'warrantyMonths' | 'returnDays'>): Reminder[] {
  const c = getCoverage(item);
  const out: Reminder[] = [];

  if (c.expiresOn) {
    for (const lead of [30, 7]) {
      out.push({
        date: addDays(c.expiresOn, -lead),
        title: `${item.name}: warranty ends in ${lead} days`,
        body: 'Check it still works properly. Your receipt is ready in Kept if you need to claim.',
      });
    }
  }
  if (c.returnDeadline) {
    for (const lead of [3, 1]) {
      out.push({
        date: addDays(c.returnDeadline, -lead),
        title: `Return window for ${item.name} closes in ${lead} ${lead === 1 ? 'day' : 'days'}`,
        body: 'Still happy with it? After this you can only use the warranty.',
      });
    }
  }

  const today = startOfToday();
  return out
    .map((r) => {
      const d = new Date(r.date);
      d.setHours(REMIND_HOUR, 0, 0, 0);
      return { ...r, date: d };
    })
    .filter((r) => r.date > today && r.date.getTime() > Date.now());
}

export async function scheduleReminders(
  item: Pick<Item, 'id' | 'name' | 'purchaseDate' | 'warrantyMonths' | 'returnDays'>,
): Promise<string[]> {
  if (Platform.OS === 'web') return [];
  const perm = await Notifications.getPermissionsAsync();
  if (!perm.granted) return [];

  const ids: string[] = [];
  for (const r of remindersFor(item)) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: { title: r.title, body: r.body, data: { itemId: item.id } },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: r.date,
          channelId: CHANNEL_ID,
        },
      });
      ids.push(id);
    } catch {
      // A single failed schedule shouldn't block saving the item.
    }
  }
  return ids;
}

export async function cancelReminders(ids: string[]): Promise<void> {
  if (Platform.OS === 'web') return;
  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id).catch(() => {})));
}
