import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    try {
      clearError();
      await login(email.trim(), password);
      router.replace('/(tabs)');
    } catch {}
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="shield" size={52} color={Colors.brand.violet} />
          </View>
          <Text style={styles.title}>LifeRPG</Text>
          <Text style={styles.subtitle}>Biến cuộc sống thành cuộc phiêu lưu</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={styles.formTitle}>Đăng Nhập</Text>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.text.muted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="your@email.com"
                placeholderTextColor={Colors.text.muted}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.text.muted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.muted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={isLoading} activeOpacity={0.85}>
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Đăng Nhập</Text>
                <Ionicons name="arrow-forward" size={18} color="#fff" />
              </>
            )}
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>hoặc</Text>
            <View style={styles.dividerLine} />
          </View>

          <TouchableOpacity style={styles.registerBtn} onPress={() => router.push('/(auth)/register')} activeOpacity={0.8}>
            <Text style={styles.registerBtnText}>Tạo tài khoản mới</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 80, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: Spacing.xxl },
  logoContainer: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.bg.card,
    borderWidth: 2, borderColor: Colors.border.bright,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: Spacing.md,
    shadowColor: Colors.brand.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 16,
  },
  title: { fontSize: 36, fontWeight: '800', color: Colors.text.primary, letterSpacing: 1 },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 6 },
  form: {
    backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  formTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.md },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(244, 67, 54, 0.15)', borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(244, 67, 54, 0.3)',
  },
  errorText: { color: Colors.status.error, fontSize: FontSize.sm, flex: 1 },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: 6, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, height: 48, color: Colors.text.primary, fontSize: FontSize.base },
  passwordInput: { paddingRight: 40 },
  eyeBtn: { position: 'absolute', right: 12, height: 48, justifyContent: 'center' },
  loginBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.md,
    height: 52, marginTop: Spacing.sm,
    shadowColor: Colors.brand.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 12,
  },
  loginBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: Spacing.md },
  dividerLine: { flex: 1, height: 1, backgroundColor: Colors.border.default },
  dividerText: { color: Colors.text.muted, fontSize: FontSize.sm, marginHorizontal: Spacing.sm },
  registerBtn: {
    borderWidth: 1, borderColor: Colors.border.bright, borderRadius: BorderRadius.md,
    height: 48, alignItems: 'center', justifyContent: 'center',
  },
  registerBtnText: { color: Colors.brand.violet, fontSize: FontSize.base, fontWeight: '600' },
});
