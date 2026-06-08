import React, { useState, useEffect, useRef, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, ActivityIndicator, Keyboard, Platform } from "react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { categoriesApi, transactionsApi, smartApi } from "../../src/api/endpoints";
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadow } from "../../src/theme";
import Animated, { useSharedValue, useAnimatedStyle, withSequence, withSpring, withTiming } from "react-native-reanimated";
import GlassCard from "../../src/components/glass/GlassCard";
import Toast from "../../src/components/Toast";
import GlassButton from "../../src/components/glass/GlassButton";
import DynamicBackground from "../../src/components/glass/DynamicBackground";

interface QuickSuggest {
  categories: Array<{ categoryId: string; category: { id: string; name: string; icon: string; color: string }; count: number }>;
  merchants: Array<{ merchant: string; categoryId: string; category: { id: string; name: string; icon: string; color: string }; count: number }>;
}

export default function AddTransactionScreen() {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [merchant, setMerchant] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<QuickSuggest | null>(null);
  const amountRef = useRef<TextInput>(null);
  const [toast, setToast] = useState<{id:string;message:string;type?:string} | null>(null);
  const amountScale = useSharedValue(1);
  const amountAnimStyle = useAnimatedStyle(() => ({ transform: [{ scale: amountScale.value }] }));
  const titleRef = useRef<TextInput>(null);

  useEffect(() => {
    loadCategories();
    loadSuggestions();
    // 自动聚焦金额
    setTimeout(() => amountRef.current?.focus(), 300);
  }, [type]);

  const loadCategories = async () => {
    try {
      const { data } = await categoriesApi.list(type);
      setCategories(data.data || []);
      if (data.data?.length > 0 && !selectedCategory) setSelectedCategory(data.data[0].id);
    } catch {}
  };

  const loadSuggestions = async () => {
    try {
      const { data } = await smartApi.suggestions();
      setSuggestions(data.data);
    } catch {}
  };

  const handleTitleBlur = async () => {
    if (!title.trim()) return;
    try {
      const { data } = await smartApi.parseTitle(title.trim());
      if (data.data.amount && !amount) {
        setAmount(String(data.data.amount));
      }
      if (data.data.merchant) {
        setMerchant(data.data.merchant);
        // 自动联动分类：用解析出的商户调用智能分类
        try {
          const predictRes = await smartApi.predict({ rawText: data.data.merchant });
          if (predictRes.data.data?.categoryId) {
            setSelectedCategory(predictRes.data.data.categoryId);
          }
        } catch {}
      }
    } catch {}
  };

  const handleMerchantTag = (m: { merchant: string; categoryId: string }) => {
    setMerchant(m.merchant);
    setSelectedCategory(m.categoryId);
    setTitle(m.merchant);
  };

  const handleCategoryTag = (cat: { categoryId: string }) => {
    setSelectedCategory(cat.categoryId);
  };

  const handleSubmit = async (continueRecording = false) => {
    const amountNum = parseFloat(amount);
    if (!amountNum || amountNum <= 0) { Alert.alert("提示", "请输入有效金额"); return; }
    if (!title.trim()) { Alert.alert("提示", "请输入用途"); return; }
    if (!selectedCategory) { Alert.alert("提示", "请选择分类"); return; }
    setLoading(true);
    try {
      await transactionsApi.create({
        type,
        amount: Math.round(amountNum * 100),
        title: title.trim(),
        note: note.trim() || undefined,
        merchant: merchant || undefined,
        categoryId: selectedCategory,
        occurredAt: new Date().toISOString(),
        clientTxnId: "mobile_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      });
      if (continueRecording) {
        setAmount("");
        setTitle("");
        setNote("");
        setMerchant("");
        setTimeout(() => amountRef.current?.focus(), 200);
      } else {
        router.back();
      }
    } catch (err: any) {
      Alert.alert("失败", err.response?.data?.error?.message || "请稍后重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <DynamicBackground />
      <ScrollView style={styles.container} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>记一笔</Text>
          <View style={{ width: 32 }} />
        </View>

        {/* Type Switcher */}
        <GlassCard variant="white" style={styles.typeRow}>
          <View style={styles.typeInner}>
            <TouchableOpacity style={[styles.typeBtn, type === "EXPENSE" && styles.typeBtnActive]} onPress={() => { setType("EXPENSE"); setSelectedCategory(""); }}>
              {type === "EXPENSE" ? (
                <LinearGradient colors={[colors.expense, "#F87171"]} style={styles.typeGradient}>
                  <Text style={styles.typeTextActive}>支出</Text>
                </LinearGradient>
              ) : <Text style={styles.typeText}>支出</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={[styles.typeBtn, type === "INCOME" && styles.typeBtnActive]} onPress={() => { setType("INCOME"); setSelectedCategory(""); }}>
              {type === "INCOME" ? (
                <LinearGradient colors={[colors.income, "#4ADE80"]} style={styles.typeGradient}>
                  <Text style={styles.typeTextActive}>收入</Text>
                </LinearGradient>
              ) : <Text style={styles.typeText}>收入</Text>}
            </TouchableOpacity>
          </View>
        </GlassCard>

        {/* Amount Input */}
        <Animated.View style={amountAnimStyle}>
        <GlassCard variant="white" style={styles.amountCard}>
          <View style={styles.amountRow}>
            <Text style={styles.currencySign}>¥</Text>
            <TextInput
              ref={amountRef}
              style={styles.amountInput}
              placeholder="0.00"
              placeholderTextColor={colors.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              returnKeyType="next"
              onSubmitEditing={() => titleRef.current?.focus()}
            />
          </View>
        </GlassCard>
        </Animated.View>

        {/* Quick Suggest Panel */}
        <GlassCard variant="white" style={styles.suggestCard}>
          <Text style={styles.suggestLabel}>常用商户 · 点击快速记账</Text>
          {suggestions && suggestions.merchants.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestScroll}>
              {suggestions.merchants.map((m: any, i: number) => (
                <TouchableOpacity
                  key={"merchant-" + i}
                  style={[styles.suggestTag, merchant === m.merchant && styles.suggestTagActive]}
                  onPress={() => handleMerchantTag(m)}
                >
                  <Text style={[styles.suggestTagText, merchant === m.merchant && { color: colors.white }]}>
                    {m.merchant}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <Text style={styles.suggestEmpty}>记账越多，推荐越准</Text>
          )}
          <Text style={[styles.suggestLabel, { marginTop: spacing.sm }]}>常用分类</Text>
          {suggestions && suggestions.categories.length > 0 ? (
            <View style={styles.categoryRow}>
              {suggestions.categories.map((cat: any, i: number) => (
                <TouchableOpacity
                  key={"cat-" + i}
                  style={[styles.catChip, selectedCategory === cat.categoryId && styles.catChipActive]}
                  onPress={() => handleCategoryTag(cat)}
                >
                  <Text style={[styles.catText, selectedCategory === cat.categoryId && { color: colors.white }]}>
                    {cat.category?.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <Text style={styles.suggestEmpty}>暂无常用分类</Text>
          )}
        </GlassCard>

        {/* Title + Note */}
        <GlassCard variant="white" style={styles.fieldCard}>
          <TextInput
            ref={titleRef}
            style={styles.input}
            placeholder="用途（如：麦当劳 35）"
            placeholderTextColor={colors.textMuted}
            value={title}
            onChangeText={setTitle}
            onBlur={handleTitleBlur}
            returnKeyType="next"
          />
          <View style={styles.divider} />
          <TextInput
            style={[styles.input, { fontSize: fontSize.sm }]}
            placeholder="备注（可选）"
            placeholderTextColor={colors.textMuted}
            value={note}
            onChangeText={setNote}
            multiline
          />
        </GlassCard>

        {/* Category Selector */}
        <GlassCard variant="white" style={styles.fieldCard}>
          <Text style={styles.fieldLabel}>选择分类</Text>
          <View style={styles.categoryGrid}>
            {categories.map((cat) => (
              <TouchableOpacity
                key={cat.id}
                style={[styles.catGridItem, selectedCategory === cat.id && { borderColor: colors.primary, backgroundColor: colors.primary + "10" }]}
                onPress={() => setSelectedCategory(cat.id)}
              >
                <Text style={styles.catGridIcon}>{getCategoryEmoji(cat.icon)}</Text>
                <Text style={[styles.catGridName, selectedCategory === cat.id && { color: colors.primary, fontWeight: fontWeight.semibold }]} numberOfLines={1}>
                  {cat.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Actions */}
        <View style={styles.actions}>
          <GlassButton
            title="保存并再记一笔"
            onPress={() => handleSubmit(true)}
            variant="outline"
            style={styles.secondaryBtn}
            textStyle={styles.secondaryBtnText}
          />
          <GlassButton
            title={loading ? "" : "完成"}
            onPress={() => handleSubmit(false)}
            variant="gradient"
            colors={gradients.blue}
            style={styles.primaryBtn}
            textStyle={styles.primaryBtnText}
          />
        </View>
        {loading && <ActivityIndicator style={styles.spinner} color={colors.primary} />}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function getCategoryEmoji(icon: string): string {
  const map: Record<string, string> = {
    food: "🍜", shopping_bag: "🛍️", directions_car: "🚗", sports_esports: "🎮",
    school: "📚", local_hospital: "🏥", house: "🏠", flight: "✈️",
    pets: "🐱", devices: "📱", checkroom: "👔", card_giftcard: "🎁",
    shield: "🛡️", trending_up: "📈", more_horiz: "⋯",
    cash: "💰", gift: "🎁", briefcase: "💼", wallet: "👛",
    receipt: "📋", heart: "❤️", logo_usd: "💲",
    trophy: "🏆", swap_horizontal: "🔄", shield_checkmark: "🛡️", ellipsis_horizontal: "⋯",
  };
  return map[icon] || "📌";
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  content: { paddingBottom: spacing.xl },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingTop: 56, paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  backBtn: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: fontSize.xl, fontWeight: fontWeight.bold, color: colors.text },
  typeRow: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  typeInner: { flexDirection: "row", padding: 4 },
  typeBtn: { flex: 1, borderRadius: borderRadius.md, overflow: "hidden" },
  typeBtnActive: {},
  typeGradient: { paddingVertical: spacing.sm, alignItems: "center", borderRadius: borderRadius.md },
  typeText: { textAlign: "center", paddingVertical: spacing.sm, fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: colors.textSecondary },
  typeTextActive: { fontSize: fontSize.md, fontWeight: fontWeight.semibold, color: "#FFFFFF" },
  amountCard: { marginHorizontal: spacing.lg, marginBottom: spacing.lg, backgroundColor: colors.surface },
  amountRow: { flexDirection: "row", alignItems: "center", padding: spacing.lg },
  currencySign: { fontSize: fontSize.xxxl, fontWeight: fontWeight.heavy, color: colors.textSecondary, marginRight: spacing.sm },
  amountInput: { flex: 1, fontSize: 44, fontWeight: fontWeight.heavy, color: colors.text, padding: 0, letterSpacing: -1 },
  suggestCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.md, backgroundColor: 'rgba(47, 106, 230, 0.04)' },
  suggestLabel: { fontSize: fontSize.xs, color: colors.primary, fontWeight: fontWeight.semibold, marginBottom: spacing.sm, letterSpacing: 0.5 },
  suggestScroll: { marginBottom: spacing.sm },
  suggestTag: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceAlt, marginRight: spacing.sm, borderWidth: 1, borderColor: colors.border },
  suggestTagActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  suggestTagText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  suggestEmpty: { fontSize: fontSize.xs, color: colors.textMuted, paddingVertical: spacing.xs },
  categoryRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  catChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.full, backgroundColor: colors.surfaceAlt, borderWidth: 1, borderColor: colors.border },
  catChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  catText: { fontSize: fontSize.sm, color: colors.text, fontWeight: fontWeight.medium },
  fieldCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md, padding: spacing.lg },
  fieldLabel: { fontSize: fontSize.sm, color: colors.textSecondary, fontWeight: fontWeight.medium, marginBottom: spacing.sm },
  input: { fontSize: fontSize.md, color: colors.text, padding: 0 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: spacing.sm },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.sm },
  catGridItem: { width: "22%", alignItems: "center", paddingVertical: spacing.sm, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border },
  catGridIcon: { fontSize: 20, marginBottom: 2 },
  catGridName: { fontSize: fontSize.xs, color: colors.textSecondary },
  actions: { flexDirection: "row", paddingHorizontal: spacing.lg, gap: spacing.md, marginTop: spacing.md },
  secondaryBtn: { flex: 1, borderRadius: borderRadius.lg, backgroundColor: colors.surfaceAlt },
  secondaryBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  primaryBtn: { flex: 1.5, borderRadius: borderRadius.lg },
  primaryBtnText: { fontSize: fontSize.md, fontWeight: fontWeight.semibold },
  spinner: { marginTop: spacing.md },
});
