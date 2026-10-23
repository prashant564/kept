import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow, ItemThumb } from '@/components/item-row';
import { Ring } from '@/components/ring';
import { Button, Card, IconButton, SectionHeader, Txt } from '@/components/ui';
import { formatShortDate } from '@/lib/dates';
import { formatMoney, greeting, primaryTotal } from '@/lib/format';
import type { Item } from '@/lib/types';
import { getCoverage, isCovered } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { GUTTER, radius, space, TAB_BAR_SPACE, useTheme } from '@/theme';

interface Attention {
  item: Item;
  kind: 'return' | 'warranty';
  days: number;
  date: Date;
}

const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

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
    return { protectedValue: primaryTotal(coveredItems, settings.currency), covered, expiring, expired, attention };
  }, [items, settings.currency]);

  const now = new Date();
  const total = Math.max(1, items.length);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: TAB_BAR_SPACE + insets.bottom, paddingHorizontal: GUTTER }}
      showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: space.xxl }}>
        <View style={{ flex: 1 }}>
          <Txt variant="overline" tone="secondary">
            {weekday[now.getDay()]}, {formatShortDate(now)}
          </Txt>
          <Txt variant="display" style={{ marginTop: 6 }}>
            {greeting(now)}
          </Txt>
        </View>
        <IconButton icon="search" accessibilityLabel="Search vault" onPress={() => router.navigate('/vault')} />
      </View>

      {items.length === 0 ? (
        <EmptyHome onAdd={() => router.push('/add')} onDemo={loadDemoData} />
      ) : (
        <>
          {/* Hero */}
          <View style={{ backgroundColor: colors.inverse, borderRadius: radius.xl, padding: space.xxl, overflow: 'hidden' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <View style={{ flex: 1, paddingRight: space.md }}>
                <Txt variant="overline" tone="inverseMuted">
                  Protected value
                </Txt>
                <Txt variant="hero" tone="inverse" numberOfLines={1} adjustsFontSizeToFit style={{ marginTop: 8 }}>
                  {formatMoney(stats.protectedValue.amount, stats.protectedValue.currency, true)}
                </Txt>
                <Txt variant="caption" tone="inverseMuted" style={{ marginTop: 4 }}>
                  {stats.covered + stats.expiring} of {items.length} items under warranty
                  {stats.protectedValue.mixed ? ` · ${stats.protectedValue.currency} only` : ''}
                </Txt>
              </View>
              <View style={{ width: 96, height: 96, alignItems: 'center', justifyContent: 'center' }}>
                <Ring
                  size={96}
                  stroke={10}
                  track={colors.inverseTrack}
                  segments={[
                    { value: stats.covered / total, color: colors.accent },
                    { value: stats.expiring / total, color: colors.warning },
                    { value: stats.expired / total, color: colors.onInverseMuted },
                  ]}
                />
                <View style={{ position: 'absolute', alignItems: 'center' }}>
                  <Txt variant="title" tone="inverse">
                    {Math.round(((stats.covered + stats.expiring) / total) * 100)}%
                  </Txt>
                </View>
              </View>
            </View>

            <View style={{ flexDirection: 'row', marginTop: space.xxl, gap: space.sm }}>
              <HeroStat color={colors.accent} label="Covered" value={stats.covered} />
              <HeroStat color={colors.warning} label="Expiring" value={stats.expiring} />
              <HeroStat color={colors.onInverseMuted} label="Expired" value={stats.expired} />
            </View>
          </View>

          {/* Needs attention */}
          <View style={{ marginTop: space.xxxl }}>
            <SectionHeader title="Needs attention" />
            {stats.attention.length === 0 ? (
              <Card style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: colors.positiveSoft, alignItems: 'center', justifyContent: 'center' }}>
                  <Feather name="check" size={18} color={colors.positive} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="headline">All clear</Txt>
                  <Txt variant="caption" tone="secondary">
                    No return windows or warranties ending soon.
                  </Txt>
                </View>
              </Card>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={{ marginHorizontal: -GUTTER }}
                contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md }}>
                {stats.attention.map((a) => (
                  <AttentionCard key={`${a.item.id}-${a.kind}`} a={a} />
                ))}
              </ScrollView>
            )}
          </View>

          {/* Recent */}
          <View style={{ marginTop: space.xxxl }}>
            <SectionHeader title="Recently added" action="See all" onAction={() => router.navigate('/vault')} />
            <View style={{ gap: space.md }}>
              {items.slice(0, 4).map((item) => (
                <ItemRow key={item.id} item={item} />
              ))}
            </View>
          </View>

          {!settings.isPro && (
            <Card
              onPress={() => router.push('/paywall')}
              style={{ marginTop: space.xxxl, flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.accent, borderColor: 'transparent' }}>
              <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(21,20,15,0.08)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="zap" size={18} color={colors.onAccent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="headline" style={{ color: colors.onAccent }}>
                  {canAddItem ? 'Unlock Kept Pro' : 'Your free vault is full'}
                </Txt>
                <Txt variant="caption" style={{ color: colors.onAccent, opacity: 0.7 }}>
                  Unlimited items, claim-ready PDFs and more.
                </Txt>
              </View>
              <Feather name="arrow-right" size={20} color={colors.onAccent} />
            </Card>
          )}
        </>
      )}
    </ScrollView>
  );
}

