import Feather from '@expo/vector-icons/Feather';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { Alert, ScrollView, Switch, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Card, ListRow, Txt } from '@/components/ui';
import { CURRENCIES } from '@/lib/format';
import { exportInventoryPdf } from '@/lib/pdf';
import { FREE_ITEM_LIMIT, useVault } from '@/state/vault';
import { GUTTER, radius, space, TAB_BAR_SPACE, useTheme } from '@/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { items, settings, updateSetting, loadDemoData, resetVault } = useVault();

  const cycleCurrency = () => {
    const i = CURRENCIES.indexOf(settings.currency as (typeof CURRENCIES)[number]);
    updateSetting('currency', CURRENCIES[(i + 1) % CURRENCIES.length]);
  };

  const confirmReset = () =>
    Alert.alert('Delete everything?', 'All items, receipts and reminders will be permanently removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete all', style: 'destructive', onPress: resetVault },
    ]);

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.bg }}
      contentContainerStyle={{ paddingTop: insets.top + space.lg, paddingBottom: TAB_BAR_SPACE + insets.bottom, paddingHorizontal: GUTTER, gap: space.xxl }}>
      <View>
        <Txt variant="overline" tone="secondary">
          Kept
        </Txt>
        <Txt variant="display" style={{ marginTop: 6 }}>
          Settings
        </Txt>
      </View>

      {/* Plan */}
      <View style={{ backgroundColor: colors.inverse, borderRadius: radius.xl, padding: space.xxl, gap: space.lg }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: space.sm }}>
          <View style={{ backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 10, height: 24, justifyContent: 'center' }}>
            <Txt variant="label" style={{ color: colors.onAccent, fontSize: 12 }}>
              {settings.isPro ? 'PRO' : 'FREE'}
            </Txt>
          </View>
          <Txt variant="caption" tone="inverseMuted">
            {settings.isPro ? 'Thanks for supporting Kept' : `${items.length} of ${FREE_ITEM_LIMIT} items used`}
          </Txt>
        </View>
        <Txt variant="title" tone="inverse">
          {settings.isPro ? 'Everything unlocked.' : 'Keep everything, not just ten things.'}
        </Txt>
        {!settings.isPro && (
          <>
            <View style={{ height: 6, borderRadius: 3, backgroundColor: colors.inverseTrack, overflow: 'hidden' }}>
              <View style={{ width: `${Math.min(100, (items.length / FREE_ITEM_LIMIT) * 100)}%`, height: '100%', backgroundColor: colors.accent }} />
            </View>
            <Card
              onPress={() => router.push('/paywall')}
              style={{ backgroundColor: colors.accent, borderColor: 'transparent', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: space.sm, paddingVertical: 14 }}>
              <Feather name="zap" size={16} color={colors.onAccent} />
              <Txt variant="headline" style={{ color: colors.onAccent }}>
                Upgrade to Pro
              </Txt>
            </Card>
          </>
        )}
      </View>

      <Group title="Preferences">
        <ListRow
          icon="bell"
          title="Reminders"
          subtitle="30 & 7 days before warranties end"
          right={
            <Switch
              value={settings.remindersEnabled}
              onValueChange={(v) => updateSetting('remindersEnabled', v)}
              trackColor={{ true: colors.positive, false: colors.surfaceSunken }}
              thumbColor="#FFFFFF"
            />
          }
        />
        <ListRow icon="dollar-sign" title="Default currency" subtitle="Tap to change" onPress={cycleCurrency} right={<Txt variant="label">{settings.currency}</Txt>} last />
      </Group>

      <Group title="Your data">
        <ListRow
          icon="file-text"
          title="Export inventory PDF"
          subtitle="For insurance or moving"
          onPress={() => (settings.isPro ? exportInventoryPdf(items, settings.currency) : router.push('/paywall'))}
          right={!settings.isPro ? <ProBadge /> : undefined}
        />
        <ListRow icon="lock" title="Stored on this device" subtitle="No account. Nothing leaves your phone." last />
      </Group>

      <Group title="Developer">
        <ListRow icon="package" title="Load sample items" onPress={loadDemoData} />
        <ListRow
          icon="star"
          title={settings.isPro ? 'Switch to Free (testing)' : 'Enable Pro (testing)'}
          onPress={() => updateSetting('isPro', !settings.isPro)}
        />
        <ListRow icon="rotate-ccw" title="Show welcome again" onPress={() => updateSetting('onboarded', false)} />
        <ListRow icon="trash-2" title="Delete all data" destructive onPress={confirmReset} last />
      </Group>

      <Txt variant="caption" tone="tertiary" style={{ textAlign: 'center' }}>
        Kept {Constants.expoConfig?.version ?? '1.0.0'} · Made for people who keep receipts
      </Txt>
    </ScrollView>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View>
      <Txt variant="overline" tone="secondary" style={{ marginBottom: space.sm, marginLeft: 4 }}>
        {title}
      </Txt>
      <Card padded={false} style={{ overflow: 'hidden' }}>
        {children}
      </Card>
    </View>
  );
}

function ProBadge() {
  const { colors } = useTheme();
  return (
    <View style={{ backgroundColor: colors.accent, borderRadius: radius.pill, paddingHorizontal: 8, height: 22, justifyContent: 'center' }}>
      <Txt variant="label" style={{ color: colors.onAccent, fontSize: 11 }}>
        PRO
      </Txt>
    </View>
  );
}
