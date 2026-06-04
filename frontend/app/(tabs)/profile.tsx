import { useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCharacterStore } from '../../stores/characterStore';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize, API_BASE_URL } from '../../constants/theme';

// ── Profile Screen — Character Stats + Achievements ─────────

// Helper: convert relative path to full URL
const toFullUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (path.startsWith('http')) return path;
  const filename = path.replace(/\\/g, '/').split('/').pop();
  return `${API_BASE_URL}/uploads/sprites/${filename}`;
};

export default function ProfileScreen() {
  const { profile, fetchProfile } = useCharacterStore();
  const { user, logout } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchProfile();
  }, []);

  const stats = profile;

  // Ưu tiên: avatar_pixel_url (AI vẽ) → sprite_idle → avatar_original
  const avatarUri = toFullUrl(stats?.avatar_pixel_url) 
    || toFullUrl(stats?.sprite_idle_url) 
    || toFullUrl(stats?.avatar_original_url);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Hồ Sơ Chiến Binh</Text>
      </View>

      {/* Avatar & Name */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarBox}>
          {avatarUri ? (
            <Image 
              source={{ uri: avatarUri }} 
              style={{ width: 100, height: 100, borderRadius: 50 }} 
            />
          ) : (
            <Ionicons name="shield" size={56} color={Colors.brand.violet} />
          )}
        </View>
        <Text style={styles.name}>{stats?.name || user?.name || 'Chiến binh'}</Text>
        <View style={styles.levelBadgeSmall}>
          <Text style={styles.levelBadgeText}>Level {stats?.level || 1}</Text>
        </View>
        <TouchableOpacity 
          style={styles.updateAvatarBtn} 
          onPress={() => router.push('/avatar-setup')}
        >
          <Ionicons name="camera" size={16} color={Colors.brand.cyan} />
          <Text style={styles.updateAvatarText}>
            {avatarUri ? 'Đổi Avatar' : 'Tạo Avatar AI'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Full Stats Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>📊 Chỉ Số Chi Tiết</Text>
        <View style={styles.statsGrid}>
          {[
            { icon: 'heart', label: 'HP', value: `${stats?.hp || 0}/${stats?.max_hp || 50}`, color: Colors.hp.full },
            { icon: 'star', label: 'EXP', value: `${stats?.exp || 0}/${stats?.exp_to_next || 100}`, color: Colors.brand.violet },
            { icon: 'fitness', label: 'Strength', value: String(stats?.strength || 10), color: Colors.status.error },
            { icon: 'speedometer', label: 'Speed', value: String(stats?.speed || 10), color: Colors.brand.cyan },
            { icon: 'cash', label: 'Gold', value: parseFloat(String(stats?.gold || '0')).toFixed(0), color: Colors.brand.gold },
            { icon: 'trophy', label: 'Level', value: String(stats?.level || 1), color: Colors.brand.violetLight },
          ].map((stat, i) => (
            <View key={i} style={styles.statItem}>
              <Ionicons name={stat.icon as any} size={20} color={stat.color} />
              <Text style={styles.statItemValue}>{stat.value}</Text>
              <Text style={styles.statItemLabel}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Buffs Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🛡️ Buff Nội Tại</Text>
        {stats?.buffs && stats.buffs.length > 0 ? (
          stats.buffs.map((buff, i) => (
            <View key={i} style={styles.buffRow}>
              <View style={[styles.buffIcon, { backgroundColor: (buff.info?.color || Colors.brand.violet) + '20' }]}>
                <Ionicons name={(buff.info?.icon as any) || 'star'} size={20} color={buff.info?.color || Colors.brand.violet} />
              </View>
              <View style={styles.buffInfo}>
                <Text style={styles.buffName}>{buff.info?.name || buff.buff_type}</Text>
                <Text style={styles.buffDesc}>{buff.info?.description}</Text>
              </View>
              <Text style={styles.buffLevel}>Lv.{buff.unlock_level}</Text>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            Buff mở khóa tự động mỗi 5 level:{'\n'}
            Lv.5 — Hút Máu | Lv.10 — Chí Mạng | Lv.15 — Khiên Sắt
          </Text>
        )}
      </View>

      {/* Achievements Placeholder */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🏆 Thành Tựu</Text>
        <Text style={styles.emptyText}>
          Hệ thống thành tựu sẽ được hiển thị ở đây (Phase 4)
        </Text>
      </View>

      {/* Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
        <Ionicons name="log-out-outline" size={18} color={Colors.status.error} />
        <Text style={styles.logoutText}>Đăng xuất</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100 },
  header: { marginBottom: Spacing.lg },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary },

  avatarSection: { alignItems: 'center', marginBottom: Spacing.lg },
  avatarBox: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.border.bright,
    alignItems: 'center', justifyContent: 'center', marginBottom: Spacing.md,
    shadowColor: Colors.brand.violet, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 6,
  },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  levelBadgeSmall: {
    backgroundColor: Colors.brand.gold + '20', paddingHorizontal: 12, paddingVertical: 4,
    borderRadius: BorderRadius.full, marginTop: 4,
  },
  levelBadgeText: { fontSize: FontSize.sm, color: Colors.brand.gold, fontWeight: '700' },

  updateAvatarBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: Spacing.sm,
    backgroundColor: Colors.brand.cyan + '15',
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.brand.cyan + '40',
  },
  updateAvatarText: {
    fontSize: FontSize.sm, color: Colors.brand.cyan, fontWeight: '700',
  },

  card: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  cardTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text.primary, marginBottom: Spacing.md },

  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm,
  },
  statItem: {
    width: '30%', alignItems: 'center', gap: 4,
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  statItemValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  statItemLabel: { fontSize: FontSize.xs, color: Colors.text.muted },

  buffRow: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
    paddingVertical: Spacing.sm, borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  buffIcon: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
  },
  buffInfo: { flex: 1 },
  buffName: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text.primary },
  buffDesc: { fontSize: FontSize.xs, color: Colors.text.secondary, marginTop: 2 },
  buffLevel: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '600' },

  emptyText: { fontSize: FontSize.sm, color: Colors.text.muted, lineHeight: 20 },

  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    paddingVertical: 14, borderWidth: 1, borderColor: Colors.status.error + '30',
  },
  logoutText: { color: Colors.status.error, fontSize: FontSize.base, fontWeight: '600' },
});
