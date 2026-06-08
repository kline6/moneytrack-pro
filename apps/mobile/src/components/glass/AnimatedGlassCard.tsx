import React, { useEffect } from 'react';
import { ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import GlassCard from './GlassCard';

interface AnimatedGlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'light' | 'dark' | 'default';
  variant?: 'default' | 'white' | 'strong' | 'flat';
  borderRadius?: number;
  delay?: number;
  translateY?: number;
  useSpring?: boolean;
}

export default function AnimatedGlassCard({
  children,
  style,
  intensity,
  tint,
  variant = 'default',
  borderRadius: br,
  delay = 0,
  translateY: initialY = 40,
  useSpring = true,
}: AnimatedGlassCardProps) {
  const opacity = useSharedValue(0);
  const ty = useSharedValue(initialY);

  useEffect(() => {
    const start = () => {
      if (useSpring) {
        opacity.value = withSpring(1, { damping: 18, stiffness: 120, mass: 1 });
        ty.value = withSpring(0, { damping: 18, stiffness: 120, mass: 1 });
      } else {
        opacity.value = withTiming(1, { duration: 600 });
        ty.value = withTiming(0, { duration: 600 });
      }
    };
    if (delay > 0) {
      const timer = setTimeout(start, delay);
      return () => clearTimeout(timer);
    } else {
      start();
    }
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View style={[animatedStyle, { backgroundColor: 'transparent' }, style]}>
      <GlassCard intensity={intensity} tint={tint} variant={variant} borderRadius={br}>
        {children}
      </GlassCard>
    </Animated.View>
  );
}
