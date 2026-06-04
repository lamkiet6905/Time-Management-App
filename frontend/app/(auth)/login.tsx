import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize, DoodleStyle } from '../../constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập email và mật khẩu');
      return;
    }
    try {
      clearError();
      await login(email.trim(), password);
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Logo */}
        <View style={styles.header}>
          <View style={styles.logoBox}>
            <Ionicons name="shield" size={48} color={Colors.brand.violet} />
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
              <Ionicons name="mail-outline" size={18} color={Colors.text.muted} style={styles.icon} />
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
              <Ionicons name="lock-closed-outline" size={18} color={Colors.text.muted} style={styles.icon} />
              <TextInput
                style={styles.input}
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

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={isLoading}
            activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <><Text style={styles.btnText}>Đăng Nhập</Text><Ionicons name="arrow-forward" size={18} color="#fff" /></>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.push('/(auth)/register')}>
            <Text style={styles.linkText}>Chưa có tài khoản? <Text style={styles.linkBold}>Đăng ký ngay</Text></Text>
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
  logoBox: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.brand.gold, 
    borderWidth: DoodleStyle.borderWidth, borderColor: DoodleStyle.borderColor,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    ...DoodleStyle,
  },
  title: { fontSize: FontSize.xxxl, fontWeight: '900', color: Colors.text.primary, letterSpacing: 1 },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 6, fontWeight: 'bold' },
  form: {
    backgroundColor: Colors.bg.card, borderRadius: DoodleStyle.borderRadius,
    padding: Spacing.lg, borderWidth: DoodleStyle.borderWidth, borderColor: DoodleStyle.borderColor,
    ...DoodleStyle,
  },
  formTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text.primary, marginBottom: Spacing.md },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#FFE6E6', borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 2, borderColor: Colors.status.error,
  },
  errorText: { color: Colors.status.error, fontSize: FontSize.sm, flex: 1, fontWeight: 'bold' },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.base, color: Colors.text.primary, marginBottom: 8, fontWeight: '900' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md,
    borderWidth: 2, borderColor: Colors.border.default, paddingHorizontal: Spacing.md,
  },
  icon: { marginRight: 8, color: Colors.text.primary },
  input: { flex: 1, height: 52, color: Colors.text.primary, fontSize: FontSize.base, fontWeight: 'bold' },
  eyeBtn: { height: 52, justifyContent: 'center', paddingLeft: 8 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.emerald, borderRadius: DoodleStyle.borderRadius, height: 56, marginTop: Spacing.md,
    borderWidth: DoodleStyle.borderWidth, borderColor: DoodleStyle.borderColor,
    ...DoodleStyle,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#000', fontSize: FontSize.lg, fontWeight: '900' },
  link: { alignItems: 'center', marginTop: Spacing.lg, paddingVertical: Spacing.sm },
  linkText: { color: Colors.text.secondary, fontSize: FontSize.sm, fontWeight: 'bold' },
  linkBold: { color: Colors.brand.violet, fontWeight: '900' },
});
