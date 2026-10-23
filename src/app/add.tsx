import Feather from '@expo/vector-icons/Feather';
import DateTimePicker, { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Chip, Field, IconButton, OptionChips, tap, Txt, type IconName } from '@/components/ui';
import { CATEGORIES } from '@/lib/categories';
import { formatDate, parseISODate, startOfToday, toISODate } from '@/lib/dates';
import { CURRENCIES } from '@/lib/format';
import { pickDocument, pickPhoto, takePhoto, type PickedFile } from '@/lib/files';
import type { CategoryId } from '@/lib/types';
import { describeRemaining, getCoverage, RETURN_OPTIONS, WARRANTY_OPTIONS } from '@/lib/warranty';
import { useVault } from '@/state/vault';
import { GUTTER, radius, space, useTheme } from '@/theme';

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

  const coverage = useMemo(() => getCoverage({ purchaseDate, warrantyMonths, returnDays }), [purchaseDate, warrantyMonths, returnDays]);

  const addFile = async (source: () => Promise<PickedFile | null>) => {
    try {
      const f = await source();
      if (f) setFiles((prev) => [...prev, f]);
    } catch (e) {
      Alert.alert('Could not add file', e instanceof Error ? e.message : 'Please try again.');
    }
  };

  const openDatePicker = () => {
    tap();
    const value = parseISODate(purchaseDate);
    if (Platform.OS === 'android') {
      DateTimePickerAndroid.open({
        value,
        mode: 'date',
        maximumDate: new Date(),
        onChange: (event, date) => {
          if (event.type === 'set' && date) setPurchaseDate(toISODate(date));
        },
      });
    } else {
      setShowIOSPicker((v) => !v);
    }
  };

  const cycleCurrency = () => {
    tap();
    const i = CURRENCIES.indexOf(currency as (typeof CURRENCIES)[number]);
    setCurrency(CURRENCIES[(i + 1) % CURRENCIES.length]);
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Give the item a name so you can find it later.');
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
      if (!existing) setTimeout(() => router.push(`/item/${itemId}`), 250);
    } catch (e) {
      Alert.alert('Could not save', e instanceof Error ? e.message : 'Please try again.');
      setSaving(false);
    }
  };

  const summary =
    coverage.status === 'lifetime'
      ? 'Covered for life'
      : coverage.status === 'none'
        ? 'No manufacturer warranty'
        : coverage.expiresOn
          ? `${coverage.status === 'expired' ? 'Expired' : 'Covered until'} ${formatDate(coverage.expiresOn)}`
          : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View
        style={{
          paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm,
          paddingHorizontal: GUTTER,
          paddingBottom: space.md,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <IconButton icon="x" accessibilityLabel="Close" onPress={() => router.back()} />
        <Txt variant="headline">{existing ? 'Edit item' : 'New item'}</Txt>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: 140, gap: space.xxl }}
        showsVerticalScrollIndicator={false}>
        {/* Receipt capture */}
        <View>
          <Txt variant="overline" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 4 }}>
            Receipt & photos
          </Txt>
          {files.length === 0 ? (
            <View
              style={{
                borderRadius: radius.lg,
                borderWidth: 1.5,
                borderStyle: 'dashed',
                borderColor: colors.lineStrong,
                backgroundColor: colors.surface,
                padding: space.xl,
                gap: space.lg,
              }}>
              <View style={{ gap: 4 }}>
                <Txt variant="title" style={{ textAlign: 'center' }}>
                  Add the receipt
                </Txt>
                <Txt variant="caption" tone="secondary" style={{ textAlign: 'center' }}>
                  Your proof of purchase lives here. Paper receipts fade; photos don’t.
                </Txt>
              </View>
              <View style={{ flexDirection: 'row', gap: space.sm }}>
                <CaptureButton icon="camera" label="Camera" primary onPress={() => addFile(takePhoto)} />
                <CaptureButton icon="image" label="Photos" onPress={() => addFile(pickPhoto)} />
                <CaptureButton icon="file" label="PDF" onPress={() => addFile(pickDocument)} />
              </View>
            </View>
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.md }}>
              {files.map((f, i) => (
                <View key={f.uri} style={{ width: 104, height: 136 }}>
                  {f.kind === 'image' ? (
                    <Image source={{ uri: f.uri }} style={{ width: '100%', height: '100%', borderRadius: radius.md }} contentFit="cover" />
                  ) : (
                    <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center', padding: 8, gap: 6 }}>
                      <Feather name="file-text" size={26} color={colors.danger} />
                      <Txt variant="caption" numberOfLines={2} style={{ textAlign: 'center', fontSize: 11 }}>
                        {f.name}
                      </Txt>
                    </View>
                  )}
                  <Pressable
                    accessibilityLabel="Remove file"
                    hitSlop={8}
                    onPress={() => setFiles((prev) => prev.filter((_, j) => j !== i))}
                    style={{ position: 'absolute', top: 6, right: 6, width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(21,20,15,0.7)', alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="x" size={14} color="#fff" />
                  </Pressable>
                </View>
              ))}
              <View style={{ width: 104, height: 136, gap: space.sm }}>
                {(
                  [
                    ['camera', takePhoto],
                    ['image', pickPhoto],
                    ['file', pickDocument],
                  ] as const
                ).map(([icon, fn]) => (
                  <Pressable
                    key={icon}
                    onPress={() => addFile(fn)}
                    style={({ pressed }) => ({
                      flex: 1,
                      borderRadius: radius.sm,
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: colors.lineStrong,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
                    })}>
                    <Feather name={icon} size={16} color={colors.inkSecondary} />
                  </Pressable>
                ))}
              </View>
            </ScrollView>
          )}
        </View>

        <Field label="Item" icon="box" placeholder="e.g. Sony WH-1000XM6" value={name} onChangeText={setName} autoFocus={!existing} returnKeyType="next" />
        <Field label="Store" icon="shopping-bag" placeholder="Where did you buy it?" value={store} onChangeText={setStore} />

        <View style={{ flexDirection: 'row', gap: space.md }}>
          <Field
            label="Price"
            style={{ flex: 1 }}
            placeholder="0.00"
            keyboardType="decimal-pad"
            value={price}
            onChangeText={setPrice}
            right={
              <Pressable onPress={cycleCurrency} hitSlop={8} style={{ backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: 10, height: 28, justifyContent: 'center' }}>
                <Txt variant="label">{currency}</Txt>
              </Pressable>
            }
          />
          <View style={{ flex: 1 }}>
            <Txt variant="overline" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 4 }}>
              Purchased
            </Txt>
            <Pressable
              onPress={openDatePicker}
              style={{ height: 54, borderRadius: radius.md, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg }}>
              <Feather name="calendar" size={17} color={colors.inkTertiary} />
              <Txt variant="bodyStrong" style={{ fontSize: 16 }}>
                {formatDate(parseISODate(purchaseDate))}
              </Txt>
            </Pressable>
          </View>
        </View>
        {showIOSPicker && Platform.OS === 'ios' && (
          <DateTimePicker
            value={parseISODate(purchaseDate)}
            mode="date"
            display="inline"
            maximumDate={new Date()}
            accentColor={colors.ink}
            onChange={(_, date) => date && setPurchaseDate(toISODate(date))}
          />
        )}

        <View>
          <Txt variant="overline" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 4 }}>
            Category
          </Txt>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -GUTTER }} contentContainerStyle={{ paddingHorizontal: GUTTER, gap: space.sm }}>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} icon={c.icon} label={c.label} selected={category === c.id} onPress={() => setCategory(c.id)} />
            ))}
          </ScrollView>
        </View>

        {/* Coverage */}
        <View style={{ backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: space.lg, gap: space.lg }}>
          <View>
            <Txt variant="overline" tone="secondary" style={{ marginBottom: space.md }}>
              Warranty
            </Txt>
            <OptionChips options={WARRANTY_OPTIONS.map((o) => ({ label: o.label, value: o.months }))} value={warrantyMonths} onChange={setWarrantyMonths} />
          </View>
          <View>
            <Txt variant="overline" tone="secondary" style={{ marginBottom: space.md }}>
              Return window
            </Txt>
            <OptionChips options={RETURN_OPTIONS.map((o) => ({ label: o.label, value: o.days }))} value={returnDays} onChange={setReturnDays} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.md, backgroundColor: colors.surfaceMuted, borderRadius: radius.md, padding: space.md }}>
            <Feather name="shield" size={18} color={coverage.status === 'expired' ? colors.danger : colors.positive} />
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">{summary}</Txt>
              {coverage.daysLeft !== null && (
                <Txt variant="caption" tone="secondary">
                  {describeRemaining(coverage.daysLeft)}
                  {coverage.returnOpen && coverage.returnDeadline ? ` · return by ${formatDate(coverage.returnDeadline)}` : ''}
                </Txt>
              )}
            </View>
          </View>
        </View>

        <Field label="Serial number" icon="hash" placeholder="Optional" value={serial} onChangeText={setSerial} autoCapitalize="characters" />
        <Field label="Notes" icon="edit-3" placeholder="Extended warranty, model number, anything useful" value={notes} onChangeText={setNotes} multiline />
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: space.md, paddingBottom: insets.bottom + space.md, backgroundColor: colors.bg, borderTopWidth: 1, borderTopColor: colors.line }}>
        <Button title={existing ? 'Save changes' : 'Save to vault'} icon="check" loading={saving} onPress={onSave} />
      </View>
    </KeyboardAvoidingView>
  );
}

function CaptureButton({ icon, label, onPress, primary }: { icon: IconName; label: string; onPress: () => void; primary?: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({
        flex: 1,
        height: 76,
        borderRadius: radius.md,
        backgroundColor: primary ? colors.inverse : colors.surfaceMuted,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        opacity: pressed ? 0.8 : 1,
      })}>
      <Feather name={icon} size={20} color={primary ? colors.onInverse : colors.ink} />
      <Txt variant="label" style={{ color: primary ? colors.onInverse : colors.ink }}>
        {label}
      </Txt>
    </Pressable>
  );
}
