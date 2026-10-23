import Feather from '@expo/vector-icons/Feather';
import * as Haptics from 'expo-haptics';
import type { ComponentProps, ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

import { getCategory } from '@/lib/categories';
import type { CategoryId } from '@/lib/types';
import type { CoverageStatus } from '@/lib/warranty';
import { fonts, radius, space, useTheme } from '@/theme';

export type IconName = ComponentProps<typeof Feather>['name'];

export function tap() {
  Haptics.selectionAsync().catch(() => {});
}

/* ------------------------------------------------------------------ Text */

type Variant = 'hero' | 'display' | 'title' | 'headline' | 'body' | 'bodyStrong' | 'caption' | 'label' | 'overline';

const variants: Record<Variant, TextStyle> = {
  hero: { fontFamily: fonts.display, fontSize: 52, lineHeight: 56, letterSpacing: -1 },
  display: { fontFamily: fonts.display, fontSize: 36, lineHeight: 40, letterSpacing: -0.5 },
  title: { fontFamily: fonts.display, fontSize: 26, lineHeight: 30, letterSpacing: -0.2 },
  headline: { fontFamily: fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: fonts.regular, fontSize: 15, lineHeight: 21 },
  bodyStrong: { fontFamily: fonts.medium, fontSize: 15, lineHeight: 21, letterSpacing: -0.1 },
  caption: { fontFamily: fonts.regular, fontSize: 13, lineHeight: 18 },
  label: { fontFamily: fonts.semibold, fontSize: 13, lineHeight: 16, letterSpacing: -0.05 },
  overline: { fontFamily: fonts.semibold, fontSize: 11, lineHeight: 14, letterSpacing: 1.2, textTransform: 'uppercase' },
};

type Tone = 'primary' | 'secondary' | 'tertiary' | 'inverse' | 'inverseMuted' | 'positive' | 'warning' | 'danger';

export function Txt({
  variant = 'body',
  tone = 'primary',
  style,
  ...rest
}: TextProps & { variant?: Variant; tone?: Tone }) {
  const { colors } = useTheme();
  const color = {
    primary: colors.ink,
    secondary: colors.inkSecondary,
    tertiary: colors.inkTertiary,
    inverse: colors.onInverse,
    inverseMuted: colors.onInverseMuted,
    positive: colors.positive,
    warning: colors.warning,
    danger: colors.danger,
  }[tone];
  return <Text {...rest} style={[variants[variant], { color }, style]} />;
}

/* --------------------------------------------------------------- Buttons */

type ButtonKind = 'primary' | 'accent' | 'secondary' | 'ghost' | 'danger';

export function Button({
  title,
  kind = 'primary',
  icon,
  loading,
  disabled,
  onPress,
  style,
  size = 'lg',
}: {
  title: string;
  kind?: ButtonKind;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  size?: 'md' | 'lg';
}) {
  const { colors } = useTheme();
  const bg = {
    primary: colors.inverse,
    accent: colors.accent,
    secondary: colors.surfaceMuted,
    ghost: 'transparent',
    danger: colors.dangerSoft,
  }[kind];
  const fg = {
    primary: colors.onInverse,
    accent: colors.onAccent,
    secondary: colors.ink,
    ghost: colors.ink,
    danger: colors.danger,
  }[kind];
  const height = size === 'lg' ? 56 : 44;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => [
        {
          height,
          borderRadius: radius.pill,
          backgroundColor: bg,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.sm,
          paddingHorizontal: space.xl,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
          transform: [{ scale: pressed ? 0.98 : 1 }],
        },
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon && <Feather name={icon} size={size === 'lg' ? 18 : 16} color={fg} />}
          <Txt variant="headline" style={{ color: fg, fontSize: size === 'lg' ? 16 : 15 }}>
            {title}
          </Txt>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  tone = 'surface',
  size = 44,
  accessibilityLabel,
}: {
  icon: IconName;
  onPress?: () => void;
  tone?: 'surface' | 'muted' | 'inverse' | 'glass';
  size?: number;
  accessibilityLabel: string;
}) {
  const { colors } = useTheme();
  const bg = { surface: colors.surface, muted: colors.surfaceMuted, inverse: colors.inverse, glass: 'rgba(255,255,255,0.9)' }[tone];
  const fg = tone === 'inverse' ? colors.onInverse : tone === 'glass' ? '#15140F' : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      hitSlop={6}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: tone === 'surface' ? 1 : 0,
        borderColor: colors.line,
        opacity: pressed ? 0.7 : 1,
      })}>
      <Feather name={icon} size={size * 0.42} color={fg} />
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Cards */

export function Card({
  children,
  style,
  onPress,
  padded = true,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: PressableProps['onPress'];
  padded?: boolean;
}) {
  const { colors } = useTheme();
  const base: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: padded ? space.lg : 0,
  };
  if (!onPress) return <View style={[base, style]}>{children}</View>;
  return (
    <Pressable
      onPress={(e) => {
        tap();
        onPress(e);
      }}
      style={({ pressed }) => [base, { transform: [{ scale: pressed ? 0.985 : 1 }] }, style]}>
      {children}
    </Pressable>
  );
}

