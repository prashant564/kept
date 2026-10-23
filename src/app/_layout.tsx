import { InstrumentSerif_400Regular, InstrumentSerif_400Regular_Italic } from '@expo-google-fonts/instrument-serif';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
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
        <Stack.Screen name="item/[id]" />
        <Stack.Screen name="add" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        <Stack.Screen name="paywall" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    InstrumentSerif_400Regular,
    InstrumentSerif_400Regular_Italic,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

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
