import { Platform } from 'react-native';

export const colors = {
  primary: '#2F6AE6',
  primaryDark: '#1E4FD0',
  primaryLight: '#5B8DEF',
  secondary: '#10B981',
  danger: '#E04848',
  warning: '#F59E0B',
  success: '#10B981',
  background: '#F7F8FB',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F4F9',
  text: '#0C1222',
  textSecondary: '#5A6478',
  textMuted: '#9BA3B5',
  textFaint: '#C8CDD8',
  border: '#E4E8EF',
  borderLight: '#EFF1F5',
  expense: '#E04848',
  income: '#1DAE6B',
  white: '#FFFFFF',
  kpiBg: '#EDF2FF',
  warningGradientStart: '#F59E0B',
  warningGradientEnd: '#EF4444',
};

export const gradients = {
  blue: ['#1E4FD0', '#2F6AE6', '#5B8DEF'] as const,
  blueDark: ['#162F80', '#1E4FD0', '#2F6AE6'] as const,
  income: ['#059669', '#10B981', '#34D399'] as const,
};

export const glass = {
  bg: 'rgba(255, 255, 255, 0.15)',
  bgLight: 'rgba(255, 255, 255, 0.08)',
  border: 'rgba(255, 255, 255, 0.3)',
  borderLight: 'rgba(255, 255, 255, 0.18)',
  blur: 40,
  tint: 'light' as const,
};

export const glassWhite = {
  bg: 'rgba(255, 255, 255, 0.72)',
  bgStrong: 'rgba(255, 255, 255, 0.85)',
  border: 'rgba(255, 255, 255, 0.5)',
  blur: 30,
  tint: 'light' as const,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  huge: 48,
};

export const fontSize = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  display: 40,
  hero: 48,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  heavy: '800' as const,
};

export const borderRadius = {
  sm: 6,
  md: 10,
  lg: 14,
  xl: 20,
  xxl: 32,
  full: 999,
};

export const shadow = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 6,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

// 按场景分档的动画参数
export const animation = {
  // 卡片出现：偏柔和
  cardAppear: { damping: 18, stiffness: 120, mass: 1 },
  // 按钮按下：偏紧凑短促
  buttonPress: { damping: 25, stiffness: 350, mass: 0.8 },
  // 数据更新：偏平滑稳定
  dataUpdate: { damping: 20, stiffness: 180, mass: 1 },
  // 交叉淡入时长
  crossfade: { duration: 300 },
};

export const timingConfig = {
  duration: 600,
};
