import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  KeyboardAvoidingView, Platform, ScrollView, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!name.trim() || !email.trim() || !password.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin');
      return;
    }
    if (password !== confirm) {
      Alert.alert('Lỗi', 'Mật khẩu xác nhận không khớp');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự');
      return;
    }
    try {
      clearError();
      await register(name.trim(), email.trim(), password);
      // Chuyển sang màn hình setup avatar thay vì vào thẳng game
      router.replace('/avatar-setup');
    } catch {}
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>
          <View style={styles.logoBox}>
            <Ionicons name="person-add" size={40} color={Colors.brand.violet} />
          </View>
          <Text style={styles.title}>Tạo tài khoản</Text>
          <Text style={styles.subtitle}>Bắt đầu hành trình RPG của bạn</Text>
        </View>

        <View style={styles.form}>
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.status.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Họ và tên</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.text.muted} style={styles.icon} />
              <TextInput
                style={styles.input} placeholder="Nguyễn Văn A"
                placeholderTextColor={Colors.text.muted} value={name}
                onChangeText={setName} autoCapitalize="words"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="mail-outline" size={18} color={Colors.text.muted} style={styles.icon} />
              <TextInput
                style={styles.input} placeholder="your@email.com"
                placeholderTextColor={Colors.text.muted} value={email}
                onChangeText={setEmail} keyboardType="email-address"
                autoCapitalize="none" autoCorrect={false}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Mật khẩu</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.text.muted} style={styles.icon} />
              <TextInput
                style={styles.input} placeholder="Ít nhất 6 ký tự"
                placeholderTextColor={Colors.text.muted} value={password}
                onChangeText={setPassword} secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={Colors.text.muted} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Xác nhận mật khẩu</Text>
            <View style={[styles.inputWrapper, confirm && confirm !== password && { borderColor: Colors.status.error }]}>
              <Ionicons name="shield-checkmark-outline" size={18} color={Colors.text.muted} style={styles.icon} />
              <TextInput
                style={styles.input} placeholder="Nhập lại mật khẩu"
                placeholderTextColor={Colors.text.muted} value={confirm}
                onChangeText={setConfirm} secureTextEntry={!showPassword}
              />
            </View>
            {confirm && confirm !== password && (
              <Text style={styles.fieldError}>Mật khẩu không khớp</Text>
            )}
          </View>

          <TouchableOpacity
            style={[styles.btn, isLoading && styles.btnDisabled]}
            onPress={handleRegister} disabled={isLoading} activeOpacity={0.85}
          >
            {isLoading
              ? <ActivityIndicator color="#fff" />
              : <><Ionicons name="rocket" size={18} color="#fff" /><Text style={styles.btnText}>Bắt Đầu Hành Trình</Text></>
            }
          </TouchableOpacity>

          <TouchableOpacity style={styles.link} onPress={() => router.back()}>
            <Text style={styles.linkText}>Đã có tài khoản? <Text style={styles.linkBold}>Đăng nhập</Text></Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { flexGrow: 1, paddingHorizontal: Spacing.lg, paddingTop: 60, paddingBottom: 40 },
  header: { alignItems: 'center', marginBottom: Spacing.xl },
  backBtn: { position: 'absolute', left: 0, top: 0, padding: 8 },
  logoBox: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.border.bright,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    shadowColor: Colors.brand.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary },
  subtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 4 },
  form: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border.default,
  },
  errorBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: BorderRadius.sm,
    padding: Spacing.sm, marginBottom: Spacing.md, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
  },
  errorText: { color: Colors.status.error, fontSize: FontSize.sm, flex: 1 },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: 6, fontWeight: '600' },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.default, paddingHorizontal: Spacing.md,
  },
  icon: { marginRight: 8 },
  input: { flex: 1, height: 48, color: Colors.text.primary, fontSize: FontSize.base },
  eyeBtn: { height: 48, justifyContent: 'center', paddingLeft: 8 },
  fieldError: { color: Colors.status.error, fontSize: FontSize.xs, marginTop: 4, marginLeft: 4 },
  btn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.md, height: 52, marginTop: Spacing.sm,
    shadowColor: Colors.brand.violet, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  link: { alignItems: 'center', marginTop: Spacing.md, paddingVertical: Spacing.sm },
  linkText: { color: Colors.text.secondary, fontSize: FontSize.sm },
  linkBold: { color: Colors.brand.violetLight, fontWeight: '700' },
});
