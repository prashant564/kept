import Feather from '@expo/vector-icons/Feather';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrencySheet } from '@/components/currency-sheet';
import { Button, Chip, Clay, enter, Field, IconButton, OptionChips, tap, Txt } from '@/components/ui';
import { CATEGORIES, itemEmoji } from '@/lib/categories';
import { getCurrency } from '@/lib/currencies';
import { formatDate, parseISODate, startOfToday, toISODate } from '@/lib/dates';
import { deleteFile, pickDocument, pickPhoto, takePhoto, type PickedFile } from '@/lib/files';
import type { CategoryId } from '@/lib/types';
import { describeRemaining, getCoverage, RETURN_OPTIONS, WARRANTY_OPTIONS } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, radius, space, useTheme } from '@/theme';

export default function AddItemScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { getItem, saveItem, settings } = useVault();
  const existing = id ? getItem(id) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [store, setStore] = useState(existing?.store ?? '');
  const [price, setPrice] = useState(existing?.price != null ? String(existing.price) : '');
  const [currency, setCurrency] = useState(existing?.currency ?? settings.currency);
  const [purchaseDate, setPurchaseDate] = useState(existing?.purchaseDate ?? toISODate(startOfToday()));
  const [category, setCategory] = useState<CategoryId>(existing?.category ?? 'electronics');
  const [warrantyMonths, setWarrantyMonths] = useState(existing?.warrantyMonths ?? 24);
  const [returnDays, setReturnDays] = useState(existing?.returnDays ?? 30);
  const [serial, setSerial] = useState(existing?.serial ?? '');
  const [notes, setNotes] = useState(existing?.notes ?? '');
  const [files, setFiles] = useState<PickedFile[]>(existing?.attachments.map(({ uri, kind, name }) => ({ uri, kind, name })) ?? []);
  const [saving, setSaving] = useState(false);
  const [showIOSPicker, setShowIOSPicker] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);

  const coverage = useMemo(() => getCoverage({ purchaseDate, warrantyMonths, returnDays }), [purchaseDate, warrantyMonths, returnDays]);
  const previewEmoji = itemEmoji({ name, category });
  const savedUris = useMemo(() => new Set(existing?.attachments.map((a) => a.uri) ?? []), [existing]);

  const addFile = async (source: () => Promise<PickedFile | null>) => {
    try {
      const f = await source();
      if (f) setFiles((prev) => [...prev, f]);
    } catch (e) {
      Alert.alert('Could not add file', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const f = prev[index];
      // Files copied during this session aren't referenced anywhere else yet.
      if (f && !savedUris.has(f.uri)) deleteFile(f.uri);
      return prev.filter((_, j) => j !== index);
    });
  };

  const close = () => {
    files.filter((f) => !savedUris.has(f.uri)).forEach((f) => deleteFile(f.uri));
    router.back();
  };

  const openDatePicker = () => {
    tap();
    const value = parseISODate(purchaseDate);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate: new Date(),
        onValueChange: (_, date) => setPurchaseDate(toISODate(date)),
      });
    } else {
      setShowIOSPicker((v) => !v);
    }
  };

  const openCurrency = () => {
    tap();
    setCurrencyOpen(true);
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('What is it?', 'Give the item a name so you can find it later.');
      return;
    }
    const parsed = price.trim() ? Number(price.replace(',', '.')) : null;
    setSaving(true);
    try {
      const itemId = await saveItem(
        {
          name,
          store,
          category,
          price: parsed !== null && !Number.isNaN(parsed) ? parsed : null,
          currency,
          purchaseDate,
          warrantyMonths,
          returnDays,
          serial,
          notes,
          attachments: files,
        },
        existing?.id,
      );
      router.back();
      if (!existing) setTimeout(() => router.push({ pathname: '/item/[id]', params: { id: itemId, celebrate: '1' } }), 250);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      setSaving(false);
    }
  };

  const summary =
    coverage.status === 'lifetime'
      ? 'Covered for life 💫'
      : coverage.status === 'none'
        ? 'No manufacturer warranty'
        : coverage.expiresOn
          ? `${coverage.status === 'expired' ? 'Expired' : 'Covered until'} ${formatDate(coverage.expiresOn)}`
          : '';

  const sectionLabel = (t: string) => (
    <Txt variant="tiny" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 6 }}>
      {t}
    </Txt>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={{ paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm, paddingHorizontal: GUTTER, paddingBottom: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <IconButton icon="x" accessibilityLabel="Close" onPress={close} />
        <Txt variant="title">{existing ? 'Edit item' : 'New item'}</Txt>
        <Animated.View key={previewEmoji} entering={FadeIn.duration(200)} style={{ width: 50, height: 50, borderRadius: 18, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ fontSize: 28 }}>{previewEmoji}</Text>
        </Animated.View>
      </View>

      <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 150, gap: space.xl }} showsVerticalScrollIndicator={false}>
        {/* Receipt capture */}
        <Animated.View entering={enter(0)}>
          {sectionLabel('Receipt & photos')}
          {files.length === 0 ? (
            <Clay contentStyle={{ padding: space.lg, gap: space.lg }}>
              <View style={{ gap: 2 }}>
                <Text style={{ fontSize: 34, textAlign: 'center' }}>🧾</Text>
                <Txt variant="title" style={{ textAlign: 'center' }}>
                  Add the receipt
                </Txt>
                <Txt variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                  Paper fades. Photos don’t.
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <CaptureButton emoji="📸" label="Camera" kind="primary" onPress={() => addFile(takePhoto)} />
                <CaptureButton emoji="🖼️" label="Photos" kind="soft" onPress={() => addFile(pickPhoto)} />
                <CaptureButton emoji="📄" label="PDF" kind="soft" onPress={() => addFile(pickDocument)} />
              </View>
            </Clay>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md, paddingBottom: 6 }}>
              {files.map((f, i) => (
                <Animated.View key={f.uri} entering={FadeIn.duration(220)} style={{ width: 106, height: 140 }}>
                  {f.kind === 'image' ? (
                    <Image source={{ uri: f.uri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6 }}>
                      <Text style={{ fontSize: 34 }}>📄</Text>
                      <Txt variant="caption" numberOfLines={2} style={{ textAlign: 'center', fontSize: 11 }}>
                        {f.name}
                      </Txt>
                    </View>
                  )}
                  <Pressable
                    accessibilityLabel="Remove file"
                    hitSlop={8}
                    onPress={() => removeFile(i)}
                    style={{ position: 'absolute', top: -6, right: -6, width: 28, height: 28, borderRadius: 14, backgroundColor: colors.pink, borderWidth: 3, borderColor: colors.bg, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="x" size={13} color="#fff" />
                  </Pressable>
                </Animated.View>
              ))}
              <View style={{ width: 106, height: 140, gap: 6 }}>
                {(
                  [
                    ['📸', takePhoto],
                    ['🖼️', pickPhoto],
                    ['📄', pickDocument],
                  ] as const
                ).map(([emoji, fn]) => (
                  <Clay key={emoji} ledge={3} rounded={14} onPress={() => addFile(fn)} style={{ flex: 1 }} contentStyle={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 18 }}>{emoji}</Text>
                  </Clay>
                ))}
              </View>
            </ScrollView>
          )}
        </Animated.View>

        <Animated.View entering={enter(1)}>
          <Field label="What is it?" emoji="✏️" placeholder="e.g. Sony WH-1000XM6" value={name} onChangeText={setName} autoFocus={!existing} returnKeyType="next" />
        </Animated.View>
        <Animated.View entering={enter(2)}>
          <Field label="Where from?" emoji="🏬" placeholder="Store or website" value={store} onChangeText={setStore} />
        </Animated.View>

        <Animated.View entering={enter(3)} style={{ flexDirection: 'row', gap: space.md }}>
          <Field
            label="Price"
            style={{ flex: 1 }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            right={
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Currency: ${currency}. Change`}
                onPress={openCurrency}
                hitSlop={8}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: colors.primarySoft, borderRadius: 10, paddingHorizontal: 8, height: 30 }}>
                <Text style={{ fontSize: 13 }}>{getCurrency(currency).flag}</Text>
                <Text style={{ fontFamily: fonts.black, fontSize: 12, color: colors.primary }}>{currency}</Text>
                <Feather name="chevron-down" size={13} color={colors.primary} />
              </Pressable>
            }
          />
          <View style={{ flex: 1 }}>
            {sectionLabel('Bought on')}
            <Clay ledge={3} rounded={radius.md} onPress={openDatePicker} contentStyle={{ height: 60, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg }}>
              <Text style={{ fontSize: 18 }}>📅</Text>
              <Txt variant="headline">{formatDate(parseISODate(purchaseDate))}</Txt>
            </Clay>
          </View>
        </Animated.View>
        {showIOSPicker && Platform.OS === 'ios' && (
          <DateTimePicker value={parseISODate(purchaseDate)} mode="date" display="inline" maximumDate={new Date()} accentColor={colors.primary} onValueChange={(_, date) => setPurchaseDate(toISODate(date))} />
        )}

        <Animated.View entering={enter(4)}>
          {sectionLabel('Category')}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm, paddingBottom: 2 }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} emoji={c.emoji} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Coverage */}
        <Animated.View entering={enter(5)}>
          <Clay contentStyle={{ padding: space.lg, gap: space.lg }}>
            <View>
              <Txt variant="headline" style={{ marginBottom: space.md }}>
                🛡️ Warranty
              </Txt>
              <OptionChips options={WARRANTY_OPTIONS.map((o) => ({ label: o.label, value: o.months }))} value={warrantyMonths} onChange={setWarrantyMonths} />
            </View>
            <View>
              <Txt variant="headline" style={{ marginBottom: space.md }}>
                ↩️ Return window
              </Txt>
              <OptionChips options={RETURN_OPTIONS.map((o) => ({ label: o.label, value: o.days }))} value={returnDays} onChange={setReturnDays} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: coverage.status === 'expired' ? colors.redSoft : colors.greenSoft, borderRadius: radius.md, padding: space.md }}>
              <Text style={{ fontSize: 26 }}>{coverage.status === 'expired' ? '😬' : coverage.status === 'none' ? '🤷' : '🎉'}</Text>
              <View style={{ flex: 1 }}>
                <Txt variant="headline">{summary}</Txt>
                {coverage.daysLeft !== null && (
                  <Txt variant="caption" tone="secondary">
                    {describeRemaining(coverage.daysLeft)}
                    {coverage.returnOpen && coverage.returnDeadline ? ` · return by ${formatDate(coverage.returnDeadline)}` : ''}
                  </Txt>
                )}
              </View>
            </View>
          </Clay>
        </Animated.View>

        <Field label="Serial number" emoji="#️⃣" placeholder="Optional" value={serial} onChangeText={setSerial} autoCapitalize="characters" />
        <Field label="Notes" emoji="📝" placeholder="Extended warranty, model number…" value={notes} onChangeText={setNotes} multiline />
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: space.md, paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg }}>
        <Button title={existing ? 'Save changes' : 'Save to vault'} emoji={existing ? '💾' : '🛡️'} loading={saving} onPress={onSave} />
      </View>
      <CurrencySheet
        visible={currencyOpen}
        value={currency}
        title="Paid in"
        onSelect={(code) => {
          setCurrency(code);
          setCurrencyOpen(false);
        }}
        onClose={() => setCurrencyOpen(false)}
      />
    </KeyboardAvoidingView>
  );
}

function CaptureButton({ emoji, label, onPress, kind }: { emoji: string; label: string; onPress: () => void; kind: 'primary' | 'soft' }) {
  const { colors } = useTheme();
  const primary = kind === 'primary';
  return (
    <Clay
      color={primary ? colors.primary : colors.surfaceMuted}
      ledgeColor={primary ? colors.primaryLedge : colors.ledge}
      ledge={4}
      rounded={18}
      onPress={onPress}
      style={{ flex: 1 }}
      contentStyle={{ height: 84, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
      <Text style={{ fontSize: 26 }}>{emoji}</Text>
      <Text style={{ fontFamily: fonts.black, fontSize: 14, color: primary ? '#FFFFFF' : colors.ink }}>{label}</Text>
    </Clay>
  );
}
