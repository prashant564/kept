import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import type { SoftTone } from '@/lib/categories';
import type { CoverageStatus } from '@/lib/warranty';
import { fonts, LEDGE, radius, space, useTheme, type Palette } from '@/theme';

export type IconName = ComponentProps<typeof Feather>['name'];

export function tap() {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
}

export function celebrateHaptic() {
  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
}

/** Shared easing: quick start, soft landing, no overshoot. */
export const EASE = Easing.out(Easing.cubic);

/** Staggered fade-and-rise entrance used by cards and list rows. */
export function enter(index = 0) {
  return FadeInDown.delay(Math.min(index, 8) * 40)
    .duration(320)
    .easing(EASE);
}

/* ------------------------------------------------------------------ Text */

type Variant = 'hero' | 'display' | 'title' | 'headline' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'tiny';

const variants: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.black, fontSize: 46, lineHeight: 52, letterSpacing: -1 },
  display: { fontFamily: fonts.black, fontSize: 30, lineHeight: 34, letterSpacing: -0.5 },
  title: { fontFamily: fonts.black, fontSize: 21, lineHeight: 26, letterSpacing: -0.2 },
  headline: { fontFamily: fonts.extrabold, fontSize: 16, lineHeight: 21 },
  body: { fontFamily: fonts.semibold, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.bold, fontSize: 15, lineHeight: 21 },
  caption: { fontFamily: fonts.bold, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.extrabold, fontSize: 13, lineHeight: 17 },
  tiny: { fontFamily: fonts.extrabold, fontSize: 11, lineHeight: 14, letterSpacing: 0.6, textTransform: 'uppercase' },
};

type Tone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'brand';

export function Txt({ variant = 'body', tone = 'primary', style, ...rest }: TextProps & { variant?: Variant; tone?: Tone }) {
  const { colors } = useTheme();
  const color = {
    primary: colors.ink,
    secondary: colors.inkSecondary,
    tertiary: colors.inkTertiary,
    inverse: colors.onPrimary,
    brand: colors.primary,
  }[tone];
  return <Text {...rest} style={[variants[variant], { color }, style]} />;
}

