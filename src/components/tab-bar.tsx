import Feather from '@expo/vector-icons/Feather';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { Platform, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVault } from '@/state/vault';
import { radius, useTheme } from '@/theme';

import { tap, Txt, type IconName } from './ui';

const ICONS: Record<string, IconName> = {
  index: 'home',
  vault: 'archive',
  settings: 'sliders',
};

const LABELS: Record<string, string> = {
  index: 'Home',
  vault: 'Vault',
  settings: 'Settings',
};

/** Floating glass pill with the three tabs and a raised "add" action. */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors, dark } = useTheme();
  const insets = useSafeAreaInsets();
  const { canAddItem } = useVault();

  const onAdd = () => {
    tap();
    router.push(canAddItem ? '/add' : '/paywall');
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 12) + 4 }]}>
      <View style={[styles.pill, { borderColor: colors.line, shadowColor: '#000' }]}>
        {Platform.OS === 'ios' ? (
          // Real glass on iOS; Android's blur needs a blurTarget, so it gets a solid surface instead.
          <BlurView intensity={dark ? 50 : 70} tint={dark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: Platform.OS === 'ios' ? colors.tabBar : colors.surface }]} />
        {state.routes.map((route, index) => {
          const focused = state.index === index;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
              accessibilityLabel={LABELS[route.name]}
              onPress={() => {
                tap();
                const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
                if (!focused && !event.defaultPrevented) navigateToTab(route.key);
              }}
              style={[styles.tab, focused && { backgroundColor: colors.inverse }]}>
              <Feather name={ICONS[route.name] ?? 'circle'} size={18} color={focused ? colors.onInverse : colors.inkSecondary} />
              {focused && (
                <Txt variant="label" style={{ color: colors.onInverse }}>
                  {LABELS[route.name]}
                </Txt>
              )}
            </Pressable>
          );
        })}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Add item"
        onPress={onAdd}
        style={({ pressed }) => [
          styles.add,
          { backgroundColor: colors.accent, transform: [{ scale: pressed ? 0.94 : 1 }] },
        ]}>
        <Feather name="plus" size={26} color={colors.onAccent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  pill: {
    flex: 1,
    height: 64,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    overflow: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    elevation: 12,
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
  },
  tab: {
    height: 48,
    minWidth: 48,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  add: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 12,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
  },
});
