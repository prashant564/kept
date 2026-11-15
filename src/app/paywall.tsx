import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, celebrateHaptic, Clay, enter, IconButton, tap, Txt } from '@/components/ui';
import { FREE_ITEM_LIMIT, useVault } from '@/state/vault';
import { fonts, GUTTER, space, useTheme } from '@/theme';

type PlanId = 'yearly' | 'monthly' | 'lifetime';

// Placeholder prices until store products are wired up (RevenueCat).
const PLANS: { id: PlanId; title: string; price: string; note: string; badge?: string }[] = [
  { id: 'yearly', title: 'Yearly', price: '$14.99', note: '$1.25/mo · 7 days free', badge: 'Best value' },
  { id: 'monthly', title: 'Monthly', price: '$2.99', note: 'Cancel anytime' },
  { id: 'lifetime', title: 'Lifetime', price: '$29.99', note: 'Pay once, keep forever' },
];

const FEATURES = [
  { emoji: '📦', title: 'Unlimited items', body: `Free plan holds ${FREE_ITEM_LIMIT}` },
  { emoji: '📄', title: 'Claim-ready PDFs', body: 'Receipt, serial & dates in one tap' },
  { emoji: '🏠', title: 'Insurance inventory', body: 'Everything you own, valued' },
  { emoji: '💜', title: 'Support an indie app', body: 'No ads. No tracking. Ever.' },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { updateSetting } = useVault();
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);

  const purchase = async () => {
    setBusy(true);
    // TODO: replace with RevenueCat purchasePackage once store products exist.
    await new Promise((r) => setTimeout(r, 700));
    await updateSetting('isPro', true);
    setBusy(false);
    celebrateHaptic();
    Alert.alert('Welcome to Pro! 👑', 'Everything is unlocked.', [{ text: 'Yay!', onPress: () => router.back() }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.primary }}>
      <View style={{ position: 'absolute', right: -80, top: -60, width: 260, height: 260, borderRadius: 130, backgroundColor: 'rgba(255,255,255,0.12)' }} />
      <View style={{ position: 'absolute', left: -60, top: 220, width: 160, height: 160, borderRadius: 80, backgroundColor: 'rgba(0,0,0,0.07)' }} />

      <ScrollView contentContainerStyle={{ paddingTop: Platform.OS === 'ios' ? space.lg : insets.top + space.sm, paddingHorizontal: GUTTER, paddingBottom: 190 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end' }}>
          <IconButton icon="x" accessibilityLabel="Close" onPress={() => router.back()} />
        </View>

        <Text style={{ fontSize: 64, alignSelf: 'center', marginTop: space.sm, transform: [{ rotate: '-8deg' }] }}>👑</Text>
        <Animated.View entering={enter(0)}>
          <Txt variant="hero" tone="inverse" style={{ textAlign: 'center', fontSize: 38, lineHeight: 42, marginTop: space.sm }}>
            Never lose a{'\n'}
            <Text style={{ color: colors.yellow }}>claim</Text> again
          </Txt>
          <Txt variant="bodyStrong" tone="inverse" style={{ textAlign: 'center', opacity: 0.85, marginTop: space.sm }}>
            One free repair pays for years of Pro.
          </Txt>
        </Animated.View>

        <Animated.View entering={enter(1)} style={{ marginTop: space.xxl }}>
          <Clay color="rgba(255,255,255,0.14)" ledgeColor="rgba(0,0,0,0.12)" ledge={4} contentStyle={{ padding: space.lg, gap: space.md }}>
            {FEATURES.map((f) => (
              <View key={f.title} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
                <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 21 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="headline" tone="inverse">
                    {f.title}
                  </Txt>
                  <Txt variant="caption" tone="inverse" style={{ opacity: 0.8 }}>
                    {f.body}
                  </Txt>
                </View>
              </View>
            ))}
          </Clay>
        </Animated.View>

        <View style={{ marginTop: space.xl, gap: space.md }}>
          {PLANS.map((p, i) => {
            const selected = plan === p.id;
            return (
              <Animated.View key={p.id} entering={enter(2 + i)}>
                <Clay
                  color={selected ? colors.surface : 'rgba(255,255,255,0.14)'}
                  ledgeColor={selected ? colors.yellow : 'rgba(0,0,0,0.12)'}
                  ledge={selected ? 6 : 4}
                  rounded={22}
                  accessibilityRole="radio"
                  accessibilityState={{ selected }}
                  onPress={() => {
                    tap();
                    setPlan(p.id);
                  }}
                  contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: space.md, padding: space.lg }}>
                  <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 3, borderColor: selected ? colors.primary : 'rgba(255,255,255,0.6)', alignItems: 'center', justifyContent: 'center' }}>
                    {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary }} />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                      <Text style={{ fontFamily: fonts.black, fontSize: 17, color: selected ? colors.ink : '#FFFFFF' }}>{p.title}</Text>
                      {p.badge && (
                        <View style={{ backgroundColor: colors.yellow, borderRadius: 8, paddingHorizontal: 8, height: 22, justifyContent: 'center' }}>
                          <Text style={{ fontFamily: fonts.black, fontSize: 11, color: '#2A1F5C' }}>{p.badge}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: selected ? colors.inkSecondary : 'rgba(255,255,255,0.8)' }}>{p.note}</Text>
                  </View>
                  <Text style={{ fontFamily: fonts.black, fontSize: 21, color: selected ? colors.ink : '#FFFFFF' }}>{p.price}</Text>
                </Clay>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: space.lg, paddingBottom: insets.bottom + space.md, backgroundColor: colors.primary, gap: space.md }}>
        <Button kind="yellow" emoji={plan === 'lifetime' ? '💎' : '🚀'} title={plan === 'yearly' ? 'Start my free week' : plan === 'lifetime' ? 'Unlock forever' : 'Subscribe'} loading={busy} onPress={purchase} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }}>
          <Pressable onPress={() => Alert.alert('Restore purchases', 'Store purchases will be restored here once billing is connected.')}>
            <Txt variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
              Restore
            </Txt>
          </Pressable>
          <Txt variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
            ·
          </Txt>
          <Txt variant="caption" tone="inverse" style={{ opacity: 0.85 }}>
            Cancel anytime
          </Txt>
        </View>
      </View>
    </View>
  );
}
