import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, IconButton, tap, Txt, type IconName } from '@/components/ui';
import { FREE_ITEM_LIMIT, useVault } from '@/state/vault';
import { fonts, GUTTER, radius, space, useTheme } from '@/theme';

type PlanId = 'yearly' | 'monthly' | 'lifetime';

// Placeholder prices until store products are wired up (RevenueCat).
const PLANS: { id: PlanId; title: string; price: string; note: string; badge?: string }[] = [
  { id: 'yearly', title: 'Yearly', price: '$14.99', note: '$1.25 / month · 7-day free trial', badge: 'Best value' },
  { id: 'monthly', title: 'Monthly', price: '$2.99', note: 'Billed monthly' },
  { id: 'lifetime', title: 'Lifetime', price: '$29.99', note: 'Pay once, keep forever' },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  { icon: 'layers', title: 'Unlimited items', body: `Free plan holds ${FREE_ITEM_LIMIT}.` },
  { icon: 'file-text', title: 'Claim-ready PDFs', body: 'Receipt, serial and dates in one file.' },
  { icon: 'home', title: 'Insurance inventory', body: 'Your whole household, valued and exported.' },
  { icon: 'heart', title: 'Support an indie app', body: 'No ads. No tracking. Ever.' },
];

export default function PaywallScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { updateSetting } = useVault();
  const [plan, setPlan] = useState<PlanId>('yearly');
  const [busy, setBusy] = useState(false);

  // Dark, premium surface regardless of system theme.
  const ink = '#15140F';
  const paper = '#F7F5F0';
  const muted = 'rgba(247,245,240,0.6)';
  const line = 'rgba(247,245,240,0.12)';

  const purchase = async () => {
    setBusy(true);
    // TODO: replace with RevenueCat purchasePackage once store products exist.
    await new Promise((r) => setTimeout(r, 700));
    await updateSetting('isPro', true);
    setBusy(false);
    Alert.alert('Welcome to Kept Pro', 'Everything is unlocked.', [{ text: 'Nice', onPress: () => router.back() }]);
  };

  return (
    <View style={{ flex: 1, backgroundColor: ink }}>
      <ScrollView contentContainerStyle={{ paddingTop: (Platform.OS === 'ios' ? space.lg : insets.top + space.sm), paddingHorizontal: GUTTER, paddingBottom: 200 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View style={{ backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 12, height: 28, justifyContent: 'center' }}>
            <Txt variant="label" style={{ color: colors.onAccent }}>
              KEPT PRO
            </Txt>
          </View>
          <IconButton icon="x" tone="glass" accessibilityLabel="Close" onPress={() => router.back()} />
        </View>

        <Txt variant="hero" style={{ color: paper, marginTop: space.xxl, fontSize: 46, lineHeight: 50 }}>
          Never lose a{'\n'}
          <Txt variant="hero" style={{ color: colors.accent, fontFamily: fonts.displayItalic, fontSize: 46, lineHeight: 50 }}>
            claim
          </Txt>{' '}
          again.
        </Txt>
        <Txt variant="body" style={{ color: muted, marginTop: space.md }}>
          One repair under warranty pays for years of Pro.
        </Txt>

        <View style={{ marginTop: space.xxl, gap: space.lg }}>
          {FEATURES.map((f) => (
            <View key={f.title} style={{ flexDirection: 'row', gap: space.md, alignItems: 'center' }}>
              <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(212,242,90,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={f.icon} size={18} color={colors.accent} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="headline" style={{ color: paper }}>
                  {f.title}
                </Txt>
                <Txt variant="caption" style={{ color: muted }}>
                  {f.body}
                </Txt>
              </View>
            </View>
          ))}
        </View>

        <View style={{ marginTop: space.xxxl, gap: space.md }}>
          {PLANS.map((p) => {
            const selected = plan === p.id;
            return (
              <Pressable
                key={p.id}
                accessibilityRole="radio"
                accessibilityState={{ selected }}
                onPress={() => {
                  tap();
                  setPlan(p.id);
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: space.md,
                  padding: space.lg,
                  borderRadius: radius.lg,
                  borderWidth: selected ? 2 : 1,
                  borderColor: selected ? colors.accent : line,
                  backgroundColor: selected ? 'rgba(212,242,90,0.06)' : 'transparent',
                }}>
                <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: selected ? colors.accent : line, alignItems: 'center', justifyContent: 'center' }}>
                  {selected && <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent }} />}
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
                    <Txt variant="headline" style={{ color: paper }}>
                      {p.title}
                    </Txt>
                    {p.badge && (
                      <View style={{ backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8, height: 20, justifyContent: 'center' }}>
                        <Txt variant="label" style={{ color: colors.onAccent, fontSize: 11 }}>
                          {p.badge}
                        </Txt>
                      </View>
                    )}
                  </View>
                  <Txt variant="caption" style={{ color: muted }}>
                    {p.note}
                  </Txt>
                </View>
                <Txt variant="title" style={{ color: paper }}>
                  {p.price}
                </Txt>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, paddingHorizontal: GUTTER, paddingTop: space.lg, paddingBottom: insets.bottom + space.md, backgroundColor: ink, borderTopWidth: 1, borderTopColor: line, gap: space.md }}>
        <Button
          kind="accent"
          title={plan === 'yearly' ? 'Start free trial' : plan === 'lifetime' ? 'Unlock forever' : 'Subscribe'}
          loading={busy}
          onPress={purchase}
        />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: space.lg }}>
          <Pressable onPress={() => Alert.alert('Restore purchases', 'Store purchases will be restored here once billing is connected.')}>
            <Txt variant="caption" style={{ color: muted }}>
              Restore
            </Txt>
          </Pressable>
          <Txt variant="caption" style={{ color: muted }}>
            ·
          </Txt>
          <Txt variant="caption" style={{ color: muted }}>
            Cancel anytime
          </Txt>
        </View>
      </View>
    </View>
  );
}
