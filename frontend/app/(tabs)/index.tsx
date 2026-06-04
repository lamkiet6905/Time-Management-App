import { useEffect, useCallback, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuthStore } from '../../stores/authStore';
import { useCharacterStore } from '../../stores/characterStore';
import { useTaskStore, Task } from '../../stores/taskStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

// ── Dashboard / Tổng Quan ───────────────────────────────────
// Hiển thị: Character stats, HP/EXP bars, buffs, daily summary

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout, refreshUser } = useAuthStore();
  const { profile, fetchProfile } = useCharacterStore();
  const { dailies, todos, fetchTasks, completeDaily, completeTodo, deleteTask } = useTaskStore();

  // Fetch lần đầu khi mount
  useEffect(() => {
    fetchProfile();
    fetchTasks();
  }, []);

  // Re-fetch mỗi khi quay lại tab Dashboard
  useFocusEffect(
    useCallback(() => {
      refreshUser();
      fetchTasks();
    }, [])
  );

  const stats = user || profile;
  const completedDailies = dailies.filter(d => d.is_completed_today).length;
  const totalDailies = dailies.length;

  // Lọc nhiệm vụ chưa hoàn thành
  const pendingDailies = dailies.filter(d => !d.is_completed_today);
  const pendingTodos = todos.filter(t => !t.is_done);
  const allPendingTasks = [...pendingDailies, ...pendingTodos];

  // Tính % HP để đổi màu bar
  const hpPercent = stats ? (stats.hp / stats.max_hp) * 100 : 100;
  const hpColor = hpPercent > 60 ? Colors.hp.full : hpPercent > 30 ? Colors.hp.medium : Colors.hp.low;

  // Tính % EXP
  const expPercent = stats ? (stats.exp / stats.exp_to_next) * 100 : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scroll}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Chào mừng trở lại,</Text>
          <Text style={styles.name}>{stats?.name || 'Chiến binh'} ⚔️</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color={Colors.text.secondary} />
        </TouchableOpacity>
      </View>

      {/* Character Card */}
      <View style={styles.characterCard}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelText}>LV</Text>
          <Text style={styles.levelNumber}>{stats?.level || 1}</Text>
        </View>

        <View style={styles.statsContainer}>
          {/* HP Bar */}
          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="heart" size={14} color={hpColor} />
              <Text style={[styles.statText, { color: hpColor }]}>HP</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${hpPercent}%`, backgroundColor: hpColor }]} />
            </View>
            <Text style={styles.statValue}>{stats?.hp || 0}/{stats?.max_hp || 50}</Text>
          </View>

          {/* EXP Bar */}
          <View style={styles.statRow}>
            <View style={styles.statLabel}>
              <Ionicons name="star" size={14} color={Colors.brand.violet} />
              <Text style={[styles.statText, { color: Colors.brand.violet }]}>EXP</Text>
            </View>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${expPercent}%`, backgroundColor: Colors.brand.violet }]} />
            </View>
            <Text style={styles.statValue}>{stats?.exp || 0}/{stats?.exp_to_next || 100}</Text>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Ionicons name="fitness" size={18} color={Colors.status.error} />
            <Text style={styles.statBoxValue}>{stats?.strength || 10}</Text>
            <Text style={styles.statBoxLabel}>STR</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="speedometer" size={18} color={Colors.brand.cyan} />
            <Text style={styles.statBoxValue}>{stats?.speed || 10}</Text>
            <Text style={styles.statBoxLabel}>SPD</Text>
          </View>
          <View style={styles.statBox}>
            <Ionicons name="cash" size={18} color={Colors.brand.gold} />
            <Text style={styles.statBoxValue}>{parseFloat(String(stats?.gold || '0')).toFixed(0)}</Text>
            <Text style={styles.statBoxLabel}>Gold</Text>
          </View>
        </View>
      </View>

      {/* Daily Progress + Pending Tasks */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="today" size={20} color={Colors.brand.gold} />
          <Text style={styles.sectionTitle}>Nhiệm Vụ Hôm Nay</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/tasks')} style={styles.viewAllBtn}>
            <Text style={styles.viewAllText}>Xem tất cả</Text>
            <Ionicons name="chevron-forward" size={14} color={Colors.brand.violet} />
          </TouchableOpacity>
        </View>
        <View style={styles.progressRow}>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, {
              width: totalDailies > 0 ? `${(completedDailies / totalDailies) * 100}%` : '0%',
            }]} />
          </View>
          <Text style={styles.progressText}>{completedDailies}/{totalDailies}</Text>
        </View>

        {/* Danh sách task chưa hoàn thành */}
        {allPendingTasks.length === 0 ? (
          <Text style={styles.doneText}>✨ Tuyệt vời! Bạn đã hoàn thành mọi nhiệm vụ.</Text>
        ) : (
          <View style={styles.pendingList}>
            {allPendingTasks.map(task => (
              <View key={`${task.type}-${task.id}`} style={styles.pendingItem}>
                {/* Type indicator */}
                <View style={[styles.typeIndicator, {
                  backgroundColor: task.type === 'daily' ? Colors.brand.emerald : Colors.brand.cyan,
                }]} />

                {/* Title - bấm vào chuyển tab nhiệm vụ */}
                <TouchableOpacity
                  style={styles.pendingContent}
                  onPress={() => router.push('/(tabs)/tasks')}
                >
                  <Text style={styles.pendingTitle} numberOfLines={1}>{task.title}</Text>
                  <Text style={styles.pendingType}>
                    {task.type === 'daily' ? 'Hàng ngày' : 'Việc cần làm'}
                  </Text>
                </TouchableOpacity>

                {/* Nút hoàn thành */}
                <TouchableOpacity
                  style={styles.pendingCheckBtn}
                  onPress={async () => {
                    try {
                      if (task.type === 'daily') await completeDaily(task.id);
                      else await completeTodo(task.id);
                      refreshUser();
                    } catch (e: any) {
                      Alert.alert('Lỗi', e.message);
                    }
                  }}
                >
                  <Ionicons name="checkmark-circle-outline" size={24} color={Colors.brand.emerald} />
                </TouchableOpacity>

                {/* Nút xóa */}
                <TouchableOpacity
                  style={styles.pendingDeleteBtn}
                  onPress={() => {
                    Alert.alert('Xác nhận', `Xóa "${task.title}"?`, [
                      { text: 'Hủy', style: 'cancel' },
                      { text: 'Xóa', style: 'destructive', onPress: () => deleteTask(task.id) },
                    ]);
                  }}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Buffs */}
      {profile?.buffs && profile.buffs.length > 0 ? (
        <View style={styles.sectionCard}>
          <View style={styles.sectionHeader}>
            <Ionicons name="shield" size={20} color={Colors.brand.violetLight} />
            <Text style={styles.sectionTitle}>Buff Nội Tại</Text>
          </View>
          <View style={styles.buffsRow}>
            {profile.buffs.map((buff, i) => (
              <View key={i} style={[styles.buffBadge, { borderColor: buff.info?.color || Colors.brand.violet }]}>
                <Ionicons name={(buff.info?.icon as any) || 'star'} size={16} color={buff.info?.color || Colors.brand.violet} />
                <Text style={[styles.buffName, { color: buff.info?.color }]}>{buff.info?.name}</Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { padding: Spacing.lg, paddingTop: 60, paddingBottom: 100 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  greeting: { fontSize: FontSize.sm, color: Colors.text.secondary },
  name: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  logoutBtn: { padding: Spacing.sm, backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md },

  characterCard: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  levelBadge: {
    flexDirection: 'row', alignItems: 'baseline', gap: 4, marginBottom: Spacing.md,
  },
  levelText: { fontSize: FontSize.sm, color: Colors.brand.gold, fontWeight: '700' },
  levelNumber: { fontSize: FontSize.xxxl, color: Colors.brand.gold, fontWeight: '900' },

  statsContainer: { gap: Spacing.sm, marginBottom: Spacing.md },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, width: 50 },
  statText: { fontSize: FontSize.xs, fontWeight: '700' },
  barBg: {
    flex: 1, height: 10, backgroundColor: Colors.bg.secondary,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  barFill: { height: '100%', borderRadius: BorderRadius.full },
  statValue: { fontSize: FontSize.xs, color: Colors.text.secondary, width: 65, textAlign: 'right' },

  statsGrid: { flexDirection: 'row', gap: Spacing.sm },
  statBox: {
    flex: 1, alignItems: 'center', gap: 4,
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md, padding: Spacing.sm,
  },
  statBoxValue: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  statBoxLabel: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '600' },

  sectionCard: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.xl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border.default,
    marginBottom: Spacing.lg,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  sectionTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text.primary },

  progressRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  progressBarBg: {
    flex: 1, height: 8, backgroundColor: Colors.bg.secondary,
    borderRadius: BorderRadius.full, overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%', backgroundColor: Colors.brand.emerald, borderRadius: BorderRadius.full,
  },
  progressText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: '600' },
  doneText: { fontSize: FontSize.sm, color: Colors.brand.emerald, fontStyle: 'italic', marginTop: Spacing.md },
  viewAllBtn: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto', gap: 2 },
  viewAllText: { fontSize: FontSize.xs, color: Colors.brand.violet, fontWeight: '600' },

  pendingList: { marginTop: Spacing.md, gap: Spacing.sm },
  pendingItem: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md,
    padding: Spacing.sm, gap: Spacing.sm,
  },
  typeIndicator: { width: 4, height: 28, borderRadius: 2 },
  pendingContent: { flex: 1 },
  pendingTitle: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary },
  pendingType: { fontSize: FontSize.xs, color: Colors.text.muted },
  pendingCheckBtn: { padding: 4 },
  pendingDeleteBtn: { padding: 4 },

  buffsRow: { flexDirection: 'row', gap: Spacing.sm, flexWrap: 'wrap' },
  buffBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 6, paddingHorizontal: 12,
    borderRadius: BorderRadius.full, borderWidth: 1,
    backgroundColor: Colors.bg.secondary,
  },
  buffName: { fontSize: FontSize.xs, fontWeight: '700' },
});
