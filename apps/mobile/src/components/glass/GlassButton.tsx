import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle, TextStyle, View, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { borderRadius, fontSize, fontWeight, gradients } from '../../theme';

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface GlassButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
  variant?: 'gradient' | 'glass' | 'outline';
  colors?: readonly string[];
  disabled?: boolean;
}

export default function GlassButton({
  title,
  onPress,
  style,
  textStyle,
  variant = 'gradient',
  colors: customColors,
  disabled = false,
}: GlassButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.96, { damping: 25, stiffness: 400, mass: 0.8 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 20, stiffness: 300, mass: 0.8 });
  };

  if (variant === 'gradient') {
    const gradColors = customColors ?? gradients.blue;
    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[animatedStyle, style]}
      >
        <LinearGradient
          colors={[...gradColors] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: borderRadius.xl }]}
        >
          <Text style={[styles.text, textStyle]}>{title}</Text>
        </LinearGradient>
      </AnimatedTouchable>
    );
  }

  if (variant === 'glass') {
    const glassContent = (
      <LinearGradient
        colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.05)']}
        style={[styles.gradient, { borderRadius: borderRadius.xl }]}
      >
        <Text style={[styles.text, { color: '#FFFFFF' }, textStyle]}>{title}</Text>
      </LinearGradient>
    );

    return (
      <AnimatedTouchable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={0.8}
        style={[animatedStyle, { borderRadius: borderRadius.xl, overflow: 'hidden' }, style]}
      >
        {Platform.OS === 'android' ? (
          <View style={{ borderRadius: borderRadius.xl, overflow: 'hidden' }}>
            <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
            {glassContent}
          </View>
        ) : (
          <BlurView intensity={30} tint="light" style={{ borderRadius: borderRadius.xl }}>
            {glassContent}
          </BlurView>
        )}
      </AnimatedTouchable>
    );
  }

  // outline
  return (
    <AnimatedTouchable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      activeOpacity={0.8}
      style={[styles.outline, animatedStyle, style]}
    >
      <Text style={[styles.text, { color: '#2F6AE6' }, textStyle]}>{title}</Text>
    </AnimatedTouchable>
  );
}

const styles = StyleSheet.create({
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: fontSize.lg,
    fontWeight: fontWeight.semibold,
  },
  outline: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: borderRadius.xl,
    borderWidth: 1.5,
    borderColor: '#2F6AE6',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(47, 106, 230, 0.05)',
  },
});
