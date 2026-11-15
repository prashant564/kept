import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow, ItemThumb } from '@/components/item-row';
import { Button, Clay, enter, IconButton, ProgressBar, SectionHeader, Tag, Txt, useCountUp } from '@/components/ui';
import { formatShortDate } from '@/lib/dates';
import { formatMoney, primaryTotal } from '@/lib/format';
import type { Item } from '@/lib/types';
import { getCoverage, isCovered } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, space, TAB_BAR_SPACE, useTheme } from '@/theme';

interface Attention {
  item: Item;
  kind: 'return' | 'warranty';
  days: number;
  date: Date;
}

const weekday = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, settings, canAddItem, loadDemoData } = useVault();

  const stats = useMemo(() => {
    const coveredItems: Item[] = [];
    let covered = 0;
    let expiring = 0;
    let expired = 0;
    const attention: Attention[] = [];

    for (const item of items) {
      const c = getCoverage(item);
      if (isCovered(c)) coveredItems.push(item);
      if (c.status === 'active' || c.status === 'lifetime') covered++;
      if (c.status === 'expiring') expiring++;
      if (c.status === 'expired' || c.status === 'none') expired++;
      if (c.returnOpen && c.returnDeadline) attention.push({ item, kind: 'return', days: c.returnDaysLeft ?? 0, date: c.returnDeadline });
      if (c.status === 'expiring' && c.expiresOn) attention.push({ item, kind: 'warranty', days: c.daysLeft ?? 0, date: c.expiresOn });
    }
    attention.sort((a, b) => a.days - b.days);
    return { value: primaryTotal(coveredItems, settings.currency), covered, expiring, expired, attention };
  }, [items, settings.currency]);

  const animatedValue = useCountUp(stats.value.amount);
  const now = new Date();
  const total = Math.max(1, items.length);
  const share = (stats.covered + stats.expiring) / total;

  const headline =
    items.length === 0
      ? 'Let’s fill your\nvault!'
      : stats.attention.length > 0
        ? `${stats.attention.length} ${stats.attention.length === 1 ? 'thing needs' : 'things need'}\na quick look`
        : 'Your stuff is\nsafe & sound!';

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: TAB_BAR_SPACE + insets.bottom, paddingHorizontal: GUTTER }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <Animated.View entering={enter(0)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: space.xl }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label" tone="secondary">
            {weekday[now.getDay()]} {formatShortDate(now)}
          </Txt>
          <Txt variant="display" style={{ marginTop: 2 }}>
            {headline}
          </Txt>
        </View>
        <IconButton icon="search" accessibilityLabel="Search vault" onPress={() => router.navigate('/vault')} />
      </Animated.View>

      {items.length === 0 ? (
        <EmptyHome onAdd={() => router.push('/add')} onDemo={loadDemoData} />
      ) : (
        <>
          {/* Hero */}
          <Animated.View entering={enter(1)}>
            <Clay color={colors.primary} ledgeColor={colors.primaryLedge} ledge={7} rounded={30} contentStyle={{ padding: space.xxl }}>
              <View style={{ position: 'absolute', right: -40, top: -50, width: 180, height: 180, borderRadius: 90, backgroundColor: 'rgba(255,255,255,0.14)' }} />
              <View style={{ position: 'absolute', right: 50, bottom: -70, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(0,0,0,0.08)' }} />
              <Text style={{ position: 'absolute', right: 22, top: 18, fontSize: 58, transform: [{ rotate: '10deg' }] }}>🛡️</Text>
              <Txt variant="label" tone="inverse" style={{ opacity: 0.85 }}>
                Protected value
              </Txt>
              <Txt variant="hero" tone="inverse" numberOfLines={1} adjustsFontSizeToFit style={{ marginRight: 70 }}>
                {formatMoney(Math.round(animatedValue), stats.value.currency, true)}
              </Txt>
              <View style={{ marginTop: space.md }}>
                <ProgressBar progress={share} color={colors.yellow} track="rgba(255,255,255,0.22)" height={16} delay={350} />
              </View>
              <Txt variant="label" tone="inverse" style={{ marginTop: space.sm, opacity: 0.9 }}>
                {stats.covered + stats.expiring} of {items.length} things covered{share >= 0.8 ? ' · nice! 🙌' : ''}
                {stats.value.mixed ? ` · ${stats.value.currency} only` : ''}
              </Txt>
            </Clay>
          </Animated.View>

          {/* Stats */}
          <Animated.View entering={enter(2)} style={{ flexDirection: 'row', gap: space.sm, marginTop: space.lg }}>
            <Stat value={stats.covered} label="Covered" color={colors.greenLedge} onPress={() => router.navigate('/vault')} />
            <Stat value={stats.expiring} label="Ending" color={colors.orange} onPress={() => router.navigate('/timeline')} />
            <Stat value={stats.expired} label="Expired" color={colors.grey} onPress={() => router.navigate('/vault')} />
          </Animated.View>

          {/* Attention */}
          <Animated.View entering={enter(3)} style={{ marginTop: space.xxl }}>
            <SectionHeader title={stats.attention.length ? 'Heads up!' : 'All clear'} emoji={stats.attention.length ? '⏰' : '😌'} />
            {stats.attention.length === 0 ? (
              <Clay contentStyle={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Text style={{ fontSize: 34 }}>🌈</Text>
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">Nothing ending soon</Txt>
                  <Txt variant="caption" tone="secondary">
                    We’ll nudge you before any return window or warranty runs out.
                  </Txt>
                </View>
              </Clay>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -GUTTER }}
                contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md, paddingBottom: 4 }}>
                {stats.attention.map((a, i) => (
                  <Animated.View key={`${a.item.id}-${a.kind}`} entering={enter(i + 3)}>
                    <AttentionCard a={a} />
                  </Animated.View>
                ))}
              </ScrollView>
            )}
          </Animated.View>

          {/* Recent */}
          <View style={{ marginTop: space.xxl }}>
            <SectionHeader title="Recently added" action="See all" onAction={() => router.navigate('/vault')} />
            <View style={{ gap: space.md }}>
              {items.slice(0, 3).map((item, i) => (
                <Animated.View key={item.id} entering={enter(i + 4)}>
                  <ItemRow item={item} />
                </Animated.View>
              ))}
            </View>
          </View>

          {!settings.isPro && (
            <Animated.View entering={enter(7)} style={{ marginTop: space.xxl }}>
              <Clay color={colors.yellow} ledgeColor={colors.yellowLedge} onPress={() => router.push('/paywall')} contentStyle={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <Text style={{ fontSize: 34 }}>{canAddItem ? '🚀' : '📦'}</Text>
                <View style={{ flex: 1 }}>
                  <Txt variant="headline" style={{ color: '#2A1F5C' }}>
                    {canAddItem ? 'Go Pro, keep everything' : 'Your free vault is full!'}
                  </Txt>
                  <Txt variant="caption" style={{ color: '#2A1F5C', opacity: 0.7 }}>
                    Unlimited items + claim-ready PDFs
                  </Txt>
                </View>
                <Text style={{ fontFamily: fonts.black, fontSize: 22, color: '#2A1F5C' }}>→</Text>
              </Clay>
            </Animated.View>
          )}
        </>
      )}
    </ScrollView>
  );
}

