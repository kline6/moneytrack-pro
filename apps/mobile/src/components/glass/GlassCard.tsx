import React from 'react';
import { View, StyleSheet, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { borderRadius as brTokens, shadow } from '../../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  borderRadius?: number;
  variant?: 'default' | 'white' | 'strong' | 'flat';
}

export default function GlassCard({
  children,
  style,
  intensity,
  tint = 'light',
  borderRadius: br,
  variant = 'default',
}: GlassCardProps) {
  const bgMap = {
    default: 'rgba(255, 255, 255, 0.15)',
    white: 'rgba(255, 255, 255, 0.72)',
    strong: 'rgba(255, 255, 255, 0.85)',
    flat: '#FFFFFF',
  };
  const borderMap = {
    default: 'rgba(255, 255, 255, 0.3)',
    white: 'rgba(255, 255, 255, 0.5)',
    strong: 'rgba(255, 255, 255, 0.6)',
    flat: '#E4E8EF',
  };
  const blurMap = { default: 40, white: 30, strong: 50 };
  const radius = br ?? (variant === 'default' ? brTokens.xxl : brTokens.xl);
  const bg = bgMap[variant];

  if (Platform.OS === 'android') {
    return (
      <View
        style={[
          styles.cardAndroid,
          {
            borderRadius: radius,
            backgroundColor: bg,
          },
          style,
        ]}
      >
        <BlurView
          intensity={intensity ?? blurMap[variant]}
          tint={tint}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.content}>
          {children}
        </View>
      </View>
    );
  }

  return (
    <BlurView
      intensity={intensity ?? blurMap[variant]}
      tint={tint}
      style={[
        styles.card,
        {
          borderRadius: radius,
          backgroundColor: bg,
          borderColor: borderMap[variant],
        },
        shadow.md,
        style,
      ]}
    >
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderWidth: 1,
  },
  cardAndroid: {
    overflow: 'hidden',
    borderWidth: 0,
  },
  content: {
    backgroundColor: 'transparent',
  },
});