/* ----------------------------------------------------------------- Chips */

export function Chip({
  label,
  selected,
  onPress,
  icon,
  count,
}: {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  icon?: IconName;
  count?: number;
}) {
  const { colors } = useTheme();
  const fg = selected ? colors.onInverse : colors.ink;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={({ pressed }) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        height: 38,
        paddingHorizontal: 14,
        borderRadius: radius.pill,
        backgroundColor: selected ? colors.inverse : colors.surface,
        borderWidth: 1,
        borderColor: selected ? colors.inverse : colors.line,
        opacity: pressed ? 0.8 : 1,
      })}>
      {icon && <Feather name={icon} size={14} color={fg} />}
      <Txt variant="label" style={{ color: fg }}>
        {label}
      </Txt>
      {count !== undefined && (
        <Txt variant="label" style={{ color: selected ? colors.onInverseMuted : colors.inkTertiary }}>
          {count}
        </Txt>
      )}
    </Pressable>
  );
}

/* ---------------------------------------------------------- Status pill */

export function useStatusColors(status: CoverageStatus) {
  const { colors } = useTheme();
  switch (status) {
    case 'active':
    case 'lifetime':
      return { fg: colors.positive, bg: colors.positiveSoft };
    case 'expiring':
      return { fg: colors.warning, bg: colors.warningSoft };
    case 'expired':
      return { fg: colors.danger, bg: colors.dangerSoft };
    default:
      return { fg: colors.inkSecondary, bg: colors.neutralSoft };
  }
}

export const STATUS_LABEL: Record<CoverageStatus, string> = {
  active: 'Covered',
  lifetime: 'Lifetime',
  expiring: 'Expiring soon',
  expired: 'Expired',
  none: 'No warranty',
};

export function StatusPill({ status, label }: { status: CoverageStatus; label?: string }) {
  const { fg, bg } = useStatusColors(status);
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        paddingHorizontal: 10,
        height: 24,
        borderRadius: radius.pill,
        backgroundColor: bg,
      }}>
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: fg }} />
      <Txt variant="label" style={{ color: fg, fontSize: 12 }}>
        {label ?? STATUS_LABEL[status]}
      </Txt>
    </View>
  );
}

/* --------------------------------------------------------- Progress bar */

export function ProgressBar({ progress, color, track, height = 6 }: { progress: number; color: string; track?: string; height?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track ?? colors.surfaceMuted, overflow: 'hidden' }}>
      <View style={{ width: `${Math.round(Math.min(1, Math.max(0, progress)) * 100)}%`, height: '100%', backgroundColor: color, borderRadius: height }} />
    </View>
  );
}

/* -------------------------------------------------------- Category tile */

export function CategoryTile({ category, size = 52 }: { category: CategoryId; size?: number }) {
  const { colors, dark } = useTheme();
  const c = getCategory(category);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: dark ? c.tint.dark : c.tint.light,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Feather name={c.icon} size={size * 0.4} color={colors.ink} />
    </View>
  );
}

/* ------------------------------------------------------- Section header */

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: space.md }}>
      <Txt variant="title">{title}</Txt>
      {action && (
        <Pressable hitSlop={10} onPress={onAction}>
          <Txt variant="label" tone="secondary">
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
  icon,
  right,
  style,
  ...input
}: TextInputProps & { label: string; icon?: IconName; right?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={style as StyleProp<ViewStyle>}>
      <Txt variant="overline" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 4 }}>
        {label}
      </Txt>
      <View
        style={{
          flexDirection: 'row',
          alignItems: input.multiline ? 'flex-start' : 'center',
          gap: space.sm,
          minHeight: 54,
          paddingHorizontal: space.lg,
          paddingVertical: input.multiline ? 14 : 0,
          borderRadius: radius.md,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.line,
        }}>
        {icon && <Feather name={icon} size={17} color={colors.inkTertiary} style={input.multiline ? { marginTop: 2 } : undefined} />}
        <TextInput
          placeholderTextColor={colors.inkTertiary}
          selectionColor={colors.ink}
          {...input}
          style={{
            flex: 1,
            fontFamily: fonts.medium,
            fontSize: 16,
            color: colors.ink,
            paddingVertical: 0,
            minHeight: input.multiline ? 72 : undefined,
            textAlignVertical: input.multiline ? 'top' : 'center',
          }}
        />
        {right}
      </View>
    </View>
  );
}

/* ------------------------------------------------------- Option row */

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
  icon,
  title,
  subtitle,
  right,
  onPress,
  destructive,
  last,
}: {
  icon: IconName;
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
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.line,
      })}>
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 10,
          backgroundColor: destructive ? colors.dangerSoft : colors.surfaceMuted,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Feather name={icon} size={16} color={destructive ? colors.danger : colors.ink} />
      </View>
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong" tone={destructive ? 'danger' : 'primary'}>
          {title}
        </Txt>
        {subtitle && (
          <Txt variant="caption" tone="secondary">
            {subtitle}
          </Txt>
        )}
      </View>
      {right ?? (onPress ? <Feather name="chevron-right" size={18} color={colors.inkTertiary} /> : null)}
    </Pressable>
  );
}
