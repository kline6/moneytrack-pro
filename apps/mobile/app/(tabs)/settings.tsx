import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl, Switch, Linking, Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { syncApi } from '../../src/api/endpoints';
import { useNotificationListener } from '../../src/hooks/useNotificationListener';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../src/theme';
import AnimatedGlassCard from '../../src/components/glass/AnimatedGlassCard';
import GlassCard from '../../src/components/glass/GlassCard';
import GlassButton from '../../src/components/glass/GlassButton';
import DynamicBackground from '../../src/components/glass/DynamicBackground';
import { LinearGradient } from 'expo-linear-gradient';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();
  const { hasPermission, checkPermission, requestPermission } = useNotificationListener(true);
  const [conflicts, setConflicts] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [notifEnabled, setNotifEnabled] = useState(false);

  useEffect(() => {
    loadConflicts();
    checkPermission().then(setNotifEnabled);
  }, []);

  const loadConflicts = async () => {
    try { const { data } = await syncApi.conflicts(); setConflicts(data.data || []); } catch {}
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadConflicts();
    const granted = await checkPermission();
    setNotifEnabled(granted);
    setRefreshing(false);
  };

  const handleNotifToggle = async (value: boolean) => {
    if (value) {
      if (Platform.OS === 'android') {
        const granted = await checkPermission();
        if (!granted) {
          Alert.alert(
            '开启通知监听',
            '需要在系统设置中授予"通知使用权"，才能自动识别微信/支付宝支付信息。是否前往设置？',
            [
              { text: '取消', style: 'cancel' },
              { text: '前往设置', onPress: () => requestPermission() },
            ]
          );
          return;
        }
        setNotifEnabled(true);
      }
    } else {
      Alert.alert(
        '关闭通知监听',
        '关闭后将不再自动识别支付信息，是否确认？',
        [
          { text: '取消', style: 'cancel' },
          { text: '确认关闭', style: 'destructive', onPress: () => setNotifEnabled(false) },
        ]
      );
    }
  };

  const handleLogout = () => {
    Alert.alert('确认', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '退出登录', style: 'destructive', onPress: () => { logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const handleResolve = async (id: string, res: string) => {
    try {
      await syncApi.resolve({ syncEventId: id, resolution: res });
      setConflicts(prev => prev.filter(c => c.id !== id));
      Alert.alert('已解决');
    } catch {}
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
        <View style={styles.header}>
          <Text style={styles.headerTitle}>设置</Text>
        </View>

        {/* Profile Card */}
        <AnimatedGlassCard delay={100} variant="white" style={styles.profileCard}>
          <View style={styles.profileContent}>
            <LinearGradient
              colors={[...gradients.blue] as [string, string, string]}
              style={styles.avatar}
            >
              <Text style={styles.avatarText}>
                {user?.displayName?.charAt(0)?.toUpperCase() || 'U'}
              </Text>
            </LinearGradient>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{user?.displayName || '用户'}</Text>
              <Text style={styles.userEmail}>{user?.email || ''}</Text>
            </View>
          </View>
        </AnimatedGlassCard>

        {/* Notification Permission */}
        <Text style={styles.sectionTitle}>自动记账</Text>
        <AnimatedGlassCard delay={150} variant="white" style={styles.menuCard}>
          <View style={styles.menuItem}>
            <View style={styles.menuLeft}>
              <Ionicons name="notifications-outline" size={20} color={colors.primary} />
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuText}>支付通知识别</Text>
                <Text style={styles.menuDesc}>
                  {notifEnabled ? '已开启，付款后自动记账' : '未开启，无法自动识别支付信息'}
                </Text>
              </View>
            </View>
            <Switch
              value={notifEnabled}
              onValueChange={handleNotifToggle}
              trackColor={{ false: colors.border, true: colors.primaryLight }}
              thumbColor={notifEnabled ? colors.primary : '#f4f3f4'}
            />
          </View>
          {!notifEnabled && (
            <>
              <View style={styles.menuDivider} />
              <TouchableOpacity style={styles.menuItem} onPress={() => {
                Alert.alert(
                  '如何开启',
                  '开启后，微信/支付宝付款时会自动识别金额和商户，帮你快速记账。\n\n点击"前往设置"后，在系统通知使用权列表中找到 MoneyTrack 并开启。',
                  [
                    { text: '知道了', style: 'cancel' },
                    { text: '前往设置', onPress: () => requestPermission() },
                  ]
                );
              }}>
                <View style={styles.menuLeft}>
                  <Ionicons name="help-circle-outline" size={20} color={colors.textSecondary} />
                  <Text style={[styles.menuText, { color: colors.primary }]}>如何开启？</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </>
          )}
        </AnimatedGlassCard>

        {/* Conflicts */}
        {conflicts.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>同步冲突 ({conflicts.length})</Text>
            {conflicts.map((c: any, index: number) => (
              <AnimatedGlassCard key={c.id} delay={200 + index * 80} variant="white" style={styles.conflictCard}>
                <Text style={styles.conflictText}>{c.entityType} - {c.operation}</Text>
                <View style={styles.conflictActions}>
                  <TouchableOpacity style={styles.resolveBtn} onPress={() => handleResolve(c.id, 'accept_server')}>
                    <Text style={styles.resolveBtnText}>保留服务器</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.resolveBtn, { backgroundColor: colors.warning }]} onPress={() => handleResolve(c.id, 'accept_client')}>
                    <Text style={styles.resolveBtnText}>使用本地</Text>
                  </TouchableOpacity>
                </View>
              </AnimatedGlassCard>
            ))}
          </>
        )}

        {/* About Section */}
        <Text style={styles.sectionTitle}>关于</Text>
        <AnimatedGlassCard delay={300} variant="white" style={styles.menuCard}>
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>版本</Text>
            <Text style={styles.menuValue}>0.2.0</Text>
          </View>
          <View style={styles.menuDivider} />
          <View style={styles.menuItem}>
            <Text style={styles.menuText}>货币</Text>
            <Text style={styles.menuValue}>CNY</Text>
          </View>
        </AnimatedGlassCard>

        {/* Logout */}
        <AnimatedGlassCard delay={400} variant="white" style={styles.logoutCard}>
          <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
            <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            <Text style={styles.logoutText}>退出登录</Text>
          </TouchableOpacity>
        </AnimatedGlassCard>

        <View style={{ height: 120 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1 },
  contentContainer: { paddingBottom: 0 },
  header: { paddingTop: 56, paddingHorizontal: spacing.xl, paddingBottom: spacing.md },
  headerTitle: { fontSize: fontSize.xxxl, fontWeight: fontWeight.heavy, color: colors.text },

  profileCard: { marginHorizontal: spacing.lg, marginBottom: spacing.xl },
  profileContent: { flexDirection: 'row', alignItems: 'center', padding: spacing.xl },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    justifyContent: 'center', alignItems: 'center',
    marginRight: spacing.lg,
  },
  avatarText: { color: '#FFFFFF', fontSize: fontSize.xxl, fontWeight: fontWeight.bold },
  profileInfo: { flex: 1 },
  userName: { fontSize: fontSize.lg, fontWeight: fontWeight.semibold, color: colors.text },
  userEmail: { fontSize: fontSize.sm, color: colors.textSecondary, marginTop: 2 },

  sectionTitle: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginHorizontal: spacing.lg, marginBottom: spacing.sm, marginTop: spacing.sm },

  menuCard: { marginHorizontal: spacing.lg, marginBottom: spacing.md },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.lg },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  menuTextWrap: { flex: 1 },
  menuDivider: { height: 1, backgroundColor: 'rgba(0,0,0,0.06)', marginHorizontal: spacing.lg },
  menuText: { fontSize: fontSize.md, color: colors.text, fontWeight: fontWeight.medium },
  menuDesc: { fontSize: fontSize.xs, color: colors.textSecondary, marginTop: 2 },
  menuValue: { fontSize: fontSize.md, color: colors.textSecondary },

  conflictCard: { marginHorizontal: spacing.lg, marginBottom: spacing.sm },
  conflictText: { fontSize: fontSize.md, fontWeight: fontWeight.medium, color: colors.text, padding: spacing.md, paddingBottom: 0 },
  conflictActions: { flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  resolveBtn: { backgroundColor: colors.primary, borderRadius: borderRadius.sm, paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  resolveBtnText: { color: colors.white, fontSize: fontSize.sm, fontWeight: fontWeight.semibold },

  logoutCard: { marginHorizontal: spacing.lg, marginTop: spacing.lg },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: spacing.lg, gap: spacing.sm },
  logoutText: { color: colors.danger, fontSize: fontSize.md, fontWeight: fontWeight.semibold },
});
