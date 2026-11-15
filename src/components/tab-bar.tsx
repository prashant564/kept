import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useVault } from '@/state/vault';
import { fonts, useTheme } from '@/theme';

import { Clay, EASE, tap, type IconName } from './ui';

const TABS: Record<string, { icon: IconName; label: string }> = {
  index: { icon: 'home', label: 'Home' },
  vault: { icon: 'package', label: 'Vault' },
  timeline: { icon: 'calendar', label: 'Upcoming' },
  settings: { icon: 'smile', label: 'You' },
};

function TabButton({ name, focused, onPress }: { name: string; focused: boolean; onPress: () => void }) {
  const { colors } = useTheme();
  const lift = useSharedValue(focused ? 1 : 0);
  useEffect(() => {
    lift.value = withTiming(focused ? 1 : 0, { duration: 200, easing: EASE });
  }, [focused, lift]);
  const icon = useAnimatedStyle(() => ({ transform: [{ translateY: -lift.value * 2 }] }));
  const dot = useAnimatedStyle(() => ({ opacity: lift.value, transform: [{ scale: lift.value }] }));
  const tab = TABS[name] ?? { icon: 'circle', label: name };

  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected: focused }} accessibilityLabel={tab.label} onPress={onPress} style={styles.tab} hitSlop={4}>
      <Animated.View style={icon}>
        <Feather name={tab.icon} size={23} color={focused ? colors.primary : colors.inkTertiary} />
      </Animated.View>
      <Text style={[styles.label, { color: focused ? colors.primary : colors.inkTertiary }]}>{tab.label}</Text>
      <Animated.View style={[styles.dot, { backgroundColor: colors.primary }, dot]} />
    </Pressable>
  );
}

/** Chunky floating bar with a raised "add" button in the middle. */
export function TabBar({ state, emitter, navigateToTab }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { canAddItem } = useVault();

  const press = useSharedValue(1);
  const addStyle = useAnimatedStyle(() => ({ transform: [{ rotate: '-4deg' }, { scale: press.value }] }));

  const onAdd = () => {
    tap();
    press.set(withSequence(withTiming(0.94, { duration: 70 }), withTiming(1, { duration: 160, easing: EASE })));
    router.push(canAddItem ? '/add' : '/paywall');
  };

  const routes = state.routes;
  const left = routes.slice(0, 2);
  const right = routes.slice(2);

  const renderTab = (route: (typeof routes)[number]) => {
    const index = routes.indexOf(route);
    const focused = state.index === index;
    return (
      <TabButton
        key={route.key}
        name={route.name}
        focused={focused}
        onPress={() => {
          tap();
          const event = emitter.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigateToTab(route.key);
        }}
      />
    );
  };

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom, 10) + 6 }]}>
      <Clay ledge={6} rounded={28} contentStyle={styles.bar}>
        {left.map(renderTab)}
        <View style={{ width: 72 }} />
        {right.map(renderTab)}
      </Clay>
      <Animated.View style={[styles.addWrap, addStyle]}>
        <Clay color={colors.pink} ledgeColor={colors.pinkLedge} ledge={6} rounded={22} onPress={onAdd} accessibilityLabel="Add item" contentStyle={styles.add}>
          <Feather name="plus" size={30} color="#FFFFFF" />
        </Clay>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 16, right: 16 },
  bar: { height: 70, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6 },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center', height: 70, gap: 2 },
  label: { fontFamily: fonts.extrabold, fontSize: 11 },
  dot: { position: 'absolute', bottom: 6, width: 5, height: 5, borderRadius: 3 },
  addWrap: { position: 'absolute', left: '50%', marginLeft: -32, top: -22 },
  add: { width: 64, height: 64, alignItems: 'center', justifyContent: 'center' },
});
