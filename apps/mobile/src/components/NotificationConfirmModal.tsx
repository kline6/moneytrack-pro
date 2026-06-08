import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform, TextInput, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { transactionsApi, categoriesApi } from '../api/endpoints';
import { formatMoney } from '../utils/format';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface NotificationConfirmModalProps {
  transaction: {
    amount: number;
    source: string;
    rawText?: string;
  } | null;
  onConfirm?: () => void;
  onDismiss?: () => void;
}

export default function NotificationConfirmModal({ transaction, onConfirm, onDismiss }: NotificationConfirmModalProps) {

  const [title, setTitle] = useState('');
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const translateY = useSharedValue(300);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    opacity.value = withTiming(1, { duration: 300 });
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesApi.list('EXPENSE');
      setCategories(data.data || []);
    } catch {}
  };

  const handleConfirm = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await transactionsApi.create({
        title: title.trim(),
        amount: Math.round(tx.amount * 100),
        type: 'EXPENSE',
        categoryId: selectedCategory || undefined,
        occurredAt: new Date().toISOString(),
      });
      onConfirm?.();
    } catch {}
    setSaving(false);
  };

  const handleIgnore = () => onDismiss?.();

  if (!transaction) return null;
  const tx = transaction;

  if (!transaction) return null;
  const sourceName = tx.source || '\u672a\u77e5';
  const sourceColor = getSourceColor(sourceName);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const blurContent = (
    <>
      <View style={styles.handle} />
      <View style={styles.header}>
        <View style={styles.sourceRow}>
          <View style={[styles.sourceBadge, { backgroundColor: sourceColor }]}>
            <Text style={styles.sourceText}>{sourceName}</Text>
          </View>
          <Text style={styles.label}>检测到支付</Text>
        </View>
        <TouchableOpacity onPress={handleIgnore} style={styles.closeBtn}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.amount}>{formatMoney(Math.round(tx.amount * 100))}</Text>

      <TextInput
        style={styles.titleInput}
        placeholder="用途"
        placeholderTextColor={colors.textMuted}
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.categoryRow}>
        {categories.slice(0, 5).map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <Text style={[styles.catText, selectedCategory === cat.id && { color: colors.white }]}>
              {cat.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.actions}>
        <TouchableOpacity style={styles.ignoreBtn} onPress={handleIgnore}>
          <Text style={styles.ignoreText}>忽略</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={saving}>
          {saving ? (
            <ActivityIndicator color={colors.white} size="small" />
          ) : (
            <Text style={styles.confirmText}>确认记录</Text>
          )}
        </TouchableOpacity>
      </View>
    </>
  );

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {Platform.OS === 'android' ? (
        <View style={styles.blur}>
          <BlurView intensity={50} tint="light" style={StyleSheet.absoluteFill} />
          {blurContent}
        </View>
      ) : (
        <BlurView intensity={50} tint="light" style={styles.blur}>
          {blurContent}
        </BlurView>
      )}
    </Animated.View>
  );
}

function getSourceColor(source: string): string {
  const map: Record<string, string> = {
    '\u5fae\u4fe1': '#07C160',
    '\u652f\u4ed8\u5b9d': '#1677FF',
    '\u94f6\u884c': '#E53935',
  };
  return map[source] || '#94A3B8';
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  blur: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.5)',
    ...shadow.xl,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0,0,0,0.1)',
    alignSelf: 'center',
    marginTop: 8,
    marginBottom: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sourceBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  sourceText: {
    color: '#FFFFFF',
    fontSize: fontSize.xs,
    fontWeight: fontWeight.semibold,
  },
  label: {
    fontSize: fontSize.sm,
    color: colors.textSecondary,
    fontWeight: fontWeight.medium,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 14,
    color: colors.textMuted,
  },
  amount: {
    fontSize: fontSize.xxxl,
    fontWeight: fontWeight.heavy,
    color: colors.text,
    marginBottom: spacing.md,
  },
  titleInput: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: fontSize.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  categoryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  catChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  catText: {
    fontSize: fontSize.sm,
    color: colors.text,
    fontWeight: fontWeight.medium,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  ignoreBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
  ignoreText: {
    color: colors.textSecondary,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
  confirmBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmText: {
    color: colors.white,
    fontSize: fontSize.md,
    fontWeight: fontWeight.semibold,
  },
});
