import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../src/store/authStore';
import { useNotificationListener } from '../src/hooks/useNotificationListener';
import NotificationSnackbar from '../src/components/NotificationSnackbar';

export default function RootLayout() {
  const { isLoading, restoreSession, isAuthenticated } = useAuthStore();
  const { snackbarItem, dismissSnackbar } = useNotificationListener(isAuthenticated);

  useEffect(() => {
    restoreSession();
  }, []);

  if (isLoading) {
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
