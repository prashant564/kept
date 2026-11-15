import { Image } from 'expo-image';
import { router } from 'expo-router';
import { Text, View } from 'react-native';

import { getCategory, itemEmoji } from '@/lib/categories';
import { formatMoney } from '@/lib/format';
import type { Item } from '@/lib/types';
import { describeRemaining, getCoverage } from '@/lib/warranty';
import { fonts, space } from '@/theme';

import { Clay, EmojiTile, ProgressBar, statusTone, Tag, Txt, useToneColors } from './ui';

export function ItemThumb({ item, size = 56 }: { item: Item; size?: number }) {
  const photo = item.attachments.find((a) => a.kind === 'image');
  if (photo) {
    return <Image source={{ uri: photo.uri }} style={{ width: size, height: size, borderRadius: size * 0.34 }} contentFit="cover" />;
  }
  return <EmojiTile emoji={itemEmoji(item)} tone={getCategory(item.category).tone} size={size} />;
}

export function ItemRow({ item }: { item: Item }) {
  const c = getCoverage(item);
  const tone = statusTone(c.status);
  const { fg, solid } = useToneColors(tone);

  const remaining =
    c.status === 'lifetime' ? 'Forever 💫' : c.status === 'none' ? 'No warranty' : describeRemaining(c.daysLeft ?? 0);

  return (
    <Clay onPress={() => router.push(`/item/${item.id}`)} contentStyle={{ padding: 14 }}>
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
              <ProgressBar progress={c.status === 'lifetime' ? 1 : 1 - c.progress} color={solid} height={8} />
            </View>
            <Text style={{ fontFamily: fonts.black, fontSize: 12, color: fg }}>{remaining}</Text>
          </View>
        </View>
      </View>
      {c.returnOpen && (
        <View style={{ marginTop: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Txt variant="caption" tone="secondary">
            Changed your mind?
          </Txt>
          <Tag tone="pink" emoji="↩️" label={c.returnDaysLeft === 0 ? 'Return today' : `${c.returnDaysLeft}d to return`} />
        </View>
      )}
    </Clay>
  );
}
