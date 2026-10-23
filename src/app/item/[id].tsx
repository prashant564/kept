import Feather from '@expo/vector-icons/Feather';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Modal, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Card, IconButton, ProgressBar, StatusPill, Txt, useStatusColors } from '@/components/ui';
import { getCategory } from '@/lib/categories';
import { formatDate, parseISODate } from '@/lib/dates';
import { formatMoney } from '@/lib/format';
import { exportItemPdf } from '@/lib/pdf';
import type { Attachment } from '@/lib/types';
import { describeRemaining, getCoverage, warrantyLabel } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { GUTTER, radius, space, useTheme } from '@/theme';

export default function ItemScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, dark } = useTheme();
  const { getItem, deleteItem, settings } = useVault();
  const [viewer, setViewer] = useState<Attachment | null>(null);
  const [exporting, setExporting] = useState(false);
  const item = getItem(id);

  const c = item ? getCoverage(item) : null;
  const { fg } = useStatusColors(c?.status ?? 'none');

  if (!item || !c) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', gap: space.lg }}>
        <Txt variant="title">Item not found</Txt>
        <Button title="Go back" kind="secondary" size="md" onPress={() => router.back()} />
      </View>
    );
  }

  const category = getCategory(item.category);
  const photo = item.attachments.find((a) => a.kind === 'image');
  const purchased = parseISODate(item.purchaseDate);

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
      { text: 'Cancel', style: 'cancel' },
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

  const bigNumber =
    c.status === 'lifetime' ? '∞' : c.status === 'none' ? '—' : c.daysLeft !== null && c.daysLeft >= 0 ? String(c.daysLeft) : '0';
  const bigCaption =
    c.status === 'lifetime'
      ? 'Covered for life'
      : c.status === 'none'
        ? 'No warranty on file'
        : c.status === 'expired'
          ? describeRemaining(c.daysLeft ?? 0)
          : c.daysLeft === 1
            ? 'day of cover left'
            : 'days of cover left';

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={{ height: 300 + insets.top, backgroundColor: dark ? category.tint.dark : category.tint.light, alignItems: 'center', justifyContent: 'center' }}>
          {photo ? (
            <Pressable onPress={() => setViewer(photo)} style={{ position: 'absolute', inset: 0 }}>
              <Image source={{ uri: photo.uri }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
            </Pressable>
          ) : (
            <View style={{ alignItems: 'center', gap: space.md, marginTop: insets.top }}>
              <View style={{ width: 96, height: 96, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.55)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={category.icon} size={40} color="#15140F" />
              </View>
              <Txt variant="overline" style={{ color: '#15140F', opacity: 0.6 }}>
                {category.label}
              </Txt>
            </View>
          )}
        </View>

        {/* Sheet */}
        <View style={{ marginTop: -28, backgroundColor: colors.bg, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingHorizontal: GUTTER, paddingTop: space.xxl, gap: space.xl }}>
          <View style={{ gap: space.sm }}>
            <StatusPill status={c.status} />
            <Txt variant="display">{item.name}</Txt>
            <Txt variant="body" tone="secondary">
              {[item.store, formatDate(purchased)].filter(Boolean).join(' · ')}
            </Txt>
          </View>

          {/* Coverage */}
          <Card style={{ gap: space.lg }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8, flexShrink: 1 }}>
                <Txt variant="hero" style={{ color: fg }}>
                  {bigNumber}
                </Txt>
                <Txt variant="caption" tone="secondary" style={{ flexShrink: 1 }}>
                  {bigCaption}
                </Txt>
              </View>
              <Txt variant="label" tone="secondary">
                {warrantyLabel(item.warrantyMonths)}
              </Txt>
            </View>
            {c.expiresOn && (
              <View style={{ gap: space.sm }}>
                <ProgressBar progress={c.progress} color={fg} height={8} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Txt variant="caption" tone="secondary">
                    {formatDate(purchased)}
                  </Txt>
                  <Txt variant="caption" tone="secondary">
                    {formatDate(c.expiresOn)}
                  </Txt>
                </View>
              </View>
            )}
            {c.returnDeadline && (
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.md,
                  borderRadius: radius.md,
                  backgroundColor: c.returnOpen ? colors.warningSoft : colors.surfaceMuted,
                }}>
                <Feather name="rotate-ccw" size={16} color={c.returnOpen ? colors.warning : colors.inkTertiary} />
                <Txt variant="bodyStrong" style={{ flex: 1, color: c.returnOpen ? colors.warning : colors.inkSecondary }}>
                  {c.returnOpen
                    ? `Return by ${formatDate(c.returnDeadline)} · ${c.returnDaysLeft}d left`
                    : `Return window closed ${formatDate(c.returnDeadline)}`}
                </Txt>
              </View>
            )}
          </Card>

          {/* Details */}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.md }}>
            <Detail label="Price paid" value={formatMoney(item.price, item.currency)} />
            <Detail label="Category" value={category.label} />
            <Detail label="Purchased" value={formatDate(purchased)} />
            <Detail label="Serial" value={item.serial || '—'} mono />
          </View>

          {/* Receipts */}
          <View>
            <Txt variant="title" style={{ marginBottom: space.md }}>
              Proof of purchase
            </Txt>
            {item.attachments.length === 0 ? (
              <Card onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, borderStyle: 'dashed', borderColor: colors.lineStrong }}>
                <Feather name="plus-circle" size={20} color={colors.inkSecondary} />
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">No receipt yet</Txt>
                  <Txt variant="caption" tone="secondary">
                    Add a photo or PDF so you can claim later.
                  </Txt>
                </View>
              </Card>
            ) : (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md }}>
                {item.attachments.map((a) => (
                  <Pressable key={a.id} onPress={() => openAttachment(a)} style={{ width: 120, height: 160 }}>
                    {a.kind === 'image' ? (
                      <Image source={{ uri: a.uri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} contentFit="cover" />
                    ) : (
                      <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 8 }}>
                        <Feather name="file-text" size={28} color={colors.danger} />
                        <Txt variant="caption" numberOfLines={3} style={{ textAlign: 'center', fontSize: 11 }}>
                          {a.name}
                        </Txt>
                      </View>
                    )}
                  </Pressable>
                ))}
              </ScrollView>
            )}
          </View>

          {item.notes ? (
            <View>
              <Txt variant="title" style={{ marginBottom: space.md }}>
                Notes
              </Txt>
              <Card>
                <Txt variant="body">{item.notes}</Txt>
              </Card>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: space.md }}>
            <Button title="Edit" kind="secondary" icon="edit-2" style={{ flex: 1 }} onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} />
            <Button title="Delete" kind="danger" icon="trash-2" style={{ flex: 1 }} onPress={onDelete} />
          </View>
        </View>
      </ScrollView>

      {/* Floating nav */}
      <View style={{ position: 'absolute', top: insets.top + space.sm, left: GUTTER, right: GUTTER, flexDirection: 'row', justifyContent: 'space-between' }}>
        <IconButton icon="arrow-left" tone="glass" accessibilityLabel="Back" onPress={() => router.back()} />
        <IconButton icon="edit-2" tone="glass" accessibilityLabel="Edit" onPress={() => router.push({ pathname: '/add', params: { id: item.id } })} />
      </View>

      {/* Primary action */}
      <View style={{ position: 'absolute', left: GUTTER, right: GUTTER, bottom: insets.bottom + space.lg }}>
        <Button title="Export claim PDF" icon="file-text" loading={exporting} onPress={onExport} style={{ shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 20, shadowOffset: { width: 0, height: 8 }, elevation: 10 }} />
      </View>

      <Modal visible={viewer !== null} transparent animationType="fade" onRequestClose={() => setViewer(null)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.94)' }}>
          {viewer && <Image source={{ uri: viewer.uri }} style={{ flex: 1 }} contentFit="contain" />}
          <View style={{ position: 'absolute', top: insets.top + space.sm, right: GUTTER }}>
            <IconButton icon="x" tone="glass" accessibilityLabel="Close" onPress={() => setViewer(null)} />
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Detail({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: '47.5%', flexGrow: 1, backgroundColor: colors.surface, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: 4 }}>
      <Txt variant="overline" tone="tertiary">
        {label}
      </Txt>
      <Txt variant="headline" numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7} style={mono ? { fontVariant: ['tabular-nums'] } : undefined}>
        {value}
      </Txt>
    </View>
  );
}
