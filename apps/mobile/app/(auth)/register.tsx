import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useAuthStore } from '../../src/store/authStore';
import { colors, gradients, spacing, fontSize, fontWeight, borderRadius, shadow } from '../../src/theme';
import GlassCard from '../../src/components/glass/GlassCard';
import GlassButton from '../../src/components/glass/GlassButton';


export default function RegisterScreen() {
  const { register } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const logoOpacity = useSharedValue(0);
  const logoTranslateY = useSharedValue(-40);

  useEffect(() => {
    logoOpacity.value = withSpring(1, { damping: 15, stiffness: 150 });
    logoTranslateY.value = withSpring(0, { damping: 15, stiffness: 150 });
  }, []);

  const logoAnimatedStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoTranslateY.value }],
  }));

  const handleRegister = async () => {
    if (!displayName.trim() || !email.trim() || !password) {
      Alert.alert('提示', '请填写所有字段');
      return;
    }
    setLoading(true);
    try {
      await register(email.trim(), password, displayName.trim());
      router.replace('/(tabs)');
    } catch (err: any) {
      Alert.alert('注册失败', err.response?.data?.error?.message || '请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>


      <LinearGradient
        colors={[...gradients.blue] as [string, string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.topAccent}
      />

      <View style={styles.content}>
        <Animated.View style={[styles.header, logoAnimatedStyle]}>
          <View style={styles.logoCircle}><Text style={styles.logoIcon}>¥</Text></View>
          <Text style={styles.logo}>记账通</Text>
          <Text style={styles.subtitle}>创建新账户</Text>
        </Animated.View>

        <GlassCard variant="strong" style={styles.formCard}>
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>昵称</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入昵称"
                placeholderTextColor={colors.textMuted}
                value={displayName}
                onChangeText={setDisplayName}
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>邮箱地址</Text>
              <TextInput
                style={styles.input}
                placeholder="请输入邮箱"
                placeholderTextColor={colors.textMuted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>密码</Text>
              <TextInput
                style={styles.input}
                placeholder="至少6位，含字母和数字"
                placeholderTextColor={colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            <GlassButton
              title={loading ? '' : '注册'}
              onPress={handleRegister}
              variant="gradient"
              colors={gradients.blue}
              style={styles.button}
              disabled={loading}
            />
            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator color="#FFFFFF" />
              </View>
            )}
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity style={styles.linkBtn}>
                <Text style={styles.linkText}>已有账号？去登录</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </GlassCard>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 200,
    borderBottomLeftRadius: borderRadius.xxl,
    borderBottomRightRadius: borderRadius.xxl,
    opacity: 0.3,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  header: { alignItems: 'center', marginBottom: spacing.huge },
  logoCircle: { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md, ...shadow.lg },
  logoIcon: { fontSize: 28, color: '#FFFFFF', fontWeight: fontWeight.heavy },
  logo: { fontSize: fontSize.xxl, fontWeight: fontWeight.heavy, color: colors.text, letterSpacing: 1 },
  tagline: { fontSize: fontSize.sm, color: colors.textMuted, marginTop: spacing.xs, letterSpacing: 2 },

  formCard: { marginHorizontal: 0 },
  form: { padding: spacing.xl, gap: spacing.lg },
  inputWrapper: { gap: spacing.xs },
  inputLabel: { fontSize: fontSize.sm, fontWeight: fontWeight.semibold, color: colors.textSecondary, marginLeft: 2 },
  input: {
    backgroundColor: 'rgba(241, 245, 249, 0.8)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    fontSize: fontSize.md,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  button: { marginTop: spacing.sm, position: 'relative' },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    top: spacing.sm,
  },
  linkBtn: { alignItems: 'center', marginTop: spacing.xs },
  linkText: { color: colors.primary, fontSize: fontSize.md, fontWeight: fontWeight.medium },
});
