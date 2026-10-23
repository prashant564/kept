import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, StatusPill, Txt, type IconName } from '@/components/ui';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, radius, space, useTheme } from '@/theme';

const POINTS: { icon: IconName; text: string }[] = [
  { icon: 'camera', text: 'Snap a receipt in seconds' },
  { icon: 'bell', text: 'Reminders before returns and warranties end' },
  { icon: 'file-text', text: 'Claim-ready PDF whenever you need it' },
];

export default function WelcomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { updateSetting, loadDemoData, items } = useVault();
  const [busy, setBusy] = useState<'start' | 'demo' | null>(null);

  const finish = async (withDemo: boolean) => {
    setBusy(withDemo ? 'demo' : 'start');
    await ensureNotificationPermission().catch(() => false);
    if (withDemo && items.length === 0) await loadDemoData();
    await updateSetting('onboarded', true);
    router.replace('/');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }}>
      <View style={{ paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <View style={{ width: 28, height: 28, borderRadius: 9, backgroundColor: colors.inverse, alignItems: 'center', justifyContent: 'center' }}>
          <Feather name="check" size={16} color={colors.accent} />
        </View>
        <Txt variant="headline">Kept</Txt>
      </View>

      {/* Receipt stack illustration */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ReceiptCard rotate={-9} offsetX={-54} offsetY={18} faded />
        <ReceiptCard rotate={7} offsetX={56} offsetY={8} faded />
        <ReceiptCard rotate={-2} offsetX={0} offsetY={0} />
      </View>

      <View style={{ paddingHorizontal: GUTTER, gap: space.xl }}>
        <Txt variant="hero" style={{ fontSize: 50, lineHeight: 52 }}>
          Every receipt,{'\n'}
          <Txt variant="hero" style={{ fontFamily: fonts.displayItalic, fontSize: 50, lineHeight: 52 }}>
            safely kept.
          </Txt>
        </Txt>

        <View style={{ gap: space.md }}>
          {POINTS.map((p) => (
            <View key={p.icon} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name={p.icon} size={15} color={colors.ink} />
              </View>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {p.text}
              </Txt>
            </View>
          ))}
        </View>

        <View style={{ gap: space.sm, marginTop: space.sm }}>
          <Button title="Get started" icon="arrow-right" loading={busy === 'start'} disabled={busy !== null} onPress={() => finish(false)} />
          <Button title="Try with sample items" kind="ghost" loading={busy === 'demo'} disabled={busy !== null} onPress={() => finish(true)} />
        </View>
      </View>
    </View>
  );
}

function ReceiptCard({ rotate, offsetX, offsetY, faded }: { rotate: number; offsetX: number; offsetY: number; faded?: boolean }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        position: 'absolute',
        width: 190,
        padding: space.lg,
        borderRadius: radius.lg,
        backgroundColor: faded ? colors.surfaceMuted : colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        transform: [{ translateX: offsetX }, { translateY: offsetY }, { rotate: `${rotate}deg` }],
        shadowColor: '#000',
        shadowOpacity: faded ? 0.04 : 0.12,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 12 },
        elevation: faded ? 2 : 10,
        gap: 10,
      }}>
      {faded ? (
        [70, 100, 55, 85, 40].map((w, i) => <View key={i} style={{ height: 8, width: `${w}%`, borderRadius: 4, backgroundColor: colors.surfaceSunken }} />)
      ) : (
        <>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: '#DDE6F7', alignItems: 'center', justifyContent: 'center' }}>
              <Feather name="headphones" size={16} color="#15140F" />
            </View>
            <Txt variant="title" style={{ fontSize: 22 }}>
              $399
            </Txt>
          </View>
          <View>
            <Txt variant="headline" style={{ fontSize: 15 }}>
              Headphones
            </Txt>
            <Txt variant="caption" tone="secondary">
              Best Buy · 12 Oct
            </Txt>
          </View>
          <View style={{ borderTopWidth: 1, borderStyle: 'dashed', borderColor: colors.lineStrong }} />
          <StatusPill status="active" label="2 yrs left" />
        </>
      )}
    </View>
  );
}
