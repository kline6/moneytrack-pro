import React, { useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../theme';
import { transactionsApi, smartApi } from '../api/endpoints';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISMISS_DELAY = 3500;

interface SnackbarItem {
  id: string;
  transactionId: string;
  source: string;
  merchant: string;
  amount: number;
  categoryId?: string;
}

interface Props {
  item: SnackbarItem | null;
  onDismiss: () => void;
  onEditCategory?: (transactionId: string) => void;
}

export default function NotificationSnackbar({ item, onDismiss, onEditCategory }: Props) {
  const translateY = useRef(new Animated.Value(100)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const animateOut = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, { toValue: 100, duration: 300, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start(() => onDismiss());
  }, [onDismiss, translateY, opacity]);

  useEffect(() => {
    if (item) {
      translateY.setValue(100);
      opacity.setValue(0);
      Animated.parallel([
        Animated.spring(translateY, { toValue: 0, damping: 15, stiffness: 150, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();

      timerRef.current = setTimeout(animateOut, DISMISS_DELAY);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [item]);

  const handleUndo = async () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (item?.transactionId) {
      try { await transactionsApi.delete(item.transactionId); } catch {}
    }
    animateOut();
  };

  const handleChangeCategory = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (item) onEditCategory?.(item.transactionId);
    animateOut();
  };

  if (!item) return null;

  const sourceLabel = item.source === 'wechat' ? '微信' : item.source === 'alipay' ? '支付宝' : item.source;

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY }], opacity }]}>
      <View style={styles.content}>
        <View style={styles.info}>
          <Ionicons name="checkmark-circle" size={18} color={colors.success} />
          <Text style={styles.text} numberOfLines={1}>
            已自动记账：{sourceLabel}-{item.merchant} {(item.amount / 100).toFixed(2)}元
          </Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity onPress={handleChangeCategory} style={styles.actionBtn}>
            <Text style={styles.actionText}>改分类</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleUndo} style={styles.actionBtn}>
            <Text style={[styles.actionText, { color: colors.danger }]}>撤销</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    zIndex: 9999,
    ...shadow.lg,
  },
  content: {
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  info: { flexDirection: 'row', alignItems: 'center', flex: 1, marginRight: spacing.sm },
  text: { color: '#FFFFFF', fontSize: fontSize.sm, fontWeight: fontWeight.medium, marginLeft: spacing.xs, flex: 1 },
  actions: { flexDirection: 'row', gap: spacing.xs },
  actionBtn: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  actionText: { color: colors.primaryLight, fontSize: fontSize.xs, fontWeight: fontWeight.semibold },
});