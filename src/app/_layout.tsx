import { Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black } from '@expo-google-fonts/nunito';
import { useFonts } from 'expo-font';
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SQLiteProvider } from 'expo-sqlite';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { migrateDbIfNeeded } from '@/db/schema';
import { useVault, VaultProvider } from '@/state/vault';
import { useTheme } from '@/theme';

SplashScreen.preventAutoHideAsync();

function RootStack() {
  const { ready } = useVault();
  const { colors, dark } = useTheme();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const navTheme = dark ? DarkTheme : DefaultTheme;
  return (
    <ThemeProvider value={{ ...navTheme, colors: { ...navTheme.colors, background: colors.bg, card: colors.bg } }}>
      <StatusBar style={dark ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="welcome" options={{ animation: 'fade' }} />
        <Stack.Screen name="item/[id]" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ Nunito_600SemiBold, Nunito_700Bold, Nunito_800ExtraBold, Nunito_900Black });

  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SQLiteProvider databaseName="kept.db" onInit={migrateDbIfNeeded}>
        <VaultProvider>
          <RootStack />
        </VaultProvider>
      </SQLiteProvider>
    </GestureHandlerRootView>
  );
}
