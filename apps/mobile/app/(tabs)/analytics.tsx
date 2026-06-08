import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, RefreshControl, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { analyticsApi, aiApi } from '../../src/api/endpoints';
import { formatMoney } from '../../src/utils/format';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../src/theme';
import AnimatedGlassCard from '../../src/components/glass/AnimatedGlassCard';
import GlassCard from '../../src/components/glass/GlassCard';
import DynamicBackground from '../../src/components/glass/DynamicBackground';
import { LinearGradient } from 'expo-linear-gradient';

export default function AnalyticsScreen() {
  const [report, setReport] = useState<any>(null);
  const [trend, setTrend] = useState<any[]>([]);
  const [aiReport, setAiReport] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [tab, setTab] = useState<'overview' | 'ai'>('overview');
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    const now = new Date();
    try {
      const [m, t] = await Promise.all([
        analyticsApi.monthly({ year: now.getFullYear(), month: now.getMonth() + 1 }),
        analyticsApi.trend({ year: now.getFullYear(), months: 6 }),
      ]);
      setReport(m.data.data);
      setTrend(t.data.data || []);
    } catch {}
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const loadAi = async () => {
    setAiLoading(true);
    try {
      const now = new Date();
      const { data } = await aiApi.report({ year: now.getFullYear(), month: now.getMonth() + 1 });
      setAiReport(data.data);
    } catch (err: any) {
      Alert.alert('错误', err.response?.data?.error?.message || '请稍后重试');
    } finally {
      setAiLoading(false);
    }
  };

  if (!report) return <View style={styles.loading}><Text style={styles.loadingText}>加载中...</Text></View>;

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
          <Text style={styles.headerTitle}>统计</Text>
        </View>

        {/* Tab Switcher - Glass style */}
        <GlassCard variant="white" style={styles.tabRow}>
          <View style={styles.tabInner}>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'overview' && styles.tabActive]}
              onPress={() => setTab('overview')}
            >
              {tab === 'overview' ? (
                <LinearGradient colors={[...gradients.blue] as [string, string, string]} style={styles.tabGradient}>
                  <Text style={styles.tabTextActive}>总览</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>总览</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tabBtn, tab === 'ai' && styles.tabActive]}
              onPress={() => { setTab('ai'); if (!aiReport) loadAi(); }}
            >
              {tab === 'ai' ? (
                <LinearGradient colors={[...gradients.blue] as [string, string, string]} style={styles.tabGradient}>
                  <Text style={styles.tabTextActive}>AI 分析</Text>
                </LinearGradient>
              ) : (
                <Text style={styles.tabText}>AI 分析</Text>
              )}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {tab === 'overview' ? (
          <>
            {/* Summary Card - Liquid Glass */}
            <AnimatedGlassCard delay={100} variant="white" style={styles.summaryCard}>
              <View style={styles.summaryContent}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>支出</Text>
                  <Text style={styles.expense}>{formatMoney(report.summary.totalExpense)}</Text>
                </View>
                <View style={styles.summaryDivider} />
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryLabel}>收入</Text>
                  <Text style={styles.income}>{formatMoney(report.summary.totalIncome)}</Text>
                </View>
              </View>
            </AnimatedGlassCard>

            <Text style={styles.sectionTitle}>分类明细</Text>
            {report.categoryBreakdown.map((cat: any, index: number) => (
              <AnimatedGlassCard key={cat.categoryId} delay={200 + index * 80} variant="white" style={styles.catCard}>
                <View style={styles.catItem}>
                  <View style={[styles.catDot, { backgroundColor: cat.category?.color || '#999' }]} />
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat.category?.name}</Text>
                  </View>
                  <Text style={styles.catAmount}>{formatMoney(cat.totalAmount)}</Text>
                </View>
              </AnimatedGlassCard>
            ))}
          </>
        ) : (
          <>
            {aiLoading ? (
              <AnimatedGlassCard delay={100} variant="white" style={styles.aiLoadingCard}>
                <Text style={styles.aiLoadingText}>生成中...</Text>
              </AnimatedGlassCard>
            ) : aiReport ? (
              <>
                <AnimatedGlassCard delay={100} variant="white" style={styles.aiCard}>
                  <View style={styles.aiContent}>
                    <Text style={styles.aiTitle}>AI 财务洞察</Text>
                    <Text style={styles.aiText}>{`储蓄率：${aiReport.summary.savingsRate}%`}</Text>
                    <Text style={styles.aiText}>{`环比变化：${aiReport.summary.monthOverMonthChange}%`}</Text>
                  </View>
                </AnimatedGlassCard>

                <Text style={styles.sectionTitle}>洞察</Text>
                {aiReport.insights.map((i: string, idx: number) => (
                  <AnimatedGlassCard key={'insight-' + idx} delay={200 + idx * 80} variant="white" style={styles.insightCard}>
                    <Text style={styles.insightText}>{i}</Text>
                  </AnimatedGlassCard>
                ))}

                <Text style={styles.sectionTitle}>建议</Text>
                {aiReport.recommendations.map((r: string, idx: number) => (
                  <AnimatedGlassCard key={'rec-' + idx} delay={400 + idx * 80} variant="white" style={styles.insightCard}>
                    <Text style={styles.insightText}>{r}</Text>
                  </AnimatedGlassCard>
                ))}
              </>
            ) : (
              <AnimatedGlassCard delay={100} variant="white" style={styles.aiLoadCard}>
                <TouchableOpacity onPress={loadAi}>
                  <Text style={styles.aiLoadText}>生成 AI 报告</Text>
                </TouchableOpacity>
              </AnimatedGlassCard>
            )}
          </>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>
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
  tabActive: {},
  tabGradient: { paddingVertical: spacing.sm, alignItems: 'center', borderRadius: borderRadius.md },
  tabText: { textAlign: 'center', paddingVertical: spacing.sm, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  tabTextActive: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: '#FFFFFF' },

  // Summary
  summaryCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  summaryContent: { flexDirection: 'row', padding: spacing.xl, alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryDivider: { width: 1, height: 48, backgroundColor: 'rgba(0,0,0,0.08)' },
  summaryLabel: { color: colors.textSecondary, fontSize: fontSize.sm, fontWeight: fontWeight.medium },
  expense: { color: '#EF4444', fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, marginTop: spacing.xs },
  income: { color: '#16A34A', fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, marginTop: spacing.xs },

  sectionTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginHorizontal: spacing.lg, marginBottom: spacing.md, marginTop: spacing.sm },

  // Category
  catCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  catItem: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  catDot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing.sm },
  catInfo: { flex: 1 },
  catName: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  catAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold, color: colors.expense },

  // AI
  aiLoadingCard: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  aiLoadingText: { textAlign: 'center', color: colors.textSecondary, fontSize: fontSize.md, padding: spacing.xl },
  aiCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg },
  aiContent: { padding: spacing.xl },
  aiTitle: { color: '#2563EB', fontSize: fontSize.lg, fontWeight: fontWeight.bold, marginBottom: spacing.md },
  aiText: { color: colors.text, fontSize: fontSize.md, marginBottom: spacing.xs },
  insightCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  insightText: { fontSize: fontSize.md, color: colors.text, lineHeight: 22, padding: spacing.md },
  aiLoadCard: { marginHorizontal: spacing.lg, marginTop: spacing.xl },
  aiLoadText: { textAlign: 'center', color: '#38BDF8', fontSize: fontSize.lg, fontWeight: fontWeight.semibold, padding: spacing.xl },
});
