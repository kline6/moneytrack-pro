import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Platform } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import Svg, { Path, Circle, Line, Text as SvgText } from 'react-native-svg';
import { analyticsApi } from '../../src/api/endpoints';
import { useAuthStore } from '../../src/store/authStore';
import { formatMoney, formatDate } from '../../src/utils/format';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../src/theme';
import AnimatedGlassCard from '../../src/components/glass/AnimatedGlassCard';
import GlassCard from '../../src/components/glass/GlassCard';
import GlassButton from '../../src/components/glass/GlassButton';
import DynamicBackground from '../../src/components/glass/DynamicBackground';

type ViewType = 'day' | 'week' | 'month';

export default function HomeScreen() {
  const [viewType, setViewType] = useState<ViewType>('month');
  const [dashboard, setDashboard] = useState<any>(null);
  const [smartInsights, setSmartInsights] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const contentOpacity = useSharedValue(1);
  const { logout } = useAuthStore();

  const headerOpacity = useSharedValue(0);
  const headerTranslateY = useSharedValue(-80);

  useEffect(() => {
    headerOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    headerTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const headerAnimatedStyle = useAnimatedStyle(() => ({
    opacity: headerOpacity.value,
    transform: [{ translateY: headerTranslateY.value }],
  }));

  const loadData = useCallback(async () => {
    try {
      if (viewType === 'month') {
        const { data } = await analyticsApi.dashboard();
        setDashboard(data.data);
        setSmartInsights(null);
      } else {
        const { data } = await analyticsApi.smartInsights(viewType);
        setSmartInsights(data.data);
        setDashboard(null);
      }
    } catch (err: any) {
      if (err?.response?.status === 401) {
        await logout();
        router.replace('/(auth)/login');
      }
    }
  }, [viewType]);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const viewLabels: Record<ViewType, string> = { day: '今日', week: '本周', month: '本月' };

  const switchView = (v: ViewType) => {
    if (v === viewType) return;
    // crossfade: 淡出 → 切数据 → 淡入
    contentOpacity.value = withTiming(0, { duration: 150 }, () => {
      // 在 worklet 中不能直接 setState，用 runOnJS
      runOnJS(setViewType)(v);
      contentOpacity.value = withTiming(1, { duration: 250 });
    });
  };

  return (
    <View style={styles.screen}>
      <DynamicBackground />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <Animated.View style={[styles.headerWrapper, headerAnimatedStyle]}>
          <LinearGradient
            colors={[...gradients.blue] as [string, string, string]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.header}
          >
            <View style={styles.headerContent}>
              <View>
                <Text style={styles.appName}>记账通</Text>
                <Text style={styles.appSubtitle}>记录每一笔，掌控每一天</Text>
              </View>
              <TouchableOpacity style={styles.notifBtn}>
                {Platform.OS === 'android' ? (
                  <View style={styles.notifBlur}>
                    <BlurView intensity={30} tint="light" style={StyleSheet.absoluteFill} />
                    <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                  </View>
                ) : (
                  <BlurView intensity={30} tint="light" style={styles.notifBlur}>
                    <Ionicons name="notifications-outline" size={22} color="#FFFFFF" />
                  </BlurView>
                )}
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Segment Control */}
        <GlassCard variant="white" style={styles.segmentCard}>
          <View style={styles.segmentInner}>
            {(['day', 'week', 'month'] as ViewType[]).map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.segmentBtn, viewType === v && styles.segmentActive]}
                onPress={() => switchView(v)}
              >
                {viewType === v ? (
                  <LinearGradient colors={[...gradients.blue] as [string, string, string]} style={styles.segmentGradient}>
                    <Text style={styles.segmentTextActive}>{viewLabels[v]}</Text>
                  </LinearGradient>
                ) : (
                  <Text style={styles.segmentText}>{viewLabels[v]}</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Month View */}
        {viewType === 'month' && dashboard && (
          <>
            <AnimatedGlassCard delay={100} variant="white" style={styles.statsCard}>
              <View style={styles.statsContent}>
                <View style={styles.statsMain}>
                  <Text style={styles.statsLabel}>本月支出</Text>
                  <Text style={styles.statsAmount}>{formatMoney(dashboard.monthly.totalExpense)}</Text>
                </View>
                <View style={styles.statsRow}>
                  <View style={styles.statsItem}>
                    <Text style={styles.statsSubLabel}>本月收入</Text>
                    <Text style={styles.statsIncome}>{formatMoney(dashboard.monthly.totalIncome)}</Text>
                  </View>
                  <View style={styles.statsItem}>
                    <Text style={styles.statsSubLabel}>今日支出</Text>
                    <Text style={styles.statsExpense}>{formatMoney(dashboard.today.expense)}</Text>
                  </View>
                </View>
              </View>
            </AnimatedGlassCard>

            <AnimatedGlassCard delay={250} variant="white" style={styles.budgetCardWrapper}>
              <TouchableOpacity activeOpacity={0.9} onPress={() => router.push('/(tabs)/budgets')}>
                <View style={styles.budgetHeader}>
                  <Text style={styles.budgetTitle}>本月预算</Text>
                  <Text style={styles.budgetPercent}>{dashboard.budget.totalPercentage}%</Text>
                </View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: Math.min(dashboard.budget.totalPercentage, 100) + '%', backgroundColor: dashboard.budget.totalPercentage > 90 ? colors.danger : dashboard.budget.totalPercentage > 70 ? colors.warning : colors.primary }]} />
                </View>
                <Text style={styles.budgetDetail}>
                  已花 {formatMoney(dashboard.budget.totalSpent)} / 预算 {formatMoney(dashboard.budget.totalBudget)}
                </Text>
              </TouchableOpacity>
            </AnimatedGlassCard>

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>最近交易</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/transactions')}>
                <Text style={styles.seeAll}>查看全部</Text>
              </TouchableOpacity>
            </View>
            {dashboard.recentTransactions.map((txn: any, index: number) => (
              <TransactionItem key={txn.id} txn={txn} delay={350 + index * 80} />
            ))}
          </>
        )}

        {/* Day / Week View */}
        {(viewType === 'day' || viewType === 'week') && smartInsights && (
          <>
            <AnimatedGlassCard delay={100} variant="white" style={styles.statsCard}>
              <View style={styles.statsContent}>
                <View style={styles.statsMain}>
                  <Text style={styles.statsLabel}>{viewType === 'day' ? '今日支出' : '本周支出'}</Text>
                  <Text style={styles.statsAmount}>{formatMoney(smartInsights.totalExpense)}</Text>
                </View>
              </View>
            </AnimatedGlassCard>

            {/* Category Breakdown */}
            {smartInsights.categoryBreakdown.length > 0 && (
              <AnimatedGlassCard delay={200} variant="white" style={styles.categoryCard}>
                <Text style={styles.cardTitle}>分类明细</Text>
                {smartInsights.categoryBreakdown.slice(0, 5).map((cat: any, i: number) => (
                  <View key={cat.categoryId} style={styles.categoryItem}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.category?.color || '#94A3B8' }]} />
                    <Text style={styles.categoryName}>{cat.category?.name || '未分类'}</Text>
                    <View style={styles.categoryBarBg}>
                      <View style={[styles.categoryBarFill, { width: cat.percentage + '%', backgroundColor: cat.category?.color || colors.primary }]} />
                    </View>
                    <Text style={styles.categoryAmount}>{formatMoney(cat.totalAmount)}</Text>
                    <Text style={styles.categoryPercent}>{cat.percentage}%</Text>
                  </View>
                ))}
              </AnimatedGlassCard>
            )}

            {/* Budget Alert */}
            {smartInsights.budgetAlert && (
              <AnimatedGlassCard delay={300} variant="white" style={styles.alertCard}>
                <View style={styles.alertRow}>
                  <Ionicons
                    name={smartInsights.budgetAlert.level === 'exceeded' ? 'warning' : 'alert-circle'}
                    size={20}
                    color={smartInsights.budgetAlert.level === 'exceeded' ? colors.danger : colors.warning}
                  />
                  <Text style={styles.alertText}>{smartInsights.budgetAlert.message}</Text>
                </View>
              </AnimatedGlassCard>
            )}

            {/* Week Comparison */}
            {smartInsights.weekComparison && (
              <AnimatedGlassCard delay={350} variant="white" style={styles.alertCard}>
                <View style={styles.alertRow}>
                  <Ionicons name="git-compare" size={20} color={colors.primary} />
                  <Text style={styles.alertText}>{smartInsights.weekComparison.message}</Text>
                </View>
              </AnimatedGlassCard>
            )}

            {/* Smart Insights */}
            {smartInsights.insights.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginHorizontal: spacing.lg, marginTop: spacing.lg }]}>洞察</Text>
                {smartInsights.insights.map((insight: string, i: number) => (
                  <AnimatedGlassCard key={'insight-' + i} delay={400 + i * 80} variant="white" style={styles.insightCard}>
                    <View style={styles.insightRow}>
                      <Ionicons name="bulb-outline" size={16} color={colors.primary} />
                      <Text style={styles.insightText}>{insight}</Text>
                    </View>
                  </AnimatedGlassCard>
                ))}
              </>
            )}
          </>
        )}

        <View style={{ height: 180 }} />
      </ScrollView>

      {/* Quick Add Button */}
      <View style={styles.addBtnWrapper}>
        <GlassButton
          title="记一笔"
          onPress={() => router.push('/(modals)/add-transaction')}
          variant="gradient"
          colors={gradients.blue}
          style={styles.addBtn}
          textStyle={styles.addBtnText}
        />
      </View>
    </View>
  );
}

