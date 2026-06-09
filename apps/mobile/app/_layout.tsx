import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import * as Font from 'expo-font';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationListener } from '../src/hooks/useNotificationListener';
import NotificationSnackbar from '../src/components/NotificationSnackbar';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { isLoading, restoreSession, isAuthenticated } = useAuthStore();
  const { snackbarItem, dismissSnackbar } = useNotificationListener(isAuthenticated);
  const [appReady, setAppReady] = React.useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await Font.loadAsync(Ionicons.font);
      } catch (e) {
        console.warn('Font loading error:', e);
      } finally {
        setAppReady(true);
      }
    }
    prepare();
  }, []);

  useEffect(() => {
    if (appReady) {
      restoreSession();
    }
  }, [appReady]);

  useEffect(() => {
    if (appReady && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [appReady, isLoading]);

  if (!appReady || isLoading) {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(modals)" options={{ presentation: 'modal' }} />
      </Stack>
      <NotificationSnackbar
        item={snackbarItem}
        onDismiss={dismissSnackbar}
      />
    </>
  );
}