function Stat({ value, label, color, onPress }: { value: number; label: string; color: string; onPress: () => void }) {
  const shown = useCountUp(value, 700);
  return (
    <Clay onPress={onPress} style={{ flex: 1 }} contentStyle={{ paddingVertical: 12, alignItems: 'center' }}>
      <Text style={{ fontFamily: fonts.black, fontSize: 28, color }}>{Math.round(shown)}</Text>
      <Text style={{ fontFamily: fonts.extrabold, fontSize: 13, color }}>{label}</Text>
    </Clay>
  );
}

function AttentionCard({ a }: { a: Attention }) {
  const isReturn = a.kind === 'return';
  return (
    <Clay onPress={() => router.push(`/item/${a.item.id}`)} style={{ width: 176 }} contentStyle={{ padding: space.lg, gap: 6 }}>
      <ItemThumb item={a.item} size={50} />
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6, marginTop: 4 }}>
        <Txt variant="display" style={{ fontSize: 36, lineHeight: 40 }}>
          {a.days}
        </Txt>
        <Txt variant="label" tone="secondary">
          {a.days === 1 ? 'day' : 'days'}
        </Txt>
      </View>
      <Txt variant="headline" numberOfLines={1} style={{ fontSize: 15 }}>
        {a.item.name}
      </Txt>
      <Tag tone={isReturn ? 'pink' : 'yellow'} label={isReturn ? `Return by ${formatShortDate(a.date)}` : `Ends ${formatShortDate(a.date)}`} />
    </Clay>
  );
}

function EmptyHome({ onAdd, onDemo }: { onAdd: () => void; onDemo: () => void }) {
  const { colors } = useTheme();
  return (
    <Animated.View entering={enter(1)}>
      <Clay contentStyle={{ padding: space.xxl, gap: space.lg, alignItems: 'center' }}>
        <View style={{ flexDirection: 'row' }}>
          {['🧾', '🛡️', '⏰'].map((e, i) => (
            <View
              key={e}
              style={{
                width: 70,
                height: 70,
                borderRadius: 24,
                marginLeft: i ? -14 : 0,
                backgroundColor: [colors.pinkSoft, colors.primarySoft, colors.yellowSoft][i],
                borderWidth: 4,
                borderColor: colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                transform: [{ rotate: `${(i - 1) * 10}deg` }, { translateY: i === 1 ? -8 : 0 }],
              }}>
              <Text style={{ fontSize: 34 }}>{e}</Text>
            </View>
          ))}
        </View>
        <Txt variant="title" style={{ textAlign: 'center' }}>
          Snap your first receipt
        </Txt>
        <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
          We’ll track the warranty, the return window and keep the proof ready for when something breaks.
        </Txt>
        <Button title="Add a receipt" emoji="📸" onPress={onAdd} style={{ alignSelf: 'stretch' }} />
        <Button title="Try sample items" kind="white" size="md" onPress={onDemo} style={{ alignSelf: 'stretch' }} />
      </Clay>
    </Animated.View>
  );
}
