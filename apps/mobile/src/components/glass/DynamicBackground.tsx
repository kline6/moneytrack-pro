import React from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const orbs = [
  { x: SCREEN_WIDTH * 0.65, y: SCREEN_HEIGHT * 0.08, size: 180, color: 'rgba(59, 130, 246, 0.12)' },
  { x: SCREEN_WIDTH * -0.1, y: SCREEN_HEIGHT * 0.35, size: 220, color: 'rgba(147, 197, 253, 0.1)' },
  { x: SCREEN_WIDTH * 0.55, y: SCREEN_HEIGHT * 0.7, size: 160, color: 'rgba(255, 255, 255, 0.15)' },
];

export default function DynamicBackground() {
  return (
    <View style={styles.container} pointerEvents="none">
      {orbs.map((orb, i) => (
        <View
          key={i}
          style={[
            styles.orb,
            {
              left: orb.x,
              top: orb.y,
              width: orb.size,
              height: orb.size,
              borderRadius: orb.size / 2,
              backgroundColor: orb.color,
            },
          ]}
        >
          {Platform.OS === 'android' ? (
            <View style={[StyleSheet.absoluteFill, { borderRadius: orb.size / 2, overflow: 'hidden' }]}>
              <BlurView intensity={60} tint="light" style={StyleSheet.absoluteFill} />
            </View>
          ) : (
            <BlurView intensity={60} tint="light" style={styles.orbBlur} />
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
  },
  orb: {
    position: 'absolute',
    overflow: 'hidden',
  },
  orbBlur: {
    ...StyleSheet.absoluteFillObject,
  },
});
