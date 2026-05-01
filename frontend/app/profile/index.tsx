import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import api from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import HPBar from '../../components/HPBar';
import EXPBar from '../../components/EXPBar';

export default function ProfileScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser, logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [displayName, setDisplayName] = useState(user?.display_name || '');
  const [bio, setBio] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/user/profile', { display_name: displayName.trim(), bio: bio.trim() });
      updateUser({ display_name: data.data.display_name });
      setEditing(false);
    } catch { Alert.alert('Lỗi', 'Không thể cập nhật profile'); }
    finally { setSaving(false); }
  };

  const handleLogout = () => {
    Alert.alert('Đăng Xuất', 'Bạn chắc chắn muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: async () => { await logout(); router.replace('/(auth)/login'); } },
    ]);
  };

  const statRows = [
    { label: 'Tổng task hoàn thành', value: user?.total_tasks_completed, icon: 'checkmark-circle', color: Colors.status.success },
    { label: 'Streak hiện tại',       value: `${user?.streak_days} ngày`, icon: 'flame',            color: Colors.rpg.streak },
    { label: 'Cấp độ',                value: user?.level,                 icon: 'shield',           color: Colors.brand.violet },
  ];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.editBtn}>
          <Ionicons name={editing ? 'close' : 'create-outline'} size={20} color={Colors.text.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Avatar + name */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            {user?.avatar_url ? (
              <Image source={{ uri: user.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarDefault}>
                <Ionicons name="person" size={48} color={Colors.brand.violet} />
              </View>
            )}
            <View style={styles.levelBadge}>
              <Text style={styles.levelBadgeText}>Lv.{user?.level}</Text>
            </View>
          </View>

          {editing ? (
            <TextInput
              style={styles.nameInput}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Tên hiển thị"
              placeholderTextColor={Colors.text.muted}
              textAlign="center"
              autoFocus
            />
          ) : (
            <Text style={styles.displayName}>{user?.display_name || user?.username}</Text>
          )}
          <Text style={styles.username}>@{user?.username}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        {/* RPG Bars */}
        <View style={styles.barsCard}>
          <HPBar current={user?.hp || 0} max={user?.max_hp || 100} showLabel />
          <View style={{ height: 8 }} />
          <EXPBar current={user?.exp || 0} max={user?.exp_to_next || 100} level={user?.level || 1} showLabel />
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {statRows.map(row => (
            <View key={row.label} style={styles.statCard}>
              <View style={[styles.statIcon, { backgroundColor: row.color + '25' }]}>
                <Ionicons name={row.icon as any} size={20} color={row.color} />
              </View>
              <Text style={[styles.statValue, { color: row.color }]}>{row.value}</Text>
              <Text style={styles.statLabel}>{row.label}</Text>
            </View>
          ))}
        </View>

        {/* Save button if editing */}
        {editing && (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Ionicons name="log-out-outline" size={20} color={Colors.status.error} />
          <Text style={styles.logoutText}>Đăng Xuất</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  backBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg.card, alignItems: 'center', justifyContent: 'center',
  },
  profileSection: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 4 },
  avatarContainer: { position: 'relative', marginBottom: Spacing.sm },
  avatar: { width: 100, height: 100, borderRadius: 50 },
  avatarDefault: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.border.bright,
    alignItems: 'center', justifyContent: 'center',
  },
  levelBadge: {
    position: 'absolute', bottom: 0, right: -4,
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  levelBadgeText: { fontSize: FontSize.xs, fontWeight: '900', color: '#fff' },
  displayName: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  nameInput: {
    fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary,
    borderBottomWidth: 1, borderBottomColor: Colors.brand.violet, paddingBottom: 4, minWidth: 200,
  },
  username: { fontSize: FontSize.base, color: Colors.text.secondary },
  email: { fontSize: FontSize.sm, color: Colors.text.muted },
  barsCard: {
    marginHorizontal: Spacing.md, backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.lg, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.border.default, marginBottom: Spacing.md,
  },
  statsGrid: {
    flexDirection: 'row', paddingHorizontal: Spacing.md, gap: 8, marginBottom: Spacing.lg,
  },
  statCard: {
    flex: 1, backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border.default,
    alignItems: 'center', gap: 4,
  },
  statIcon: {
    width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center',
  },
  statValue: { fontSize: FontSize.lg, fontWeight: '900' },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.muted, textAlign: 'center' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.md, backgroundColor: Colors.brand.violet,
    borderRadius: BorderRadius.md, height: 50, marginBottom: Spacing.md,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: Spacing.md, borderWidth: 1, borderColor: Colors.status.error,
    borderRadius: BorderRadius.md, height: 50,
  },
  logoutText: { color: Colors.status.error, fontSize: FontSize.base, fontWeight: '600' },
});
