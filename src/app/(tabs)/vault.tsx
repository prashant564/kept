import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItemRow } from '@/components/item-row';
import { Chip, IconButton, Txt } from '@/components/ui';
import { CATEGORIES } from '@/lib/categories';
import { formatMoney, primaryTotal } from '@/lib/format';
import { exportInventoryPdf } from '@/lib/pdf';
import type { CategoryId } from '@/lib/types';
import { getCoverage, type Coverage } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, radius, space, TAB_BAR_SPACE, useTheme } from '@/theme';

type Filter = 'all' | 'covered' | 'expiring' | 'expired' | 'return';

const FILTERS: { id: Filter; label: string; test: (c: Coverage) => boolean }[] = [
  { id: 'all', label: 'All', test: () => true },
  { id: 'covered', label: 'Covered', test: (c) => c.status === 'active' || c.status === 'lifetime' },
  { id: 'expiring', label: 'Expiring', test: (c) => c.status === 'expiring' },
  { id: 'return', label: 'Returnable', test: (c) => c.returnOpen },
  { id: 'expired', label: 'Expired', test: (c) => c.status === 'expired' || c.status === 'none' },
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
    <View style={{ paddingTop: insets.top + space.lg }}>
      <View style={{ paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <View style={{ flex: 1 }}>
          <Txt variant="overline" tone="secondary">
            {visible.length} items · {formatMoney(total.amount, total.currency, true)}
            {total.mixed ? ` (${total.currency})` : ''}
          </Txt>
          <Txt variant="display" style={{ marginTop: 6 }}>
            Your vault
          </Txt>
        </View>
        <IconButton icon="share" accessibilityLabel="Export inventory PDF" onPress={onExport} />
      </View>

      <View
        style={{
          marginHorizontal: GUTTER,
          marginTop: space.xl,
          height: 50,
          borderRadius: radius.pill,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.lg,
          gap: space.sm,
        }}>
        <Feather name="search" size={18} color={colors.inkTertiary} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search name, store or serial"
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.ink}
          returnKeyType="search"
          style={{ flex: 1, fontFamily: fonts.medium, fontSize: 15, color: colors.ink, paddingVertical: 0 }}
        />
        {query.length > 0 && (
          <Pressable hitSlop={10} onPress={() => setQuery('')}>
            <Feather name="x-circle" size={18} color={colors.inkTertiary} />
          </Pressable>
        )}
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm, paddingTop: space.lg }}>
        {FILTERS.map((f) => (
          <Chip key={f.id} label={f.label} count={counts[f.id]} selected={filter === f.id} onPress={() => setFilter(f.id)} />
        ))}
      </ScrollView>

      {usedCategories.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm, paddingTop: space.sm }}>
          {usedCategories.map((cat) => (
            <Chip
              key={cat.id}
              icon={cat.icon}
              label={cat.label}
              selected={category === cat.id}
              onPress={() => setCategory(category === cat.id ? null : cat.id)}
            />
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
      renderItem={({ item }) => (
        <View style={{ paddingHorizontal: GUTTER }}>
          <ItemRow item={item} />
        </View>
      )}
      ListEmptyComponent={
        <View style={{ alignItems: 'center', paddingTop: 48, paddingHorizontal: 40, gap: space.sm }}>
          <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center', marginBottom: space.sm }}>
            <Feather name={items.length ? 'search' : 'archive'} size={22} color={colors.inkSecondary} />
          </View>
          <Txt variant="title" style={{ textAlign: 'center' }}>
            {items.length ? 'Nothing matches' : 'No items yet'}
          </Txt>
          <Txt variant="body" tone="secondary" style={{ textAlign: 'center' }}>
            {items.length ? 'Try a different search or filter.' : 'Tap + to add your first receipt.'}
          </Txt>
        </View>
      }
    />
  );
}