function TransactionItem({ txn, delay }: { txn: any; delay: number }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedGlassCard delay={delay} variant="white" translateY={30} style={styles.txnWrapper}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
      >
        <Animated.View style={[styles.txnItem, animatedStyle]}>
          <View style={[styles.txnIcon, { backgroundColor: txn.category.color + '20' }]}>
            <Text style={{ fontSize: 20 }}>{getCategoryEmoji(txn.category.icon)}</Text>
          </View>
          <View style={styles.txnInfo}>
            <Text style={styles.txnTitle}>{txn.title}</Text>
            <Text style={styles.txnMeta}>{txn.category.name} · {formatDate(txn.occurredAt)}</Text>
          </View>
          <Text style={[styles.txnAmount, { color: txn.type === 'EXPENSE' ? colors.expense : colors.income }]}>
            {txn.type === 'EXPENSE' ? '-' : '+'}{formatMoney(txn.amount)}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </AnimatedGlassCard>
  );
}

function getCategoryEmoji(icon: string): string {
  const map: Record<string, string> = {
    food: '🍜', shopping_bag: '🛍️', directions_car: '🚗', sports_esports: '🎮',
    school: '📚', local_hospital: '🏥', house: '🏠', flight: '✈️',
    pets: '🐱', devices: '📱', checkroom: '👔', card_giftcard: '🎁',
    shield: '🛡️', trending_up: '📈', more_horiz: '⋯',
    cash: '💰', gift: '🎁', briefcase: '💼', wallet: '👛',
    receipt: '📋', heart: '❤️', trophy: '🏆', swap_horizontal: '🔄',
  };
  return map[icon] || '📌';
}


