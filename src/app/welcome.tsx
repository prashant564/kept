import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button, Clay, EASE, enter, Tag, Txt } from '@/components/ui';
import { ensureNotificationPermission } from '@/lib/notifications';
import { useVault } from '@/state/vault';
import { fonts, GUTTER, space, useTheme } from '@/theme';

const POINTS = [
  { emoji: '📸', text: 'Snap a receipt in seconds' },
  { emoji: '⏰', text: 'Nudges before returns & warranties end' },
  { emoji: '📄', text: 'Claim-ready proof when stuff breaks' },
];

/** A sticker in the hero illustration that fades up into place. */
function Floating({ children, delay, x, y, rotate }: { children: React.ReactNode; delay: number; x: number; y: number; rotate: number }) {
  const pop = useSharedValue(0);
  useEffect(() => {
    pop.value = withDelay(delay, withTiming(1, { duration: 450, easing: EASE }));
  }, [delay, pop]);
  const style = useAnimatedStyle(() => ({
    opacity: pop.value,
    transform: [{ translateX: x }, { translateY: y + (1 - pop.value) * 14 }, { rotate: `${rotate}deg` }],
  }));
  return <Animated.View style={[{ position: 'absolute' }, style]}>{children}</Animated.View>;
}

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
    <View style={{ flex: 1, backgroundColor: colors.bg, paddingTop: insets.top + space.lg, paddingBottom: insets.bottom + space.lg }}>
      <Animated.View entering={enter(0)} style={{ paddingHorizontal: GUTTER, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={{ fontSize: 26 }}>🛡️</Text>
        <Txt variant="title">Kept</Txt>
      </Animated.View>

      {/* Sticker pile */}
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginVertical: space.sm }}>
        <Floating delay={100} x={0} y={0} rotate={-4}>
          <Clay ledge={6} rounded={28} contentStyle={{ width: 210, padding: space.lg, gap: 10 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <View style={{ width: 52, height: 52, borderRadius: 18, backgroundColor: colors.pinkSoft, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 30 }}>🎧</Text>
              </View>
              <Text style={{ fontFamily: fonts.black, fontSize: 22, color: colors.ink }}>$399</Text>
            </View>
            <View>
              <Txt variant="headline">Headphones</Txt>
              <Txt variant="caption" tone="secondary">
                Best Buy · 12 Oct
              </Txt>
            </View>
            <Tag tone="green" emoji="✅" label="2 yrs covered" />
          </Clay>
        </Floating>
        <Floating delay={350} x={-122} y={-78} rotate={-14}>
          <View style={{ width: 70, height: 70, borderRadius: 24, backgroundColor: colors.yellow, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 36 }}>🧾</Text>
          </View>
        </Floating>
        <Floating delay={500} x={124} y={-70} rotate={12}>
          <View style={{ width: 62, height: 62, borderRadius: 22, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 30 }}>⏰</Text>
          </View>
        </Floating>
        <Floating delay={650} x={118} y={84} rotate={-10}>
          <View style={{ width: 66, height: 66, borderRadius: 24, backgroundColor: colors.pink, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 32 }}>💻</Text>
          </View>
        </Floating>
        <Floating delay={800} x={-116} y={88} rotate={8}>
          <View style={{ width: 58, height: 58, borderRadius: 20, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 28 }}>📄</Text>
          </View>
        </Floating>
      </View>

      <View style={{ paddingHorizontal: GUTTER, gap: space.lg }}>
        <Animated.View entering={enter(2)}>
          <Txt variant="hero" style={{ fontSize: 42, lineHeight: 46 }}>
            Never lose a{'\n'}
            <Text style={{ color: colors.primary }}>receipt</Text> again.
          </Txt>
        </Animated.View>

        <View style={{ gap: space.sm }}>
          {POINTS.map((p, i) => (
            <Animated.View key={p.text} entering={enter(3 + i)} style={{ flexDirection: 'row', alignItems: 'center', gap: space.md }}>
              <View style={{ width: 38, height: 38, borderRadius: 13, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 19 }}>{p.emoji}</Text>
              </View>
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {p.text}
              </Txt>
            </Animated.View>
          ))}
        </View>

        <Animated.View entering={enter(6)} style={{ gap: space.md, marginTop: space.xs }}>
          <Button title="Let’s go!" emoji="🚀" loading={busy === 'start'} disabled={busy !== null} onPress={() => finish(false)} />
          <Button title="Peek with sample items" kind="white" size="md" loading={busy === 'demo'} disabled={busy !== null} onPress={() => finish(true)} />
        </Animated.View>
      </View>
    </View>
  );
}
