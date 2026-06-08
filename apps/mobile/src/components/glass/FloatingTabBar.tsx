import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { borderRadius, fontWeight, gradients } from '../../theme';

const TAB_BAR_HEIGHT = 72;
const BOTTOM_MARGIN = 16;
const HORIZONTAL_MARGIN = 16;
const ICON_SIZE = 22;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItem {
  key: string;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconFocused: keyof typeof Ionicons.glyphMap;
}

const tabs: TabItem[] = [
  { key: 'index', title: '\u9996\u9875', icon: 'home-outline', iconFocused: 'home' },
  { key: 'transactions', title: '\u8bb0\u8d26', icon: 'wallet-outline', iconFocused: 'wallet' },
  { key: 'analytics', title: '\u7edf\u8ba1', icon: 'bar-chart-outline', iconFocused: 'bar-chart' },
  { key: 'budgets', title: '\u9884\u7b97', icon: 'pie-chart-outline', iconFocused: 'pie-chart' },
  { key: 'settings', title: '\u8bbe\u7f6e', icon: 'settings-outline', iconFocused: 'settings' },
];

interface FloatingTabBarProps {
  activeTab: string;
  onTabPress: (key: string) => void;
}

export default function FloatingTabBar({ activeTab, onTabPress }: FloatingTabBarProps) {
  const barWidth = SCREEN_WIDTH - HORIZONTAL_MARGIN * 2;
  const tabWidth = barWidth / tabs.length;

  const content = (
    <View style={styles.inner}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.key;
        return (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, { width: tabWidth }]}
            onPress={() => onTabPress(tab.key)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBgInactive, isActive && styles.iconBgActive]}>
              <Ionicons name={isActive ? tab.iconFocused : tab.icon} size={ICON_SIZE} color={isActive ? '#2F6AE6' : '#9BA3B5'} />
            </View>
            {isActive && <View style={styles.activeIndicator} />}
            <Text style={[styles.label, isActive && styles.labelActive]} numberOfLines={1}>
              {tab.title}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );

  if (Platform.OS === 'android') {
    return (
      <View style={[styles.container, { width: barWidth }]}>
        <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
        {content}
      </View>
    );
  }

  return (
    <BlurView intensity={50} tint="light" style={[styles.container, { width: barWidth }]}>
      {content}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: BOTTOM_MARGIN,
    alignSelf: 'center',
    height: TAB_BAR_HEIGHT,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
  },
  inner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconBgActive: {
    backgroundColor: 'rgba(47, 106, 230, 0.08)',
  },
  activeIndicator: {
    width: 16,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#2F6AE6',
    marginTop: 2,
    marginBottom: -1,
  },
  iconBgInactive: {
    width: 36,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    marginBottom: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: fontWeight.medium as any,
    color: '#94A3B8',
  },
  labelActive: {
    color: '#2F6AE6',
    fontWeight: fontWeight.semibold as any,
  },
});