function HeroStat({ color, label, value }: { color: string; label: string; value: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: colors.inverseTint, borderRadius: radius.md, padding: space.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
        <Txt variant="caption" tone="inverseMuted">
          {label}
        </Txt>
      </View>
      <Txt variant="title" tone="inverse" style={{ marginTop: 4 }}>
        {value}
      </Txt>
    </View>
  );
}

function AttentionCard({ a }: { a: Attention }) {
  const { colors } = useTheme();
  const urgent = a.days <= 7;
  return (
    <Card onPress={() => router.push(`/item/${a.item.id}`)} style={{ width: 200, gap: space.md }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <ItemThumb item={a.item} size={40} />
        <View
          style={{
            paddingHorizontal: 8,
            height: 22,
            borderRadius: radius.pill,
            justifyContent: 'center',
            backgroundColor: urgent ? colors.dangerSoft : colors.warningSoft,
          }}>
          <Txt variant="label" style={{ fontSize: 11, color: urgent ? colors.danger : colors.warning }}>
            {a.kind === 'return' ? 'Return' : 'Warranty'}
          </Txt>
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
        <Txt variant="display" style={{ fontSize: 44, lineHeight: 46 }}>
          {a.days}
        </Txt>
        <Txt variant="caption" tone="secondary">
          {a.days === 1 ? 'day left' : 'days left'}
        </Txt>
      </View>
      <View>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {a.item.name}
        </Txt>
        <Txt variant="caption" tone="secondary">
          {a.kind === 'return' ? 'Return by' : 'Warranty ends'} {formatShortDate(a.date)}
        </Txt>
      </View>
    </Card>
  );
}

function EmptyHome({ onAdd, onDemo }: { onAdd: () => void; onDemo: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, borderColor: colors.line, padding: space.xxl, gap: space.lg }}>
      <View style={{ flexDirection: 'row' }}>
        {(['file-text', 'shield', 'bell'] as const).map((icon, i) => (
          <View
            key={icon}
            style={{
              width: 56,
              height: 56,
              borderRadius: 18,
              borderWidth: 3,
              borderColor: colors.surface,
              backgroundColor: [colors.accent, colors.surfaceMuted, colors.inverse][i],
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ rotate: `${(i - 1) * 8}deg` }],
              marginLeft: i === 0 ? 0 : -12,
            }}>
            <Feather name={icon} size={22} color={i === 2 ? colors.onInverse : colors.ink} />
          </View>
        ))}
      </View>
      <View>
        <Txt variant="display">Your vault is empty</Txt>
        <Txt variant="body" tone="secondary" style={{ marginTop: 8 }}>
          Snap a receipt and Kept keeps track of the warranty, the return window and the proof you need to claim.
        </Txt>
      </View>
      <Button title="Add your first receipt" icon="camera" onPress={onAdd} />
      <Button title="Explore with sample items" kind="secondary" onPress={onDemo} />
    </View>
  );
}
