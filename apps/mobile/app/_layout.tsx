import React, { useEffect, useState } from 'react';
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
  const [fontsLoaded, setFontsLoaded] = useState(false);

  useEffect(() => {
    Font.loadAsync(Ionicons.font).then(() => setFontsLoaded(true)).catch(() => setFontsLoaded(true));
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      restoreSession();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    if (fontsLoaded && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, isLoading]);

  if (!fontsLoaded || isLoading) {
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