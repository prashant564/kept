import { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { fonts, useTheme } from '@/theme';

const PIECES = ['✨', '🛡️', '✨', '💜', '✨', '⭐', '✨', '💛', '✨', '🛡️'];

function Piece({ emoji, index, total, onDoneDelay }: { emoji: string; index: number; total: number; onDoneDelay: number }) {
  const { width } = useWindowDimensions();
  const t = useSharedValue(0);
  const angle = (index / total) * Math.PI * 2 + (index % 2 ? 0.2 : -0.2);
  const dist = width * (0.26 + (index % 3) * 0.05);

  useEffect(() => {
    t.value = withSequence(
      withTiming(1, { duration: 750, easing: Easing.out(Easing.cubic) }),
      withDelay(onDoneDelay, withTiming(1.4, { duration: 400 })),
    );
  }, [t, onDoneDelay]);

  const style = useAnimatedStyle(() => {
    const p = Math.min(t.value, 1);
    const fall = Math.max(0, t.value - 1) * 120;
    return {
      opacity: t.value > 1 ? 2.4 - t.value * 1.7 : 1,
      transform: [
        { translateX: Math.cos(angle) * dist * p },
        { translateY: Math.sin(angle) * dist * p + fall },
        { rotate: `${p * (index % 2 ? 30 : -30)}deg` },
        { scale: 0.6 + p * 0.4 },
      ],
    };
  });

  return <Animated.Text style={[styles.piece, style]}>{emoji}</Animated.Text>;
}

/** A brief sparkle burst with a badge, shown after saving an item. */
export function Celebration({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();
  const badge = useSharedValue(0);
  const fade = useSharedValue(1);

  useEffect(() => {
    badge.value = withTiming(1, { duration: 280, easing: Easing.out(Easing.cubic) });
    fade.value = withDelay(1500, withTiming(0, { duration: 450 }));
  }, [badge, fade]);

  const badgeStyle = useAnimatedStyle(() => ({ opacity: badge.value, transform: [{ scale: 0.92 + badge.value * 0.08 }] }));
  const wrapStyle = useAnimatedStyle(() => ({ opacity: fade.value }));

  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.center, wrapStyle]}>
      <View style={styles.center}>
        {PIECES.map((e, i) => (
          <Piece key={i} emoji={e} index={i} total={PIECES.length} onDoneDelay={500} />
        ))}
        <Animated.View style={[styles.badge, { backgroundColor: colors.surface, shadowColor: colors.primary }, badgeStyle]}>
          <Text style={{ fontSize: 44 }}>🛡️</Text>
          <Text style={{ fontFamily: fonts.black, fontSize: 20, color: colors.ink, marginTop: 6 }}>{title}</Text>
          <Text style={{ fontFamily: fonts.bold, fontSize: 13, color: colors.inkSecondary, marginTop: 2, textAlign: 'center' }}>{subtitle}</Text>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  center: { alignItems: 'center', justifyContent: 'center' },
  piece: { position: 'absolute', fontSize: 30 },
  badge: {
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingVertical: 22,
    borderRadius: 30,
    elevation: 16,
    shadowOpacity: 0.3,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 12 },
  },
});
