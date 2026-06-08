import React from 'react';
import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';

const TAB_ICONS: Record<string, { active: keyof typeof Ionicons.glyphMap; inactive: keyof typeof Ionicons.glyphMap; label: string }> = {
  index: { active: 'home', inactive: 'home-outline', label: '\u9996\u9875' },
  transactions: { active: 'wallet', inactive: 'wallet-outline', label: '\u8bb0\u8d26' },
  analytics: { active: 'bar-chart', inactive: 'bar-chart-outline', label: '\u7edf\u8ba1' },
  budgets: { active: 'pie-chart', inactive: 'pie-chart-outline', label: '\u9884\u7b97' },
  settings: { active: 'settings', inactive: 'settings-outline', label: '\u8bbe\u7f6e' },
};

export default function TabsLayout() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused, color, size }) => {
          const icon = TAB_ICONS[route.name] || TAB_ICONS.index;
          return <Ionicons name={focused ? icon.active : icon.inactive} size={size} color={color} />;
        },
        tabBarLabel: ({ focused, color }) => {
          const icon = TAB_ICONS[route.name] || TAB_ICONS.index;
          return (
            <Text style={{ fontSize: 11, color, fontWeight: focused ? '600' : '400' }}>
              {icon.label}
            </Text>
          );
        },
        tabBarActiveTintColor: '#3B82F6',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          position: 'absolute',
          bottom: 16,
          left: 16,
          right: 16,
          height: 64,
          borderRadius: 28,
          backgroundColor: 'rgba(255, 255, 255, 0.85)',
          borderTopWidth: 0,
          elevation: 0,
          shadowOpacity: 0,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarItemStyle: {
          paddingVertical: 2,
        },
      })}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="transactions" />
      <Tabs.Screen name="analytics" />
      <Tabs.Screen name="budgets" />
      <Tabs.Screen name="settings" />
    </Tabs>
  );
}
