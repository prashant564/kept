import Constants from 'expo-constants';
import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { Alert, ScrollView, Switch, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CurrencySheet } from '@/components/currency-sheet';
import { Button, Clay, enter, ListRow, ProgressBar, Tag, Txt } from '@/components/ui';
import { getCurrency } from '@/lib/currencies';
import { exportInventoryPdf } from '@/lib/pdf';
import { FREE_ITEM_LIMIT, useVault } from '@/state/vault';
import { GUTTER, space, TAB_BAR_SPACE, useTheme } from '@/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, settings, updateSetting, loadDemoData, resetVault } = useVault();

  const [currencyOpen, setCurrencyOpen] = useState(false);
  const currency = getCurrency(settings.currency);

  const confirmReset = () =>
    Alert.alert('Delete everything?', 'All items, receipts and reminders will be permanently removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: resetVault },
    ]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.md, paddingBottom: TAB_BAR_SPACE + insets.bottom, paddingHorizontal: GUTTER, gap: space.xxl }}>
      <Animated.View entering={enter(0)}>
        <Txt variant="label" tone="secondary">
          Kept
        </Txt>
        <Txt variant="display">You & settings ⚙️</Txt>
      </Animated.View>

      {/* Plan */}
      <Animated.View entering={enter(1)}>
        <Clay color={settings.isPro ? colors.green : colors.primary} ledgeColor={settings.isPro ? colors.greenLedge : colors.primaryLedge} ledge={7} rounded={30} contentStyle={{ padding: space.xxl, gap: space.md }}>
          <Text style={{ position: 'absolute', right: 20, top: 16, fontSize: 52, transform: [{ rotate: '12deg' }] }}>{settings.isPro ? '👑' : '📦'}</Text>
          <View style={{ alignSelf: 'flex-start', backgroundColor: colors.yellow, borderRadius: 10, paddingHorizontal: 10, height: 26, justifyContent: 'center' }}>
            <Txt variant="label" style={{ color: '#2A1F5C' }}>
              {settings.isPro ? 'PRO' : 'FREE PLAN'}
            </Txt>
          </View>
          <Txt variant="title" tone="inverse" style={{ marginRight: 60 }}>
            {settings.isPro ? 'Everything unlocked. Thank you!' : `${items.length} of ${FREE_ITEM_LIMIT} spots used`}
          </Txt>
          {!settings.isPro && (
            <>
              <ProgressBar progress={items.length / FREE_ITEM_LIMIT} color={colors.yellow} track="rgba(255,255,255,0.22)" height={14} />
              <Button title="Unlock unlimited" emoji="🚀" kind="yellow" onPress={() => router.push('/paywall')} style={{ marginTop: space.sm }} />
            </>
          )}
        </Clay>
      </Animated.View>

      <Group title="Preferences" index={2}>
        <ListRow
          emoji="🔔"
          title="Reminders"
          subtitle="Before returns close & warranties end"
          right={
            <Switch
              value={settings.remindersEnabled}
              onValueChange={(v) => updateSetting('remindersEnabled', v)}
              trackColor={{ true: colors.green, false: colors.surfaceMuted }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <ListRow emoji={currency.flag} title="Default currency" subtitle={`${currency.name} · used for new items`} onPress={() => setCurrencyOpen(true)} right={<Tag tone="primary" label={currency.code} />} last />
      </Group>

      <Group title="Your data" index={3}>
        <ListRow
          emoji="🏠"
          title="Inventory PDF"
          subtitle="Everything you own, for insurance"
          onPress={() => (settings.isPro ? exportInventoryPdf(items, settings.currency) : router.push('/paywall'))}
          right={!settings.isPro ? <Tag tone="yellow" label="PRO" /> : undefined}
        />
        <ListRow emoji="🔒" title="Private by design" subtitle="No account. Nothing leaves your phone." last />
      </Group>

      <Group title="Testing" index={4}>
        <ListRow emoji="🧪" title="Load sample items" onPress={loadDemoData} />
        <ListRow emoji="👑" title={settings.isPro ? 'Switch to Free' : 'Pretend I’m Pro'} onPress={() => updateSetting('isPro', !settings.isPro)} />
        <ListRow emoji="👋" title="Show welcome again" onPress={() => updateSetting('onboarded', false)} />
        <ListRow emoji="🗑️" title="Delete all data" destructive onPress={confirmReset} last />
      </Group>

      <Txt variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
        Kept {Constants.expoConfig?.version ?? '1.0.0'} · made with 💜 for receipt keepers
      </Txt>

      <CurrencySheet
        visible={currencyOpen}
        value={settings.currency}
        title="Default currency"
        onSelect={(code) => {
          updateSetting('currency', code);
          setCurrencyOpen(false);
        }}
        onClose={() => setCurrencyOpen(false)}
      />
    </ScrollView>
  );
}

function Group({ title, index, children }: { title: string; index: number; children: ReactNode }) {
  return (
    <Animated.View entering={enter(index)}>
      <Txt variant="tiny" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 6 }}>
        {title}
      </Txt>
      <Clay>{children}</Clay>
    </Animated.View>
  );
}
