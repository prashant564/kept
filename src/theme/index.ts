import { useColorScheme } from 'react-native';

import { palette, type Palette } from './tokens';

export * from './tokens';

export function useTheme(): { colors: Palette; dark: boolean } {
  const dark = useColorScheme() === 'dark';
  return { colors: dark ? palette.dark : palette.light, dark };
}
