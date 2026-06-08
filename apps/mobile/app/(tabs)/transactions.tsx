import React, { useState, useCallback, useRef } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, TouchableOpacity, TextInput, Alert } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { transactionsApi, categoriesApi } from '../../src/api/endpoints';
import { formatMoney, formatDate } from '../../src/utils/format';
import { colors, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../src/theme';
import AnimatedGlassCard from '../../src/components/glass/AnimatedGlassCard';
import GlassCard from '../../src/components/glass/GlassCard';
import GlassButton from '../../src/components/glass/GlassButton';
import DynamicBackground from '../../src/components/glass/DynamicBackground';
import { gradients } from '../../src/theme';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const loadingRef = useRef(false);
  const debounceRef = useRef<any>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [mergeMode, setMergeMode] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  const loadTransactions = useCallback(async (searchQuery: string) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const { data } = await transactionsApi.list({ page: 1, pageSize: 100, query: searchQuery || undefined });
      setTransactions(data.data || []);
    } catch {} finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions(query);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      loadTransactions('');
    }, [loadTransactions])
  );

  const onQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      loadTransactions(text);
    }, 400);
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const enterSelectMode = (firstId: string) => {
    setSelectMode(true);
    setMergeMode(false);
    setSelectedIds(new Set([firstId]));
  };

  const exitSelectMode = () => {
    setSelectMode(false);
    setMergeMode(false);
    setSelectedIds(new Set());
  };

  const handleBatchDelete = () => {
    Alert.alert('批量删除', `确定删除选中的 ${selectedIds.size} 笔账单？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive', onPress: async () => {
          try {
            await transactionsApi.batchDelete(Array.from(selectedIds));
            exitSelectMode();
            loadTransactions(query);
            } catch (err: any) { Alert.alert("删除失败", err?.response?.data?.error?.message || "请稍后重试"); }
        }
      },
    ]);
  };

  const handleBatchChangeCategory = async () => {
    try {
      const { data } = await categoriesApi.list('EXPENSE');
      setCategories(data.data || []);
      setShowCategoryPicker(true);
    } catch (err: any) { Alert.alert("修改失败", err?.response?.data?.error?.message || "请稍后重试"); }
  };

  const applyCategory = async (categoryId: string) => {
    try {
      await transactionsApi.batchUpdateCategory(Array.from(selectedIds), categoryId);
      setShowCategoryPicker(false);
      exitSelectMode();
      loadTransactions(query);
    } catch {}
  };

  const handleMergeStart = () => {
    setMergeMode(true);
    setSelectedIds(new Set());
  };

  const handleMergeConfirm = async () => {
    const ids = Array.from(selectedIds);
    if (ids.length !== 2) {
      Alert.alert('提示', '合并需要恰好选择 2 笔账单');
      return;
    }
    try {
      await transactionsApi.merge(ids[0], ids[1]);
      setMergeMode(false);
      exitSelectMode();
      loadTransactions(query);
      Alert.alert('成功', '账单已合并');
    } catch (err: any) { Alert.alert("合并失败", err?.response?.data?.error?.message || "请稍后重试"); }
  };

  return (
    <View style={styles.screen}>
      <DynamicBackground />
      {selectMode ? (
        <View style={styles.selectHeader}>
          <TouchableOpacity onPress={exitSelectMode}>
            <Ionicons name="close" size={22} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.selectCount}>已选 {selectedIds.size} 笔</Text>
          <TouchableOpacity onPress={() => setSelectedIds(new Set(transactions.map((t: any) => t.id)))}>
            <Text style={styles.selectAllText}>全选</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.header}>
          <Text style={styles.headerTitle}>记账</Text>
        </View>
      )}

      {/* Search Bar - Glass style */}
      <GlassCard variant="white" style={styles.searchWrapper}>
        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="搜索交易..."
            placeholderTextColor={colors.textMuted}
            value={query}
            onChangeText={onQueryChange}
            returnKeyType="search"
            clearButtonMode="while-editing"
          />
        </View>
      </GlassCard>

      <FlatList
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        data={transactions}
        keyExtractor={(item, index) => item.id + '_' + index}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <TransactionCard
            item={item}
            index={index}
            selectMode={selectMode}
            mergeMode={mergeMode}
            selected={selectedIds.has(item.id)}
            onLongPress={() => enterSelectMode(item.id)}
            onPress={() => selectMode ? toggleSelect(item.id) : null}
          />
        )}
        ListEmptyComponent={
          !loading ? (
            <AnimatedGlassCard delay={200} variant="white" style={styles.emptyCard}>
              <Text style={styles.empty}>暂无交易记录</Text>
            </AnimatedGlassCard>
          ) : null
        }
      />

      {/* Batch Action Bar */}
      {selectMode && (
        <View style={styles.actionBar}>
          <TouchableOpacity style={styles.actionBarItem} onPress={handleBatchChangeCategory}>
            <Ionicons name="pricetag-outline" size={20} color={colors.primary} />
            <Text style={styles.actionBarText}>改分类</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBarItem} onPress={handleMergeStart}>
            <Ionicons name="git-merge-outline" size={20} color={mergeMode ? colors.danger : colors.primary} />
            <Text style={[styles.actionBarText, mergeMode && { color: colors.danger }]}>合并</Text>
          </TouchableOpacity>
          {mergeMode && selectedIds.size === 2 && (
            <TouchableOpacity style={styles.actionBarItem} onPress={handleMergeConfirm}>
              <Ionicons name="checkmark-circle" size={20} color={colors.success} />
              <Text style={[styles.actionBarText, { color: colors.success }]}>确认合并</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity style={styles.actionBarItem} onPress={handleBatchDelete}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.actionBarText, { color: colors.danger }]}>删除</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Category Picker Modal */}
      {showCategoryPicker && (
        <View style={styles.categoryPickerOverlay}>
          <View style={styles.categoryPickerSheet}>
            <Text style={styles.categoryPickerTitle}>选择目标分类</Text>
            <ScrollView style={{ maxHeight: 300 }}>
              {categories.map((cat: any) => (
                <TouchableOpacity key={cat.id} style={styles.categoryPickerItem} onPress={() => applyCategory(cat.id)}>
                  <Text style={styles.categoryPickerText}>{cat.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <TouchableOpacity style={styles.categoryPickerCancel} onPress={() => setShowCategoryPicker(false)}>
              <Text style={styles.categoryPickerCancelText}>取消</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {!selectMode && (
        <View style={styles.addBtnWrapper}>
          <GlassButton
            title="记一笔"
            onPress={() => router.push('/(modals)/add-transaction')}
            variant="gradient"
            colors={gradients.blue}
            style={styles.addBtn}
          />
        </View>
      )}
    </View>
  );
}

function TransactionCard({ item, index, selectMode, mergeMode, selected, onLongPress, onPress }: { item: any; index: number; selectMode?: boolean; mergeMode?: boolean; selected?: boolean; onLongPress?: () => void; onPress?: () => void }) {
  const scale = useSharedValue(1);
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedGlassCard delay={Math.min(index * 60, 600)} variant="white" translateY={25} style={[styles.txnWrapper, selected && styles.txnSelected]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => { scale.value = withSpring(0.97, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 15, stiffness: 300 }); }}
        onLongPress={onLongPress}
        onPress={onPress}
      >
        <Animated.View style={[styles.txnItem, animatedStyle]}>
          {selectMode && (
            <View style={[styles.checkbox, selected && styles.checkboxActive]}>
              {selected && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
            </View>
          )}
          <View style={styles.txnInfo}>
            <Text style={styles.txnTitle}>{item.title}</Text>
            <Text style={styles.txnMeta}>{item.category?.name} · {formatDate(item.occurredAt)}</Text>
          </View>
          <Text style={[styles.txnAmount, { color: item.type === 'EXPENSE' ? colors.expense : colors.income }]}>
            {item.type === 'EXPENSE' ? '-' : '+'}{formatMoney(item.amount)}
          </Text>
        </Animated.View>
      </TouchableOpacity>
    </AnimatedGlassCard>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  header: {
    paddingTop: 56,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.md,
  },
  headerTitle: { fontSize: fontSize.xxxl, fontWeight: fontWeight.heavy, color: colors.text },

  // Search
  searchWrapper: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: fontSize.md,
    color: colors.text,
    padding: 0,
  },

  listContent: { paddingBottom: 180 },

  // Transaction items
  txnWrapper: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  txnItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  txnInfo: { flex: 1 },
  txnTitle: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text },
  txnMeta: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  txnAmount: { fontSize: fontSize.md, fontWeight: fontWeight.bold },

  // Empty
  emptyCard: { marginHorizontal: spacing.lg, marginTop: spacing.xxxl },
  empty: { textAlign: 'center', color: colors.textMuted, fontSize: fontSize.md, padding: spacing.xl },

  // Add button
  addBtnWrapper: {
    position: 'absolute',
    bottom: 100,
    left: spacing.xl,
    right: spacing.xl,
  },
  addBtn: { borderRadius: borderRadius.xl },

  // Select mode header
  selectHeader: {
    paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md,
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
  },
  selectCount: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  selectAllText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.primary },

  // Checkbox
  checkbox: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
    alignItems: "center", justifyContent: "center", marginRight: spacing.sm,
  },
  checkboxActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  txnSelected: { borderColor: colors.primary, borderWidth: 1.5 },

  // Action bar
  actionBar: {
    position: "absolute", bottom: 100, left: spacing.lg, right: spacing.lg,
    backgroundColor: "rgba(255,255,255,0.95)", borderRadius: borderRadius.xl,
    flexDirection: "row", justifyContent: "space-around", paddingVertical: spacing.md,
    ...shadow.lg,
  },
  actionBarItem: { alignItems: "center", paddingHorizontal: spacing.sm },
  actionBarText: { fontSize: fontSize.xs, fontWeight: fontWeight.medium, color: colors.primary, marginTop: 2 },

  // Category picker
  categoryPickerOverlay: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end", zIndex: 9999,
  },
  categoryPickerSheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: borderRadius.xl, borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg, paddingBottom: spacing.xxxl,
  },
  categoryPickerTitle: { fontSize: fontSize.lg, fontWeight: fontWeight.bold, color: colors.text, marginBottom: spacing.md, textAlign: "center" },
  categoryPickerItem: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  categoryPickerText: { fontSize: fontSize.md, color: colors.text },
  categoryPickerCancel: { paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.sm },
  categoryPickerCancelText: { fontSize: fontSize.md, color: colors.textSecondary, fontWeight: fontWeight.medium },

});
