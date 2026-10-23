/**
 * Kept design tokens.
 *
 * Direction: warm "paper" neutrals, ink-black primary surfaces, one electric
 * lime accent, and an editorial serif for display numbers and titles.
 */

export const palette = {
  light: {
    bg: '#F3F0EA',
    surface: '#FFFFFF',
    surfaceMuted: '#EAE6DE',
    surfaceSunken: '#E2DDD3',
    ink: '#15140F',
    inkSecondary: '#67625A',
    inkTertiary: '#A29C91',
    line: 'rgba(21,20,15,0.08)',
    lineStrong: 'rgba(21,20,15,0.16)',
    inverse: '#15140F',
    onInverse: '#F7F5F0',
    onInverseMuted: 'rgba(247,245,240,0.6)',
    inverseTint: 'rgba(247,245,240,0.08)',
    inverseTrack: 'rgba(247,245,240,0.14)',
    accent: '#D4F25A',
    onAccent: '#15140F',
    positive: '#2E7D57',
    positiveSoft: '#DDEFE3',
    warning: '#C9761A',
    warningSoft: '#F8E7CF',
    danger: '#BE4436',
    dangerSoft: '#F6DCD7',
    neutralSoft: '#E7E3DB',
    overlay: 'rgba(21,20,15,0.4)',
    tabBar: 'rgba(255,255,255,0.72)',
  },
  dark: {
    bg: '#0D0D0B',
    surface: '#181815',
    surfaceMuted: '#22221E',
    surfaceSunken: '#2B2B26',
    ink: '#F4F1EA',
    inkSecondary: '#A9A49A',
    inkTertiary: '#6E6A62',
    line: 'rgba(244,241,234,0.08)',
    lineStrong: 'rgba(244,241,234,0.16)',
    inverse: '#F4F1EA',
    onInverse: '#15140F',
    onInverseMuted: 'rgba(21,20,15,0.6)',
    inverseTint: 'rgba(21,20,15,0.06)',
    inverseTrack: 'rgba(21,20,15,0.12)',
    accent: '#D4F25A',
    onAccent: '#15140F',
    positive: '#5CC08A',
    positiveSoft: 'rgba(92,192,138,0.14)',
    warning: '#F0A54A',
    warningSoft: 'rgba(240,165,74,0.15)',
    danger: '#EF7A6B',
    dangerSoft: 'rgba(239,122,107,0.15)',
    neutralSoft: 'rgba(244,241,234,0.08)',
    overlay: 'rgba(0,0,0,0.6)',
    tabBar: 'rgba(30,30,27,0.72)',
  },
} as const;

export type Palette = { [K in keyof typeof palette.light]: string };

export const fonts = {
  display: 'InstrumentSerif_400Regular',
  displayItalic: 'InstrumentSerif_400Regular_Italic',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 999,
} as const;

/** Horizontal page gutter used by every screen. */
export const GUTTER = 20;
/** Space reserved at the bottom of scroll views for the floating tab bar. */
export const TAB_BAR_SPACE = 120;
