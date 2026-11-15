import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/item-row';
import { Chip, Clay, enter, IconButton, Txt } from '@/components/ui';
import { CATEGORIES } from '@/lib/categories';
import { formatMoney, primaryTotal } from '@/lib/format';
import { exportInventoryPdf } from '@/lib/pdf';
import type { CategoryId } from '@/lib/types';
import { getCoverage, type Coverage } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, space, TAB_BAR_SPACE, useTheme } from '@/theme';

type Filter = 'all' | 'covered' | 'expiring' | 'expired' | 'return';

const FILTERS: { id: Filter; label: string; emoji: string; test: (c: Coverage) => boolean }[] = [
  { id: 'all', label: 'All', emoji: '📦', test: () => true },
  { id: 'covered', label: 'Covered', emoji: '✅', test: (c) => c.status === 'active' || c.status === 'lifetime' },
  { id: 'expiring', label: 'Ending', emoji: '⏳', test: (c) => c.status === 'expiring' },
  { id: 'return', label: 'Returnable', emoji: '↩️', test: (c) => c.returnOpen },
  { id: 'expired', label: 'Expired', emoji: '💤', test: (c) => c.status === 'expired' || c.status === 'none' },
];

export default function VaultScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, settings } = useVault();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [category, setCategory] = useState<CategoryId | null>(null);

  const withCoverage = useMemo(() => items.map((item) => ({ item, c: getCoverage(item) })), [items]);

  const counts = useMemo(() => {
    const out = {} as Record<Filter, number>;
    for (const f of FILTERS) out[f.id] = withCoverage.filter(({ c }) => f.test(c)).length;
    return out;
  }, [withCoverage]);

  const usedCategories = useMemo(() => CATEGORIES.filter((cat) => items.some((i) => i.category === cat.id)), [items]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const test = FILTERS.find((f) => f.id === filter)!.test;
    return withCoverage
      .filter(({ item, c }) => {
        if (!test(c)) return false;
        if (category && item.category !== category) return false;
        if (!q) return true;
        return [item.name, item.store, item.serial, item.notes].some((s) => s.toLowerCase().includes(q));
      })
      .map(({ item }) => item);
  }, [withCoverage, filter, category, query]);

  const total = primaryTotal(visible, settings.currency);

  const onExport = async () => {
    if (!settings.isPro) {
      router.push('/paywall');
      return;
    }
    if (items.length === 0) {
      Alert.alert('Nothing to export', 'Add an item first.');
      return;
    }
    await exportInventoryPdf(items, settings.currency);
  };

  const header = (
    <View style={{ paddingTop: insets.top + space.md }}>
      <View style={{ paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt variant="label" tone="secondary">
            {visible.length} things · {formatMoney(total.amount, total.currency, true)}
            {total.mixed ? ` (${total.currency})` : ''}
          </Txt>
          <Txt variant="display">Your vault 📦</Txt>
        </View>
        <IconButton icon="share" accessibilityLabel="Export inventory PDF" onPress={onExport} />
      </View>

      <View style={{ marginHorizontal: GUTTER, marginTop: space.lg }}>
        <Clay ledge={4} rounded={20} contentStyle={{ height: 54, flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.lg, gap: space.sm }}>
          <Feather name="search" size={19} color={colors.inkSecondary} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Find by name, store or serial"
            placeholderTextColor={colors.inkTertiary}
            selectionColor={colors.primary}
            returnKeyType="search"
            style={{ flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink, paddingVertical: 0 }}
          />
          {query.length > 0 && (
            <Pressable hitSlop={10} onPress={() => setQuery('')}>
              <Feather name="x-circle" size={19} color={colors.inkTertiary} />
            </Pressable>
          )}
        </Clay>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm, paddingTop: space.lg, paddingBottom: 2 }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} emoji={f.emoji} label={f.label} count={counts[f.id]} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {usedCategories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm, paddingTop: space.sm, paddingBottom: 2 }}>
          {usedCategories.map((cat) => (
            <Chip key={cat.id} emoji={cat.emoji} label={cat.label} selected={category === cat.id} onPress={() => setCategory(category === cat.id ? null : cat.id)} />
          ))}
        </ScrollView>
      )}
      <View style={{ height: space.lg }} />
    </View>
  );

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: colors.bg }}
      data={visible}
      keyExtractor={(i) => i.id}
      ListHeaderComponent={header}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={{ paddingBottom: TAB_BAR_SPACE + insets.bottom }}
      ItemSeparatorComponent={() => <View style={{ height: space.md }} />}
      renderItem={({ item, index }) => (
        <Animated.View entering={enter(index)} style={{ paddingHorizontal: GUTTER }}>
          <ItemRow item={item} />
        </Animated.View>
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 40, paddingHorizontal: 40, gap: space.sm }}>
          <Text style={{ fontSize: 56 }}>{items.length ? '🔍' : '📭'}</Text>
          <Txt variant="title" style={{ textAlign: 'center' }}>
            {items.length ? 'Nothing here' : 'Empty vault'}
          </Txt>
          <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {items.length ? 'Try another search or filter.' : 'Tap the pink + to add your first receipt.'}
          </Txt>
        </View>
      }
    />
  );
}