function TrendChart({ data }: { data: Array<{ date: string; amount: number }> }) {
  const width = 320;
  const height = 120;
  const padding = { top: 10, right: 10, bottom: 24, left: 10 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;
  const maxVal = Math.max(...data.map((d) => d.amount), 1);
  const stepX = data.length > 1 ? chartW / (data.length - 1) : chartW;

  const points = data.map((d, i) => ({
    x: padding.left + i * stepX,
    y: padding.top + chartH - (d.amount / maxVal) * chartH,
  }));

  const pathD = points.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`)).join(' ');

  const dayLabels = data.map((d) => {
    const dt = new Date(d.date);
    const days = ['日', '一', '二', '三', '四', '五', '六'];
    return days[dt.getDay()];
  });

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* Grid line */}
      <Line x1={padding.left} y1={padding.top + chartH} x2={padding.left + chartW} y2={padding.top + chartH} stroke="rgba(0,0,0,0.06)" strokeWidth={1} />
      {/* Line path */}
      <Path d={pathD} fill="none" stroke={colors.primary} strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" />
      {/* Dots */}
      {points.map((p, i) => (
        <Circle key={i} cx={p.x} cy={p.y} r={3.5} fill={colors.primary} />
      ))}
      {/* Day labels */}
      {points.map((p, i) => (
        <SvgText key={'l' + i} x={p.x} y={height - 4} fontSize={10} fill={colors.textMuted} textAnchor="middle">{dayLabels[i]}</SvgText>
      ))}
    </Svg>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 0 },
  loading: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background },
  loadingText: { color: colors.textSecondary, fontSize: fontSize.md },

  // Header
  headerWrapper: { overflow: 'hidden' },
  header: {
    paddingTop: 56, paddingBottom: 28, paddingHorizontal: spacing.xl,
    borderBottomLeftRadius: borderRadius.xxl, borderBottomRightRadius: borderRadius.xxl,
  },
  headerContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  appName: { fontSize: fontSize.xxxl, fontWeight: fontWeight.heavy, color: '#FFFFFF' },
  appSubtitle: { fontSize: fontSize.sm, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  notifBtn: { width: 42, height: 42, borderRadius: 21, overflow: 'hidden' },
  notifBlur: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: 21,
    borderWidth: Platform.OS === 'android' ? 0 : 1, borderColor: 'rgba(255,255,255,0.25)',
  },

  // Segment
  segmentCard: { marginHorizontal: spacing.lg, marginTop: -16 },
  segmentInner: { flexDirection: 'row', padding: 4 },
  segmentBtn: { flex: 1, borderRadius: borderRadius.md, overflow: 'hidden' },
  segmentActive: {},
  segmentGradient: { paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  segmentText: { textAlign: 'center', paddingVertical: spacing.sm, fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  segmentTextActive: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: '#FFFFFF' },

  // KPI Row
  kpiRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  kpiCard: { flex: 1, backgroundColor: colors.surfaceAlt, borderRadius: borderRadius.lg, paddingVertical: spacing.md, paddingHorizontal: spacing.sm, alignItems: 'center' },
  kpiLabel: { fontSize: fontSize.xs, color: colors.textMuted, fontWeight: fontWeight.medium, marginBottom: 2 },
  kpiValue: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.text },

  // Stats
  statsCard: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  statsContent: { padding: spacing.xl },
  statsMain: { marginBottom: spacing.lg },
  statsLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium },
  statsAmount: { fontSize: fontSize.display, fontWeight: fontWeight.heavy, color: colors.text, marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  statsItem: {},
  statsSubLabel: { fontSize: fontSize.xs, color: colors.textSecondary, fontWeight: fontWeight.medium },
  statsIncome: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#16A34A', marginTop: 2 },
  statsExpense: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: '#EF4444', marginTop: 2 },

  // Trend Chart
  trendCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg },

  // Budget
  budgetCardWrapper: { marginHorizontal: spacing.lg, marginTop: spacing.md },
  budgetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg, paddingBottom: 0 },
  budgetTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text },
  budgetPercent: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.primary },
  progressBar: { height: 10, backgroundColor: 'rgba(59, 130, 246, 0.12)', borderRadius: borderRadius.full, marginHorizontal: spacing.lg, marginTop: spacing.md, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: colors.primary, borderRadius: borderRadius.full } as any,
  budgetDetail: { fontSize: fontSize.sm, color: colors.textSecondary, padding: spacing.lg, paddingTop: spacing.sm },

  // Category Breakdown
  categoryCard: { marginHorizontal: spacing.lg, marginTop: spacing.md, padding: spacing.lg },
  cardTitle: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.text, marginBottom: spacing.md },
  categoryItem: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm },
  categoryDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  categoryName: { fontSize: fontSize.sm, color: colors.text, minWidth: 50, maxWidth: 70, marginRight: spacing.xs },
  categoryBarBg: { flex: 1, height: 6, backgroundColor: "rgba(0,0,0,0.06)", borderRadius: 3, marginHorizontal: spacing.sm, overflow: "hidden", minWidth: 40 },
  categoryBarFill: { height: '100%', borderRadius: 3 },
  categoryAmount: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium, minWidth: 65, textAlign: "right" },
  categoryPercent: { fontSize: fontSize.xs, color: colors.textMuted, width: 35, textAlign: 'right' },

  // Alert
  alertCard: { marginHorizontal: spacing.lg, marginTop: spacing.sm, padding: spacing.md },
  alertRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  alertText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },

  // Insight
  insightCard: { marginHorizontal: spacing.lg, marginTop: spacing.sm },
  insightRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, padding: spacing.md },
  insightText: { flex: 1, fontSize: fontSize.sm, color: colors.text, lineHeight: 20 },

  // Section
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginHorizontal: spacing.lg, marginTop: spacing.xl, marginBottom: spacing.sm },
  sectionTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  seeAll: { color: colors.primary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },

  // Transactions
  txnWrapper: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  txnItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  txnIcon: { width: 44, height: 44, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center', marginRight: spacing.md },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  txnMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold },

  // Add Button
  addBtnWrapper: { position: 'absolute', bottom: 100, left: spacing.xl, right: spacing.xl },
  addBtn: { borderRadius: borderRadius.xl },
  addBtnText: { fontWeight: fontWeight.semibold },
});