/** Animates a number from 0 to `value` on mount and whenever it changes. */
export function useCountUp(value: number, duration = 900): number {
  const [shown, setShown] = useState(0);
  useEffect(() => {
    let frame = 0;
    const start = Date.now();
    const from = 0;
    const step = () => {
      const t = Math.min(1, (Date.now() - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setShown(from + (value - from) * eased);
      if (t < 1) frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);
  return shown;
}

/* ------------------------------------------------------------------ Clay */

/**
 * A chunky raised surface. The darker ledge sits underneath; pressing sinks the
 * face onto the ledge with a spring, like pushing a real button.
 */
export function Clay({
  children,
  color,
  ledgeColor,
  ledge = LEDGE,
  rounded = radius.lg,
  onPress,
  onLongPress,
  disabled,
  style,
  contentStyle,
  accessibilityLabel,
  accessibilityRole,
  accessibilityState,
}: {
  children: ReactNode;
  color?: string;
  ledgeColor?: string;
  ledge?: number;
  rounded?: number;
  onPress?: () => void;
  onLongPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'tab' | 'radio' | 'link';
  accessibilityState?: { selected?: boolean; disabled?: boolean };
}) {
  const { colors } = useTheme();
  const pressed = useSharedValue(0);
  const face = useAnimatedStyle(() => ({
    transform: [{ translateY: pressed.value * (ledge - 1) }],
  }));

  const outer: ViewStyle = { borderRadius: rounded, backgroundColor: ledgeColor ?? colors.ledge, paddingBottom: ledge };
  const inner: ViewStyle = { borderRadius: rounded, backgroundColor: color ?? colors.surface, overflow: 'hidden' };

  if (!onPress && !onLongPress) {
    return (
      <View style={[outer, style]}>
        <View style={[inner, contentStyle]}>{children}</View>
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole={accessibilityRole ?? 'button'}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      disabled={disabled}
      onPressIn={() => {
        pressed.value = withTiming(1, { duration: 70 });
      }}
      onPressOut={() => {
        pressed.value = withTiming(0, { duration: 140, easing: EASE });
      }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      onLongPress={onLongPress}
      style={[outer, { opacity: disabled ? 0.5 : 1 }, style]}>
      <Animated.View style={[inner, face, contentStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

/* --------------------------------------------------------------- Buttons */

type ButtonKind = 'primary' | 'pink' | 'yellow' | 'green' | 'white' | 'danger';

function buttonColors(kind: ButtonKind, c: Palette) {
  switch (kind) {
    case 'pink':
      return { face: c.pink, ledge: c.pinkLedge, fg: '#FFFFFF' };
    case 'yellow':
      return { face: c.yellow, ledge: c.yellowLedge, fg: '#2A1F5C' };
    case 'green':
      return { face: c.green, ledge: c.greenLedge, fg: '#FFFFFF' };
    case 'white':
      return { face: c.surface, ledge: c.ledge, fg: c.ink };
    case 'danger':
      return { face: c.redSoft, ledge: c.ledge, fg: c.red };
    default:
      return { face: c.primary, ledge: c.primaryLedge, fg: c.onPrimary };
  }
}

export function Button({
  title,
  kind = 'primary',
  icon,
  emoji,
  loading,
  disabled,
  onPress,
  style,
  size = 'lg',
}: {
  title: string;
  kind?: ButtonKind;
  icon?: IconName;
  emoji?: string;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
}) {
  const { colors } = useTheme();
  const { face, ledge, fg } = buttonColors(kind, colors);
  const height = size === 'lg' ? 58 : 46;
  return (
    <Clay
      color={face}
      ledgeColor={ledge}
      ledge={size === 'lg' ? 6 : 4}
      rounded={size === 'lg' ? 22 : 16}
      onPress={onPress}
      disabled={disabled || loading}
      style={style}
      contentStyle={{ height, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: space.xl }}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {emoji ? <Text style={{ fontSize: size === 'lg' ? 18 : 15 }}>{emoji}</Text> : null}
          {icon && !emoji ? <Feather name={icon} size={size === 'lg' ? 19 : 16} color={fg} /> : null}
          <Text style={{ fontFamily: fonts.black, fontSize: size === 'lg' ? 17 : 15, color: fg }}>{title}</Text>
        </>
      )}
    </Clay>
  );
}

export function IconButton({
  icon,
  onPress,
  accessibilityLabel,
  size = 46,
  tone = 'white',
}: {
  icon: IconName;
  onPress?: () => void;
  accessibilityLabel: string;
  size?: number;
  tone?: 'white' | 'yellow' | 'primary';
}) {
  const { colors } = useTheme();
  const map = {
    white: { face: colors.surface, ledge: colors.ledge, fg: colors.ink },
    yellow: { face: colors.yellow, ledge: colors.yellowLedge, fg: '#2A1F5C' },
    primary: { face: colors.primary, ledge: colors.primaryLedge, fg: '#FFFFFF' },
  }[tone];
  return (
    <Clay
      color={map.face}
      ledgeColor={map.ledge}
      ledge={4}
      rounded={16}
      onPress={onPress}
      accessibilityLabel={accessibilityLabel}
      contentStyle={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Feather name={icon} size={size * 0.43} color={map.fg} />
    </Clay>
  );
}

/* ----------------------------------------------------------------- Chips */

export function Chip({
  label,
  selected,
  onPress,
  emoji,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  emoji?: string;
  count?: number;
}) {
  const { colors } = useTheme();
  const fg = selected ? colors.onPrimary : colors.ink;
  return (
    <Clay
      color={selected ? colors.primary : colors.surface}
      ledgeColor={selected ? colors.primaryLedge : colors.ledge}
      ledge={3}
      rounded={16}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      contentStyle={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40, paddingHorizontal: 14 }}>
      {emoji ? <Text style={{ fontSize: 15 }}>{emoji}</Text> : null}
      <Text style={{ fontFamily: fonts.extrabold, fontSize: 14, color: fg }}>{label}</Text>
      {count !== undefined && (
        <View
          style={{
            minWidth: 22,
            height: 22,
            paddingHorizontal: 6,
            borderRadius: 11,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: selected ? 'rgba(255,255,255,0.22)' : colors.surfaceMuted,
          }}>
          <Text style={{ fontFamily: fonts.black, fontSize: 12, color: fg }}>{count}</Text>
        </View>
      )}
    </Clay>
  );
}

/* ---------------------------------------------------------- Status */

export function useToneColors(tone: SoftTone) {
  const { colors } = useTheme();
  return {
    pink: { fg: colors.pinkLedge, bg: colors.pinkSoft, solid: colors.pink },
    yellow: { fg: colors.yellowLedge, bg: colors.yellowSoft, solid: colors.yellow },
    green: { fg: colors.greenLedge, bg: colors.greenSoft, solid: colors.green },
    primary: { fg: colors.primary, bg: colors.primarySoft, solid: colors.primary },
    orange: { fg: colors.orange, bg: colors.orangeSoft, solid: colors.orange },
    grey: { fg: colors.grey, bg: colors.greySoft, solid: colors.grey },
  }[tone];
}

export function statusTone(status: CoverageStatus): SoftTone {
  switch (status) {
    case 'active':
    case 'lifetime':
      return 'green';
    case 'expiring':
      return 'orange';
    case 'expired':
      return 'pink';
    default:
      return 'grey';
  }
}

export const STATUS_LABEL: Record<CoverageStatus, string> = {
  active: 'Covered',
  lifetime: 'Covered for life',
  expiring: 'Ending soon',
  expired: 'Expired',
  none: 'No warranty',
};

export function Tag({ label, tone, emoji }: { label: string; tone: SoftTone; emoji?: string }) {
  const { fg, bg } = useToneColors(tone);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 10, height: 26, borderRadius: 10, backgroundColor: bg }}>
      {emoji ? <Text style={{ fontSize: 12 }}>{emoji}</Text> : null}
      <Text style={{ fontFamily: fonts.black, fontSize: 12, color: fg }}>{label}</Text>
    </View>
  );
}

/* --------------------------------------------------------- Progress */

export function ProgressBar({
  progress,
  color,
  track,
  height = 12,
  delay = 150,
}: {
  progress: number;
  color: string;
  track?: string;
  height?: number;
  delay?: number;
}) {
  const { colors } = useTheme();
  const p = useSharedValue(0);
  useEffect(() => {
    const target = Math.min(1, Math.max(0, progress));
    const t = setTimeout(() => {
      p.value = withTiming(target, { duration: 700, easing: EASE });
    }, delay);
    return () => clearTimeout(t);
  }, [progress, delay, p]);
  const fill = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track ?? colors.surfaceMuted, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', backgroundColor: color, borderRadius: height, minWidth: progress > 0 ? height : 0 }, fill]}>
        {height >= 10 && <View style={{ position: 'absolute', left: height / 2, right: height / 2, top: 3, height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.35)' }} />}
      </Animated.View>
    </View>
  );
}

/* ----------------------------------------------------------- Emoji tile */

export function EmojiTile({ emoji, tone, size = 52 }: { emoji: string; tone: SoftTone; size?: number }) {
  const { bg } = useToneColors(tone);
  return (
    <View style={{ width: size, height: size, borderRadius: size * 0.34, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.55 }}>{emoji}</Text>
    </View>
  );
}

/* ------------------------------------------------------- Section header */

export function SectionHeader({ title, emoji, action, onAction }: { title: string; emoji?: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: space.md }}>
      <Txt variant="title">
        {title}
        {emoji ? ` ${emoji}` : ''}
      </Txt>
      {action && (
        <Pressable hitSlop={10} onPress={onAction}>
          <Txt variant="label" tone="brand">
            {action}
          </Txt>
        </Pressable>
      )}
    </View>
  );
}

/* ---------------------------------------------------------------- Field */

export function Field({
  label,
  emoji,
  right,
  style,
  ...input
}: TextInputProps & { label: string; emoji?: string; right?: ReactNode }) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  return (
    <View style={style as StyleProp<ViewStyle>}>
      <Txt variant="tiny" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 6 }}>
        {label}
      </Txt>
      <Clay ledge={3} rounded={radius.md} ledgeColor={focused ? colors.primary : colors.ledge}>
        <View
          style={{
            flexDirection: 'row',
            alignItems: input.multiline ? 'flex-start' : 'center',
            gap: space.sm,
            minHeight: 56,
            paddingHorizontal: space.lg,
            paddingVertical: input.multiline ? 14 : 0,
            borderRadius: radius.md,
            borderWidth: 2,
            borderColor: focused ? colors.primary : 'transparent',
          }}>
          {emoji ? <Text style={{ fontSize: 18 }}>{emoji}</Text> : null}
          <TextInput
            placeholderTextColor={colors.inkTertiary}
            selectionColor={colors.primary}
            {...input}
            onFocus={(e) => {
              setFocused(true);
              input.onFocus?.(e);
            }}
            onBlur={(e) => {
              setFocused(false);
              input.onBlur?.(e);
            }}
            style={{
              flex: 1,
              fontFamily: fonts.bold,
              fontSize: 16,
              color: colors.ink,
              paddingVertical: 0,
              minHeight: input.multiline ? 72 : undefined,
              textAlignVertical: input.multiline ? 'top' : 'center',
            }}
          />
          {right}
        </View>
      </Clay>
    </View>
  );
}

/* ------------------------------------------------------- Option chips */

export function OptionChips<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: space.sm }}>
      {options.map((o) => (
        <Chip key={String(o.value)} label={o.label} selected={o.value === value} onPress={() => onChange(o.value)} />
      ))}
    </View>
  );
}

/* --------------------------------------------------------- List row */

export function ListRow({
  emoji,
  title,
  subtitle,
  right,
  onPress,
  destructive,
  last,
}: {
  emoji: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  destructive?: boolean;
  last?: boolean;
}) {
  const { colors } = useTheme();
  return (
    <Pressable
      disabled={!onPress}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: space.md,
        paddingVertical: 14,
        paddingHorizontal: space.lg,
        backgroundColor: pressed ? colors.surfaceMuted : 'transparent',
        borderBottomWidth: last ? 0 : 2,
        borderBottomColor: colors.bg,
      })}>
      <View style={{ width: 40, height: 40, borderRadius: 14, backgroundColor: destructive ? colors.redSoft : colors.surfaceMuted, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 19 }}>{emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="headline" style={destructive ? { color: colors.red } : undefined}>
          {title}
        </Txt>
        {subtitle && (
          <Txt variant="caption" tone="secondary">
            {subtitle}
          </Txt>
        )}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={20} color={colors.inkTertiary} /> : null)}
    </Pressable>
  );
}
