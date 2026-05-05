import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  RefreshControl, Image, Modal, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '../../stores/authStore';
import { useTaskStore } from '../../stores/taskStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import HPBar from '../../components/HPBar';
import EXPBar from '../../components/EXPBar';
import TaskCard from '../../components/TaskCard';
import OfflineBanner from '../../components/OfflineBanner';

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { tasks, fetchTasks, completeTask, unsyncedCount, syncOfflineTasks } = useTaskStore();
  const [refreshing, setRefreshing] = useState(false);
  const [completionResult, setCompletionResult] = useState<any>(null);

  const today = new Date().toISOString().slice(0, 10);

  const loadData = useCallback(async () => {
    await fetchTasks({ date: today });
  }, [today]);

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleCompleteTask = async (taskId: string) => {
    try {
      const result = await completeTask(taskId);
      setCompletionResult(result);
      if (result.level_up?.leveled_up) {
        setTimeout(() => {
          setCompletionResult(null);
          router.push('/level-up');
        }, 2000);
      } else {
        setTimeout(() => setCompletionResult(null), 3000);
      }
    } catch (err: any) {
      console.error(err);
    }
  };

  const todayDateObj = new Date();
  todayDateObj.setHours(23, 59, 59, 999);

  const pendingTasks = tasks.filter(t => {
    if (t.status !== 'pending') return false;
    if (!t.due_date) return true;
    return new Date(t.due_date) <= todayDateObj;
  });
  const doneTasks = tasks.filter(t => {
    if (t.status !== 'done') return false;
    if (!t.completed_at) return true;
    return new Date(t.completed_at).toISOString().slice(0, 10) === today;
  });

  const greetingTime = () => {
    const h = new Date().getHours();
    if (h < 12) return '🌅 Buổi sáng';
    if (h < 18) return '☀️ Buổi chiều';
    return '🌙 Buổi tối';
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <OfflineBanner unsyncedCount={unsyncedCount} onSync={syncOfflineTasks} />

      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.violet} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Header / Profile summary */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{greetingTime()}</Text>
            <Text style={styles.username}>{user?.display_name || user?.username}</Text>
          </View>
          <TouchableOpacity onPress={() => router.push('/profile')} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              {user?.avatar_url ? (
                <Image source={{ uri: user.avatar_url }} style={styles.avatarImg} />
              ) : (
                <Ionicons name="person" size={28} color={Colors.brand.violet} />
              )}
              <View style={styles.levelBadge}>
                <Text style={styles.levelBadgeText}>{user?.level}</Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* RPG Stats */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.rpg.hpBg }]}>
                <Ionicons name="heart" size={16} color={Colors.rpg.hp} />
              </View>
              <Text style={styles.statLabel}>HP</Text>
              <Text style={[styles.statValue, { color: Colors.rpg.hp }]}>
                {user?.hp}/{user?.max_hp}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: Colors.rpg.expBg }]}>
                <Ionicons name="star" size={16} color={Colors.rpg.exp} />
              </View>
              <Text style={styles.statLabel}>EXP</Text>
              <Text style={[styles.statValue, { color: Colors.rpg.exp }]}>
                {user?.exp}/{user?.exp_to_next}
              </Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={[styles.statIconBg, { backgroundColor: 'rgba(255, 107, 53, 0.2)' }]}>
                <Ionicons name="flame" size={16} color={Colors.rpg.streak} />
              </View>
              <Text style={styles.statLabel}>Streak</Text>
              <Text style={[styles.statValue, { color: Colors.rpg.streak }]}>
                {user?.streak_days} ngày
              </Text>
            </View>
          </View>

          <View style={styles.barsContainer}>
            <HPBar current={user?.hp || 0} max={user?.max_hp || 100} />
            <EXPBar current={user?.exp || 0} max={user?.exp_to_next || 100} level={user?.level || 1} />
          </View>
        </View>

        {/* Today's tasks header */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Hôm Nay – {pendingTasks.length} task chờ</Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => router.push('/task/create')}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.addBtnText}>Thêm</Text>
          </TouchableOpacity>
        </View>

        {/* Pending Tasks */}
        {pendingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle" size={52} color={Colors.status.success} />
            <Text style={styles.emptyTitle}>Tuyệt vời! 🎉</Text>
            <Text style={styles.emptySubtitle}>Bạn đã hoàn thành tất cả task hôm nay</Text>
          </View>
        ) : (
          pendingTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={() => handleCompleteTask(task.id)}
              onPress={() => router.push(`/task/${task.id}`)}
            />
          ))
        )}

        {/* Done tasks */}
        {doneTasks.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { marginHorizontal: Spacing.md, marginTop: Spacing.lg, opacity: 0.6 }]}>
              ✅ Đã hoàn thành ({doneTasks.length})
            </Text>
            {doneTasks.map(task => (
              <TaskCard key={task.id} task={task} done />
            ))}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Completion result modal */}
      {completionResult && (
        <View style={styles.completionOverlay}>
          <View style={styles.completionCard}>
            <Text style={styles.completionEmoji}>⚔️</Text>
            <Text style={styles.completionTitle}>Task Hoàn Thành!</Text>
            <Text style={styles.completionExp}>+{completionResult.exp_gained} EXP</Text>
            {completionResult.level_up?.leveled_up && (
              <Text style={styles.completionLevel}>🌟 LEVEL UP! → {completionResult.level_up.new_level}</Text>
            )}
            {completionResult.new_achievements?.length > 0 && (
              <Text style={styles.completionAchieve}>🏆 Thành tựu mới!</Text>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerLeft: {},
  greeting: { fontSize: FontSize.sm, color: Colors.text.muted },
  username: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary, marginTop: 2 },
  avatarCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.border.bright,
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImg: { width: 52, height: 52, borderRadius: 26 },
  levelBadge: {
    position: 'absolute', bottom: -4, right: -4,
    backgroundColor: Colors.rpg.level, borderRadius: 10, paddingHorizontal: 5, paddingVertical: 1,
  },
  levelBadgeText: { fontSize: 9, fontWeight: '800', color: '#000' },
  statsCard: {
    marginHorizontal: Spacing.md, marginBottom: Spacing.md,
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.md,
  },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: Spacing.md },
  statItem: { alignItems: 'center', gap: 4 },
  statIconBg: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  statLabel: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '600' },
  statValue: { fontSize: FontSize.sm, fontWeight: '800' },
  statDivider: { width: 1, backgroundColor: Colors.border.default },
  barsContainer: { gap: 8 },
  sectionHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, marginBottom: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.base, fontWeight: '700', color: Colors.text.primary },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.full,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  addBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: '700' },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: 8 },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  emptySubtitle: { fontSize: FontSize.sm, color: Colors.text.secondary, textAlign: 'center' },
  completionOverlay: {
    position: 'absolute', top: 0, bottom: 0, left: 0, right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  completionCard: {
    backgroundColor: Colors.bg.elevated, borderRadius: BorderRadius.xl,
    padding: Spacing.xl, alignItems: 'center', gap: 8,
    borderWidth: 2, borderColor: Colors.border.gold, minWidth: 200,
  },
  completionEmoji: { fontSize: 40 },
  completionTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  completionExp: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.rpg.exp },
  completionLevel: { fontSize: FontSize.md, fontWeight: '800', color: Colors.rpg.level },
  completionAchieve: { fontSize: FontSize.base, color: Colors.rpg.gold },
});
