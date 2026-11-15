import Feather from '@expo/vector-icons/Feather';
import { useMemo, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Modal, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CURRENCIES, type Currency } from '@/lib/currencies';
import { fonts, GUTTER, radius, space, useTheme } from '@/theme';

import { Clay, tap, Txt } from './ui';

/** Bottom sheet for choosing a currency, with search. */
export function CurrencySheet({
  visible,
  value,
  title = 'Choose currency',
  onSelect,
  onClose,
}: {
  visible: boolean;
  value: string;
  title?: string;
  onSelect: (code: string) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CURRENCIES;
    return CURRENCIES.filter((c) => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [query]);

  const close = () => {
    setQuery('');
    onClose();
  };

  const choose = (c: Currency) => {
    tap();
    setQuery('');
    onSelect(c.code);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={close} statusBarTranslucent navigationBarTranslucent>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable accessibilityLabel="Close" onPress={close} style={{ flex: 1, backgroundColor: colors.overlay }} />
        <View
          style={{
            maxHeight: '78%',
            backgroundColor: colors.bg,
            borderTopLeftRadius: radius.xl,
            borderTopRightRadius: radius.xl,
            paddingTop: space.sm,
            paddingBottom: insets.bottom + space.sm,
          }}>
          <View style={{ alignSelf: 'center', width: 44, height: 5, borderRadius: 3, backgroundColor: colors.ledge, marginBottom: space.md }} />
          <View style={{ paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
            <Txt variant="title">{title}</Txt>
            <Pressable accessibilityLabel="Close" hitSlop={10} onPress={close} style={{ width: 34, height: 34, borderRadius: 17, backgroundColor: colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="x" size={17} color={colors.ink} />
            </Pressable>
          </View>

          <View style={{ paddingHorizontal: GUTTER, marginBottom: space.md }}>
            <Clay ledge={3} rounded={radius.md} contentStyle={{ height: 50, flexDirection: 'row', alignItems: 'center', gap: space.sm, paddingHorizontal: space.lg }}>
              <Feather name="search" size={18} color={colors.inkSecondary} />
              <TextInput
                value={query}
                onChangeText={setQuery}
                placeholder="Search currency or country"
                placeholderTextColor={colors.inkTertiary}
                selectionColor={colors.primary}
                autoCorrect={false}
                style={{ flex: 1, fontFamily: fonts.bold, fontSize: 16, color: colors.ink, paddingVertical: 0 }}
              />
            </Clay>
          </View>

          <FlatList
            data={results}
            keyExtractor={(c) => c.code}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: GUTTER, paddingBottom: space.lg }}
            ListEmptyComponent={
              <Txt variant="body" tone="secondary" style={{ textAlign: 'center', paddingVertical: space.xxl }}>
                No currency matches “{query}”
              </Txt>
            }
            renderItem={({ item }) => {
              const selected = item.code === value;
              return (
                <Pressable
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => choose(item)}
                  style={({ pressed }) => ({
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: space.md,
                    paddingHorizontal: space.md,
                    paddingVertical: 12,
                    marginBottom: 4,
                    borderRadius: radius.md,
                    backgroundColor: selected ? colors.primarySoft : pressed ? colors.surfaceMuted : 'transparent',
                  })}>
                  <Text style={{ fontSize: 26 }}>{item.flag}</Text>
                  <View style={{ flex: 1 }}>
                    <Txt variant="headline">{item.code}</Txt>
                    <Txt variant="caption" tone="secondary">
                      {item.name}
                    </Txt>
                  </View>
                  <Text style={{ fontFamily: fonts.extrabold, fontSize: 15, color: colors.inkSecondary }}>{item.symbol}</Text>
                  <View
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: 12,
                      borderWidth: selected ? 0 : 2,
                      borderColor: colors.ledge,
                      backgroundColor: selected ? colors.primary : 'transparent',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}>
                    {selected && <Feather name="check" size={14} color="#FFFFFF" />}
                  </View>
                </Pressable>
              );
            }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
