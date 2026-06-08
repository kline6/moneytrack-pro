import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Alert, Modal, Platform } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { budgetsApi, categoriesApi } from '../../src/api/endpoints';
import { formatMoney } from '../../src/utils/format';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../src/theme';
import AnimatedGlassCard from '../../src/components/glass/AnimatedGlassCard';
import GlassCard from '../../src/components/glass/GlassCard';
import GlassButton from '../../src/components/glass/GlassButton';
import DynamicBackground from '../../src/components/glass/DynamicBackground';
import { BlurView } from 'expo-blur';

export default function BudgetsScreen() {
  const [summary, setSummary] = useState<any>(null);
  const [annual, setAnnual] = useState<any>(null);
  const [tab, setTab] = useState<'monthly' | 'annual'>('monthly');
  const [showModal, setShowModal] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [editingBudget, setEditingBudget] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const now = new Date();

  const loadMonthly = useCallback(async () => {
    try { const { data } = await budgetsApi.summary({ year: now.getFullYear(), month: now.getMonth() + 1 }); setSummary(data.data); } catch {}
  }, []);
  const loadAnnual = async () => { try { const { data } = await budgetsApi.annual({ year: now.getFullYear() }); setAnnual(data.data); } catch {} };
  const loadCategories = async () => { try { const { data } = await categoriesApi.list('EXPENSE'); setCategories(data.data || []); } catch {} };

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadMonthly(), loadCategories()]);
    if (tab === 'annual') await loadAnnual();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadMonthly(); loadCategories(); }, [loadMonthly]));

  const openCreate = () => {
    setEditingBudget(null);
    setSelectedCategory('');
    setBudgetAmount('');
    setShowModal(true);
  };

  const openEdit = (b: any) => {
    setEditingBudget(b);
    setSelectedCategory(b.categoryId || '');
    setBudgetAmount(b.amount ? (b.amount / 100).toString() : '');
    setShowModal(true);
  };

  const handleSave = async () => {
    const amountNum = parseFloat(budgetAmount);
    if (!amountNum || amountNum <= 0) { Alert.alert('提示', '请输入有效金额'); return; }
    try {
      const payload = {
        year: now.getFullYear(),
        month: now.getMonth() + 1,
        periodType: 'MONTHLY' as const,
        amount: Math.round(amountNum * 100),
        categoryId: selectedCategory || undefined,
      };
      if (editingBudget) {
        await budgetsApi.update(editingBudget.id, payload);
      } else {
        await budgetsApi.create(payload);
      }
      setShowModal(false);
      loadMonthly();
    } catch (err: any) {
      Alert.alert('失败', err.response?.data?.error?.message || '请稍后重试');
    }
  };

  const handleDelete = (b: any) => {
    Alert.alert('确认', '确定删除这个预算吗?', [
      { text: '取消', style: 'cancel' },
      { text: '删除', style: 'destructive', onPress: async () => { try { await budgetsApi.delete(b.id); loadMonthly(); } catch {} } },
    ]);
  };
  if (!summary) return <View style={styles.loading}><Text style={styles.loadingText}>加载中...</Text></View>;

  const overall = summary.overall;
  const categoryBudgets = summary.categoryBudgets || [];

  return (
    <View style={styles.screen}>
      <DynamicBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={styles.headerTitle}>预算</Text>
        </View>

        {/* Tab Switcher */}
        <GlassCard variant="white" style={styles.tabRow}>
          <View style={styles.tabInner}>
            <TouchableOpacity style={[styles.tabBtn]} onPress={() => setTab('monthly')}>
              {tab === 'monthly' ? (
                <LinearGradient colors={[...gradients.blue] as [string, string, string]} style={styles.tabGradient}>
                  <Text style={styles.tabTextActive}>月度</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>月度</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabBtn]} onPress={() => { setTab('annual'); loadAnnual(); }}>
              {tab === 'annual' ? (
                <LinearGradient colors={[...gradients.blue] as [string, string, string]} style={styles.tabGradient}>
                  <Text style={styles.tabTextActive}>年度</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>年度</Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {tab === 'monthly' ? (
          <>
            {overall && (
              <AnimatedGlassCard delay={100} variant="white" style={styles.totalCardWrapper}>
                <TouchableOpacity
                  activeOpacity={0.9}
                  onPress={() => openEdit({ id: overall.id, categoryId: null, amount: overall.amount })}
                  onLongPress={() => handleDelete({ id: overall.id })}
                >
                  <View style={styles.totalContent}>
                    <Text style={styles.totalLabel}>月度总预算</Text>
                    <Text style={styles.totalBudget}>{formatMoney(overall.amount)}</Text>
                    <ProgressBar percentage={overall.percentage} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalDetail}>已花：{formatMoney(overall.spent)}</Text>
                      <Text style={styles.totalDetail}>剩余：{formatMoney(overall.remaining)}</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              </AnimatedGlassCard>
            )}

            <Text style={styles.sectionTitle}>预算</Text>
            {categoryBudgets.length === 0 ? (
              <AnimatedGlassCard delay={200} variant="white" style={styles.emptyCard}>
                <Text style={styles.empty}>暂无分类预算</Text>
              </AnimatedGlassCard>
            ) : (
              categoryBudgets.map((b: any, index: number) => (
                <AnimatedGlassCard key={b.id || index} delay={200 + index * 80} variant="white" style={styles.budgetCardWrapper}>
                  <TouchableOpacity
                    activeOpacity={0.9}
                    onPress={() => openEdit(b)}
                    onLongPress={() => handleDelete(b)}
                  >
                    <View style={styles.budgetContent}>
                      <View style={styles.budgetHeader}>
                        <Text style={styles.budgetName}>{b.categoryName || '未分类'}</Text>
                        <Text style={styles.budgetPercent}>{b.percentage}%</Text>
                      </View>
                      <ProgressBar percentage={b.percentage} />
                      <Text style={styles.budgetDetail}>已花 {formatMoney(b.spent)} / 预算 {formatMoney(b.amount)}</Text>
                    </View>
                  </TouchableOpacity>
                </AnimatedGlassCard>
              ))
            )}
          </>
        ) : (
          <>
            {annual ? (
              <>
                <AnimatedGlassCard delay={100} variant="white" style={styles.totalCardWrapper}>
                  <View style={styles.totalContent}>
                    <Text style={styles.totalLabel}>年度总预算</Text>
                    <Text style={styles.totalBudget}>{formatMoney(annual.annualBudget)}</Text>
                    <ProgressBar percentage={annual.annualPercentage || 0} />
                    <View style={styles.totalRow}>
                      <Text style={styles.totalDetail}>已花：{formatMoney(annual.annualSpent)}</Text>
                      <Text style={styles.totalDetail}>剩余：{formatMoney(annual.annualRemaining)}</Text>
                    </View>
                  </View>
                </AnimatedGlassCard>

                <Text style={styles.sectionTitle}>月度明细</Text>
                {(annual.months || []).map((m: any, index: number) => (
                  <AnimatedGlassCard key={m.month} delay={200 + index * 60} variant="white" style={styles.budgetCardWrapper}>
                    <View style={styles.budgetContent}>
                      <View style={styles.budgetHeader}>
                        <Text style={styles.budgetName}>{m.month}月</Text>
                        <Text style={styles.budgetPercent}>{m.percentage || 0}%</Text>
                      </View>
                      <ProgressBar percentage={m.percentage || 0} />
                      <Text style={styles.budgetDetail}>已花 {formatMoney(m.totalSpent)} / 预算 {formatMoney(m.totalBudget)}</Text>
                    </View>
                  </AnimatedGlassCard>
                ))}
              </>
            ) : (
              <AnimatedGlassCard delay={100} variant="white" style={styles.emptyCard}>
                <Text style={styles.empty}>加载中...</Text>
              </AnimatedGlassCard>
            )}
          </>
        )}

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Add Budget Button */}
      <View style={styles.addBtnWrapper}>
        <GlassButton
          title="添加预算"
          onPress={openCreate}
          variant="gradient"
          colors={gradients.blue}
          style={styles.addBtn}
        />
      </View>

      {/* Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <BlurView intensity={40} tint="light" style={styles.modalBlur}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{editingBudget ? '编辑预算' : '添加预算'}</Text>
              <Text style={styles.modalLabel}>选择分类（可选，留空为总预算）</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                <TouchableOpacity
                  style={[styles.catChip, !selectedCategory && styles.catChipActive]}
                  onPress={() => setSelectedCategory('')}
                >
                  <Text style={[styles.catChipText, !selectedCategory && { color: colors.white }]}>总预算</Text>
                </TouchableOpacity>
                {categories.map((cat: any) => (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
                    onPress={() => setSelectedCategory(cat.id)}
                  >
                    <Text style={[styles.catChipText, selectedCategory === cat.id && { color: colors.white }]}>{cat.name}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Text style={styles.modalLabel}>预算金额（元）</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="0.00"
                placeholderTextColor={colors.textMuted}
                value={budgetAmount}
                onChangeText={setBudgetAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
              <View style={styles.modalBtns}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowModal(false)}>
                  <Text style={styles.cancelBtnText}>取消</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveBtnText}>保存</Text>
                </TouchableOpacity>
              </View>
            </View>
          </BlurView>
        </View>
      </Modal>
    </View>
  );
}

function ProgressBar({ percentage }: { percentage: number }) {
  const progress = useSharedValue(0);
  const isOver = percentage > 100;

  React.useEffect(() => {
    progress.value = withTiming(Math.min(percentage, 100), { duration: 1500 });
  }, [percentage]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: (progress.value + '%') as any,
  }));

  return (
    <View style={styles.progressBar}>
      <Animated.View style={[styles.progressFill, isOver && styles.progressOver, animatedStyle]} />
    </View>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 0 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.md },

  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headerTitle: { fontSize: fontSize.xxxl, fontWeight: fontWeight.heavy, color: colors.text },

  // Tab
  tabRow: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  tabInner: { flexDirection: 'row', padding: 4 },
  tabBtn: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  tabGradient: { paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  tabText: { textAlign: 'center', paddingVertical: spacing.sm, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  tabTextActive: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: '#FFFFFF' },

  // Total Card
  totalCardWrapper: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  totalContent: { padding: spacing.xl },
  totalLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  totalBudget: { color: colors.text, fontSize: fontSize.display, fontWeight: fontWeight.heavy, marginVertical: spacing.xs },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.sm },
  totalDetail: { color: colors.textSecondary, fontSize: fontSize.sm },

  // Progress Bar
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderRadius: borderRadius.full,
    overflow: 'hidden',
    marginVertical: spacing.sm,
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: borderRadius.full,
  },
  progressOver: { backgroundColor: '#EF4444' },

  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginHorizontal: spacing.lg, marginBottom: spacing.md, marginTop: spacing.sm },

  // Budget Cards
  budgetCardWrapper: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  budgetContent: { padding: spacing.lg },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  budgetName: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  budgetPercent: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  budgetDetail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: spacing.xs },

  emptyCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  empty: { textAlign: 'center', color: colors.textMuted, padding: spacing.xl, fontSize: fontSize.md },

  // Add Button
  addBtnWrapper: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
  },
  addBtn: { borderRadius: borderRadius.xl },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  modalBlur: { flex: 1, justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: 'rgba(255, 255, 255, 0.92)',
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
    padding: spacing.xl,
    maxHeight: '80%',
    borderWidth: Platform.OS === 'android' ? 0 : 1,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  modalTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.lg, textAlign: 'center' },
  modalLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginBottom: spacing.sm, marginTop: spacing.md },
  catScroll: { marginBottom: spacing.md },
  catChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: spacing.sm,
  },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catChipText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  modalInput: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.xl,
    fontWeight: fontWeight.bold,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.xl,
  },
  modalBtns: { flexDirection: 'row', gap: spacing.md },
  cancelBtn: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: 'rgba(255,255,255,0.6)' },
  cancelBtnText: { color: colors.textSecondary, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  saveBtn: { flex: 1, padding: spacing.lg, borderRadius: borderRadius.md, backgroundColor: colors.primary, alignItems: 'center' },
  saveBtnText: { color: colors.white, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
