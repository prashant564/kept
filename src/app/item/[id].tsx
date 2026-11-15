import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useEffect, useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { Celebration } from '@/components/celebration';
import { Button, celebrateHaptic, Clay, EASE, enter, IconButton, statusTone, STATUS_LABEL, Tag, Txt, useCountUp, useToneColors } from '@/components/ui';
import { getCategory, itemEmoji } from '@/lib/categories';
import { formatDate, parseISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { exportItemPdf } from '@/lib/pdf';
import type { Attachment } from '@/lib/types';
import { describeRemaining, getCoverage, warrantyLabel } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, radius, space, useTheme } from '@/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** Donut that fills to `progress` with a spring. */
function Donut({ progress, color, track, size = 96 }: { progress: number; color: string; track: string; size?: number }) {
  const stroke = 13;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(150, withTiming(progress, { duration: 800, easing: EASE }));
  }, [progress, p]);
  const props = useAnimatedProps(() => ({ strokeDashoffset: circ * (1 - p.value) }));
  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
      <AnimatedCircle cx={size / 2} cy={size / 2} r={r} stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none" strokeDasharray={`${circ} ${circ}`} animatedProps={props} />
    </Svg>
  );
}

export default function ItemScreen() {
  const { id, celebrate } = useLocalSearchParams<{ id: string; celebrate?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { getItem, deleteItem, settings } = useVault();
  const [viewer, setViewer] = useState<Attachment | null>(null);
  const [exporting, setExporting] = useState(false);
  const [party, setParty] = useState(celebrate === '1');
  const item = getItem(id);

  const c = item ? getCoverage(item) : null;
  const tone = statusTone(c?.status ?? 'none');
  const toneColors = useToneColors(tone);
  const days = useCountUp(c?.daysLeft && c.daysLeft > 0 ? c.daysLeft : 0, 1000);

  // Hero object settles into place.
  const drop = useSharedValue(0);
  useEffect(() => {
    drop.value = withTiming(1, { duration: 450, easing: EASE });
  }, [drop]);
  const heroStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: (1 - drop.value) * 12 }, { rotate: '-6deg' }, { scale: 0.92 + drop.value * 0.08 }],
    opacity: drop.value,
  }));

  useEffect(() => {
    if (!party) return;
    celebrateHaptic();
    const t = setTimeout(() => setParty(false), 2200);
    return () => clearTimeout(t);
  }, [party]);

  if (!item || !c) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <Text style={{ fontSize: 50 }}>🤔</Text>
        <Txt variant="title">Item not found</Txt>
        <Button title="Go back" kind="white" size="md" onPress={() => router.back()} />
      </View>
    );
  }

  const category = getCategory(item.category);
  const photo = item.attachments.find((a) => a.kind === 'image');
  const purchased = parseISODate(item.purchaseDate);
  const heroTone = heroColors(category.tone, colors);

  const onExport = async () => {
    if (!settings.isPro) {
      router.push('/paywall');
      return;
    }
    setExporting(true);
    try {
      await exportItemPdf(item);
    } catch (e) {
      Alert.alert('Export failed', e instanceof Error ? e.message : 'Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const onDelete = () =>
    Alert.alert(`Delete ${item.name}?`, 'The item, its receipts and reminders will be removed.', [
      { text: 'Keep it', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          router.back();
          await deleteItem(item.id);
        },
      },
    ]);

  const openAttachment = async (a: Attachment) => {
    if (a.kind === 'image') setViewer(a);
    else if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(a.uri, { mimeType: 'application/pdf' });
  };

  const donutProgress = c.status === 'lifetime' ? 1 : c.status === 'none' ? 0 : 1 - c.progress;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingTop: insets.top + space.sm, paddingHorizontal: GUTTER, paddingBottom: insets.bottom + 120, gap: space.lg }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <IconButton icon="arrow-left" accessibilityLabel="Back" onPress={() => router.back()} />
          <IconButton icon="edit-2" tone="yellow" accessibilityLabel="Edit" onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} />
        </View>

        {/* Stage */}
        <Animated.View entering={enter(0)}>
          <Clay color={heroTone.bg} ledgeColor={heroTone.ledge} ledge={6} rounded={34} onPress={photo ? () => setViewer(photo) : undefined} contentStyle={{ height: 230, alignItems: 'center', justifyContent: 'center' }}>
            {photo ? (
              <Image source={{ uri: photo.uri }} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} contentFit="cover" />
            ) : (
              <Animated.Text style={[{ fontSize: 110 }, heroStyle]}>{itemEmoji(item)}</Animated.Text>
            )}
            <View style={{ position: 'absolute', top: 14, right: 14 }}>
              <View style={{ backgroundColor: toneColors.solid, borderRadius: 14, paddingHorizontal: 12, height: 32, justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.black, fontSize: 13, color: '#FFFFFF' }}>
                  {c.status === 'expired' ? '⌛ ' : '✓ '}
                  {STATUS_LABEL[c.status]}
                </Text>
              </View>
            </View>
          </Clay>
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <Txt variant="display">{item.name}</Txt>
          <Txt variant="bodyStrong" tone="secondary" style={{ marginTop: 2 }}>
            {[item.store, formatDate(purchased), formatMoney(item.price, item.currency)].filter(Boolean).join(' · ')}
          </Txt>
        </Animated.View>

        {/* Coverage */}
        <Animated.View entering={enter(2)}>
          <Clay contentStyle={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.lg }}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Donut progress={donutProgress} color={toneColors.solid} track={colors.surfaceMuted} />
              <Text style={{ position: 'absolute', fontFamily: fonts.black, fontSize: 18, color: colors.ink }}>
                {c.status === 'lifetime' ? '∞' : `${Math.round(donutProgress * 100)}%`}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              {c.status === 'lifetime' ? (
                <Txt variant="display">Forever 💫</Txt>
              ) : c.status === 'none' ? (
                <Txt variant="title">No warranty</Txt>
              ) : c.status === 'expired' ? (
                <Txt variant="title">{describeRemaining(c.daysLeft ?? 0)}</Txt>
              ) : (
                <>
                  <Txt variant="hero" style={{ fontSize: 42, lineHeight: 46 }}>
                    {Math.round(days)}
                  </Txt>
                  <Txt variant="label" tone="secondary">
                    days of cover left
                  </Txt>
                </>
              )}
              <Txt variant="caption" style={{ marginTop: 4 }}>
                {warrantyLabel(item.warrantyMonths)}
                {c.expiresOn ? ` · ends ${formatDate(c.expiresOn)}` : ''}
              </Txt>
            </View>
          </Clay>
        </Animated.View>

        {c.returnDeadline && (
          <Animated.View entering={enter(3)}>
            <Clay color={c.returnOpen ? colors.yellowSoft : colors.surface} ledgeColor={c.returnOpen ? colors.yellow : colors.ledge} contentStyle={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Text style={{ fontSize: 26 }}>{c.returnOpen ? '↩️' : '🔒'}</Text>
              <View style={{ flex: 1 }}>
                <Txt variant="headline">{c.returnOpen ? `Return window closes in ${c.returnDaysLeft} ${c.returnDaysLeft === 1 ? 'day' : 'days'}` : 'Return window closed'}</Txt>
                <Txt variant="caption" tone="secondary">
                  {c.returnOpen ? `Last day: ${formatDate(c.returnDeadline)}` : formatDate(c.returnDeadline)}
                </Txt>
              </View>
            </Clay>
          </Animated.View>
        )}

        <Animated.View entering={enter(4)} style={{ flexDirection: 'row', gap: space.md }}>
          <Detail emoji="🏷️" label="Category" value={category.label} />
          <Detail emoji="#️⃣" label="Serial" value={item.serial || '—'} />
        </Animated.View>

        {/* Receipts */}
        <Animated.View entering={enter(5)}>
          <Txt variant="title" style={{ marginBottom: space.md }}>
            Proof of purchase 🧾
          </Txt>
          {item.attachments.length === 0 ? (
            <Clay onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} contentStyle={{ padding: space.lg, flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <Text style={{ fontSize: 30 }}>📸</Text>
              <View style={{ flex: 1 }}>
                <Txt variant="headline">No receipt yet</Txt>
                <Txt variant="caption" tone="secondary">
                  Add a photo or PDF so you can claim later.
                </Txt>
              </View>
              <Tag tone="primary" label="Add" />
            </Clay>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md }}>
              {item.attachments.map((a) => (
                <Pressable key={a.id} onPress={() => openAttachment(a)} style={{ width: 118, height: 156 }}>
                  {a.kind === 'image' ? (
                    <Image source={{ uri: a.uri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 8 }}>
                      <Text style={{ fontSize: 36 }}>📄</Text>
                      <Txt variant="caption" numberOfLines={3} style={{ textAlign: 'center', fontSize: 11 }}>
                        {a.name}
                      </Txt>
                    </View>
                  )}
                </Pressable>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {item.notes ? (
          <Animated.View entering={enter(6)}>
            <Clay contentStyle={{ padding: space.lg, gap: 4 }}>
              <Txt variant="tiny" tone="secondary">
                📝 Notes
              </Txt>
              <Txt variant="body">{item.notes}</Txt>
            </Clay>
          </Animated.View>
        ) : null}

        <Button title="Delete item" kind="danger" size="md" emoji="🗑️" onPress={onDelete} />
      </ScrollView>

      <View style={{ position: 'absolute', left: GUTTER, right: GUTTER, bottom: insets.bottom + space.lg }}>
        <Button title="Get my claim PDF" emoji="📄" loading={exporting} onPress={onExport} />
      </View>

      {party && <Celebration title="Saved & protected!" subtitle={c.expiresOn ? `We’ll remind you before ${formatDate(c.expiresOn)}` : 'It’s safe in your vault'} />}

      <Modal visible={viewer !== null} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(22,17,46,0.96)' }}>
          {viewer && <Image source={{ uri: viewer.uri }} style={{ flex: 1 }} contentFit="contain" />}
          <View style={{ position: 'absolute', top: insets.top + space.sm, right: GUTTER }}>
            <IconButton icon="x" accessibilityLabel="Close" onPress={() => setViewer(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function heroColors(tone: string, colors: ReturnType<typeof useTheme>['colors']) {
  switch (tone) {
    case 'pink':
      return { bg: colors.pinkSoft, ledge: colors.pink };
    case 'yellow':
      return { bg: colors.yellowSoft, ledge: colors.yellow };
    case 'green':
      return { bg: colors.greenSoft, ledge: colors.green };
    case 'orange':
      return { bg: colors.orangeSoft, ledge: colors.orange };
    case 'grey':
      return { bg: colors.greySoft, ledge: colors.ledge };
    default:
      return { bg: colors.primarySoft, ledge: colors.ledge };
  }
}

function Detail({ emoji, label, value }: { emoji: string; label: string; value: string }) {
  return (
    <Clay style={{ flex: 1 }} contentStyle={{ padding: space.lg, gap: 4 }}>
      <Txt variant="tiny" tone="secondary">
        {emoji} {label}
      </Txt>
      <Txt variant="headline" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
        {value}
      </Txt>
    </Clay>
  );
}
