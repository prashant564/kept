import { Redirect } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';

import { TabBar } from '@/components/tab-bar';
import { useVault } from '@/state/vault';

export default function TabsLayout() {
  const { settings } = useVault();
  if (!settings.onboarded) return <Redirect href="/welcome" />;

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="vault" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
