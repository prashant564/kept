/**
 * Kept design tokens — "Playful Clay".
 *
 * Candy colours on a soft lavender base. Every raised surface has a "ledge"
 * colour drawn underneath it so cards and buttons read as chunky, pressable
 * objects. Rounded, heavy Nunito for all type.
 */

export const palette = {
  light: {
    bg: '#F3EEFF',
    surface: '#FFFFFF',
    surfaceMuted: '#ECE6FF',
    ledge: '#DCD2FF',
    ink: '#2A1F5C',
    inkSecondary: '#8B7FC7',
    inkTertiary: '#B4A9E6',
    line: 'rgba(42,31,92,0.08)',

    primary: '#7C5CFF',
    primaryLedge: '#5B3FE0',
    primarySoft: '#E9E3FF',
    onPrimary: '#FFFFFF',

    pink: '#FF6B9D',
    pinkLedge: '#E0457A',
    pinkSoft: '#FFE4EE',
    yellow: '#FFD43B',
    yellowLedge: '#E0B000',
    yellowSoft: '#FFF3C4',
    green: '#22C38E',
    greenLedge: '#16A374',
    greenSoft: '#DDF7EC',
    orange: '#F08C00',
    orangeSoft: '#FFEBD1',
    red: '#F0506E',
    redSoft: '#FFE0E6',
    grey: '#9A92C4',
    greySoft: '#EEEBF8',

    overlay: 'rgba(42,31,92,0.35)',
  },
  dark: {
    bg: '#16112E',
    surface: '#231C45',
    surfaceMuted: '#2D2556',
    ledge: '#0D0920',
    ink: '#F3EEFF',
    inkSecondary: '#A89CE0',
    inkTertiary: '#6E63A8',
    line: 'rgba(243,238,255,0.08)',

    primary: '#8F74FF',
    primaryLedge: '#5B3FE0',
    primarySoft: 'rgba(143,116,255,0.18)',
    onPrimary: '#FFFFFF',

    pink: '#FF6B9D',
    pinkLedge: '#C8386A',
    pinkSoft: 'rgba(255,107,157,0.16)',
    yellow: '#FFD43B',
    yellowLedge: '#B88F00',
    yellowSoft: 'rgba(255,212,59,0.14)',
    green: '#2BD69C',
    greenLedge: '#16A374',
    greenSoft: 'rgba(43,214,156,0.15)',
    orange: '#FFA733',
    orangeSoft: 'rgba(255,167,51,0.15)',
    red: '#FF6F88',
    redSoft: 'rgba(255,111,136,0.15)',
    grey: '#8C84B8',
    greySoft: 'rgba(243,238,255,0.07)',

    overlay: 'rgba(0,0,0,0.55)',
  },
} as const;

export type Palette = { [K in keyof typeof palette.light]: string };

export const fonts = {
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
  extrabold: 'Nunito_800ExtraBold',
  black: 'Nunito_900Black',
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
  sm: 12,
  md: 18,
  lg: 24,
  xl: 30,
  pill: 999,
} as const;

/** Height of the 3D ledge under raised surfaces. */
export const LEDGE = 5;
/** Horizontal page gutter used by every screen. */
export const GUTTER = 20;
/** Space reserved at the bottom of scroll views for the floating tab bar. */
export const TAB_BAR_SPACE = 130;
