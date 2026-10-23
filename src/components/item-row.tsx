import { Image } from 'expo-image';
import { router } from 'expo-router';
import { View } from 'react-native';

import { getCategory } from '@/lib/categories';
import { formatMoney } from '@/lib/format';
import type { Item } from '@/lib/types';
import { describeRemaining, getCoverage } from '@/lib/warranty';
import { radius, space, useTheme } from '@/theme';

import { Card, CategoryTile, ProgressBar, StatusPill, Txt, useStatusColors } from './ui';

export function ItemThumb({ item, size = 56 }: { item: Item; size?: number }) {
  const photo = item.attachments.find((a) => a.kind === 'image');
  if (photo) {
    return <Image source={{ uri: photo.uri }} style={{ width: size, height: size, borderRadius: size * 0.32 }} contentFit="cover" />;
  }
  return <CategoryTile category={item.category} size={size} />;
}

export function ItemRow({ item }: { item: Item }) {
  const { colors } = useTheme();
  const c = getCoverage(item);
  const { fg } = useStatusColors(c.status);

  const remaining =
    c.status === 'lifetime' ? 'Covered for life' : c.status === 'none' ? 'No warranty' : describeRemaining(c.daysLeft ?? 0);

  return (
    <Card onPress={() => router.push(`/item/${item.id}`)} style={{ padding: 14 }}>
      <View style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
        <ItemThumb item={item} />
        <View style={{ flex: 1, gap: 2 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: space.sm }}>
            <Txt variant="headline" numberOfLines={1} style={{ flex: 1 }}>
              {item.name}
            </Txt>
            <Txt variant="label" tone="secondary">
              {formatMoney(item.price, item.currency)}
            </Txt>
          </View>
          <Txt variant="caption" tone="secondary" numberOfLines={1}>
            {item.store || getCategory(item.category).label}
          </Txt>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm, marginTop: 8 }}>
            <View style={{ flex: 1 }}>
              <ProgressBar
                progress={c.status === 'lifetime' ? 1 : 1 - c.progress}
                color={fg}
                track={colors.surfaceMuted}
                height={4}
              />
            </View>
            <Txt variant="label" style={{ color: fg, fontSize: 12 }}>
              {remaining}
            </Txt>
          </View>
        </View>
      </View>
      {c.returnOpen && (
        <View
          style={{
            marginTop: 12,
            paddingTop: 10,
            borderTopWidth: 1,
            borderTopColor: colors.line,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}>
          <Txt variant="caption" tone="secondary">
            Return window open
          </Txt>
          <View style={{ borderRadius: radius.pill }}>
            <StatusPill
              status="expiring"
              label={c.returnDaysLeft === 0 ? 'Closes today' : `${c.returnDaysLeft}d left to return`}
            />
          </View>
        </View>
      )}
    </Card>
  );
}
