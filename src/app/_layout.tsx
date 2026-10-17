import { InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold, useFonts } from '@expo-google-fonts/instrument-sans';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { colors, fonts } from '@/constants/theme';
import { AuthProvider, useAuth } from '@/providers/auth';
import { ChildrenProvider } from '@/providers/children';

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: (count, error) => count < 2 && ![401, 403, 404].includes((error as { status?: number }).status ?? 0),
    },
  },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ InstrumentSans_400Regular, InstrumentSans_500Medium, InstrumentSans_600SemiBold, InstrumentSans_700Bold });

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ChildrenProvider>
          <StatusBar style="dark" />
          {fontsLoaded && <RootNavigator />}
        </ChildrenProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Connecté → onglets ; sinon → écran de connexion par code. */
function RootNavigator() {
  const { ready, user } = useAuth();

  useEffect(() => {
    if (ready) SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  return (
    <Stack
      screenOptions={{
        headerTintColor: colors.brand600,
        headerTitleStyle: { fontFamily: fonts.semibold, color: colors.ink },
        headerStyle: { backgroundColor: colors.ground },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.ground },
      }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bulletin/[termId]" options={{ title: 'Bulletin' }} />
        <Stack.Screen name="payer/[id]" options={{ title: 'Payer', presentation: 'modal' }} />
        <Stack.Screen name="justifier/[id]" options={{ title: 'Justifier une absence', presentation: 'modal' }} />
        <Stack.Screen name="devoirs" options={{ title: 'Devoirs' }} />
        <Stack.Screen name="emploi-du-temps" options={{ title: 'Emploi du temps' }} />
        <Stack.Screen name="annonces" options={{ title: 'Annonces' }} />
        <Stack.Screen name="documents" options={{ title: 'Documents' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen name="profil" options={{ title: 'Mon profil' }} />
      </Stack.Protected>
    </Stack>
  );
}
