import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemThumb } from '@/components/item-row';
import { Clay, enter, Tag, Txt } from '@/components/ui';
import type { SoftTone } from '@/lib/categories';
import { addDays, daysBetween, formatDate, startOfToday } from '@/lib/dates';
import type { Item } from '@/lib/types';
import { getCoverage } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { GUTTER, space, TAB_BAR_SPACE, useTheme } from '@/theme';

interface Event {
  key: string;
  item: Item;
  date: Date;
  days: number;
  title: string;
  tone: SoftTone;
  emoji: string;
}

function bucket(days: number): string {
  if (days <= 7) return 'This week';
  if (days <= 31) return 'This month';
  if (days <= 92) return 'Next 3 months';
  return 'Later';
}

export default function TimelineScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items } = useVault();

  const groups = useMemo(() => {
    const today = startOfToday();
    const events: Event[] = [];
    for (const item of items) {
      const c = getCoverage(item);
      if (c.returnOpen && c.returnDeadline) {
        events.push({ key: `${item.id}-r`, item, date: c.returnDeadline, days: c.returnDaysLeft ?? 0, title: 'Last day to return', tone: 'pink', emoji: '↩️' });
      }
      if (c.expiresOn && (c.daysLeft ?? -1) >= 0) {
        const check = addDays(c.expiresOn, -30);
        const checkDays = daysBetween(today, check);
        if (checkDays >= 0) {
          events.push({ key: `${item.id}-c`, item, date: check, days: checkDays, title: 'Check it still works', tone: 'primary', emoji: '🔍' });
        }
        events.push({ key: `${item.id}-w`, item, date: c.expiresOn, days: c.daysLeft ?? 0, title: 'Warranty ends', tone: 'yellow', emoji: '🛡️' });
      }
    }
    events.sort((a, b) => a.days - b.days);
    const out: { title: string; events: Event[] }[] = [];
    for (const e of events) {
      const t = bucket(e.days);
      const g = out.find((x) => x.title === t);
      if (g) g.events.push(e);
      else out.push({ title: t, events: [e] });
    }
    return out;
  }, [items]);

  let index = 0;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: TAB_BAR_SPACE + insets.bottom, paddingHorizontal: GUTTER }}
      showsVerticalScrollIndicator={false}>
      <Animated.View entering={enter(0)}>
        <Txt variant="label" tone="secondary">
          Your stuff’s calendar
        </Txt>
        <Txt variant="display">Coming up 🗓️</Txt>
      </Animated.View>

      {groups.length === 0 ? (
        <Animated.View entering={enter(1)} style={{ alignItems: 'center', paddingTop: 60, gap: space.sm }}>
          <Text style={{ fontSize: 60 }}>🏖️</Text>
          <Txt variant="title">Nothing on the calendar</Txt>
          <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            Return windows and warranty end dates will show up here.
          </Txt>
        </Animated.View>
      ) : (
        groups.map((g) => (
          <View key={g.title} style={{ marginTop: space.xxl }}>
            <Animated.View entering={enter(index++)}>
              <Txt variant="title" style={{ marginBottom: space.md }}>
                {g.title}
              </Txt>
            </Animated.View>
            <View style={{ gap: space.md }}>
              {g.events.map((e) => (
                <Animated.View key={e.key} entering={enter(index++)}>
                  <Clay onPress={() => router.push(`/item/${e.item.id}`)} contentStyle={{ padding: 14, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                    <View style={{ width: 54, alignItems: 'center' }}>
                      <Txt variant="display" style={{ fontSize: 26, lineHeight: 30 }}>
                        {e.days}
                      </Txt>
                      <Txt variant="tiny" tone="secondary">
                        {e.days === 1 ? 'day' : 'days'}
                      </Txt>
                    </View>
                    <View style={{ width: 2, alignSelf: 'stretch', backgroundColor: colors.surfaceMuted, borderRadius: 1 }} />
                    <ItemThumb item={e.item} size={44} />
                    <View style={{ flex: 1, gap: 4 }}>
                      <Txt variant="headline" numberOfLines={1}>
                        {e.item.name}
                      </Txt>
                      <Tag tone={e.tone} emoji={e.emoji} label={e.title} />
                    </View>
                  </Clay>
                  <Txt variant="caption" tone="tertiary" style={{ marginTop: 4, marginLeft: 8 }}>
                    {formatDate(e.date)}
                  </Txt>
                </Animated.View>
              ))}
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}
