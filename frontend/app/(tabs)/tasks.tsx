import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, ScrollView, StyleSheet, TouchableOpacity,
  TextInput, Alert, Modal, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore, Task } from '../../stores/taskStore';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import RewardToast, { RewardData } from '../../components/RewardToast';

// ══════════════════════════════════════════════════════════════════
// TASKS SCREEN — 3 tab: Habits | Dailies | To-Dos
// ══════════════════════════════════════════════════════════════════

type TabType = 'habit' | 'daily' | 'todo';

const TAB_CONFIG = {
  habit: { label: 'Thói Quen', icon: 'repeat' as const },
  daily: { label: 'Hàng Ngày', icon: 'today' as const },
  todo: { label: 'Việc Cần Làm', icon: 'checkmark-circle' as const },
};

const DIFFICULTY_COLORS: Record<string, string> = {
  trivial: '#94A3B8',
  easy: '#22C55E',
  medium: '#F59E0B',
  hard: '#EF4444',
};

export default function TasksScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('habit');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rewardToast, setRewardToast] = useState<RewardData | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const { habits, dailies, todos, isLoading, fetchTasks, scoreHabit, completeDaily, completeTodo, deleteTask, updateTask } = useTaskStore();
  const { refreshUser } = useAuthStore();

  useEffect(() => {
    fetchTasks();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchTasks();
    await refreshUser();
    setRefreshing(false);
  }, []);

  const tasks = activeTab === 'habit' ? habits : activeTab === 'daily' ? dailies : todos;

  // ── Xử lý score habit ─────────────────────────────────────
  const handleScoreHabit = async (id: number, direction: 'positive' | 'negative') => {
    try {
      const result = await scoreHabit(id, direction);
      // Hiển thị reward toast ngay lập tức
      setRewardToast({
        expEarned: result.expEarned,
        goldEarned: result.goldEarned,
        hpChange: direction === 'negative' ? -(result.hpLost || 2) : undefined,
        levelUp: result.levelUp,
        direction,
      });
      refreshUser();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  // ── Xử lý complete daily ──────────────────────────────────
  const handleCompleteDaily = async (id: number) => {
    try {
      const result = await completeDaily(id);
      setRewardToast({
        expEarned: result.expEarned,
        goldEarned: result.goldEarned,
        levelUp: result.levelUp,
      });
      refreshUser();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  // ── Xử lý complete todo ───────────────────────────────────
  const handleCompleteTodo = async (id: number) => {
    try {
      const result = await completeTodo(id);
      setRewardToast({
        expEarned: result.expEarned,
        goldEarned: result.goldEarned,
        levelUp: result.levelUp,
        multiplier: result.multiplier,
      });
      refreshUser();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  // ── Xử lý xóa task ───────────────────────────────────
  const handleDeleteTask = (task: Task) => {
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa "${task.title}"?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa', style: 'destructive',
          onPress: async () => {
            try { await deleteTask(task.id); }
            catch (err: any) { Alert.alert('Lỗi', err.message); }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Nhiệm Vụ</Text>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {(Object.entries(TAB_CONFIG) as [TabType, typeof TAB_CONFIG.habit][]).map(([key, config]) => (
          <TouchableOpacity
            key={key}
            style={[styles.tab, activeTab === key && styles.tabActive]}
            onPress={() => setActiveTab(key)}
          >
            <Ionicons name={config.icon} size={16} color={activeTab === key ? Colors.brand.violet : Colors.text.muted} />
            <Text style={[styles.tabText, activeTab === key && styles.tabTextActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Task List */}
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.brand.violet} />}
      >
        {tasks.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="add-circle-outline" size={48} color={Colors.text.muted} />
            <Text style={styles.emptyText}>Chưa có {TAB_CONFIG[activeTab].label.toLowerCase()}</Text>
            <Text style={styles.emptySubtext}>Bấm + để tạo mới</Text>
          </View>
        ) : (
          tasks.map(task => (
            <TouchableOpacity
              key={task.id}
              style={styles.taskCard}
              onPress={() => setEditingTask(task)}
              onLongPress={() => handleDeleteTask(task)}
              activeOpacity={0.7}
            >
              {/* Difficulty indicator */}
              <View style={[styles.difficultyDot, { backgroundColor: DIFFICULTY_COLORS[task.difficulty] }]} />

              {/* Task content */}
              <View style={styles.taskContent}>
                <Text style={[styles.taskTitle, task.is_done && styles.taskDone]}>
                  {task.title}
                </Text>
                {task.notes ? <Text style={styles.taskNotes}>{task.notes}</Text> : null}

                {/* Streak badge for dailies */}
                {activeTab === 'daily' && task.streak > 0 && (
                  <View style={styles.streakBadge}>
                    <Ionicons name="flame" size={12} color={Colors.brand.gold} />
                    <Text style={styles.streakText}>{task.streak} ngày</Text>
                  </View>
                )}

                {/* Due date for todos */}
                {activeTab === 'todo' && task.due_date ? (
                  <Text style={styles.dueDate}>
                    📅 {new Date(task.due_date).toLocaleDateString('vi-VN')}
                  </Text>
                ) : null}
              </View>

              {/* Action buttons */}
              <View style={styles.taskActions}>
                {activeTab === 'habit' && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.positiveBtn]}
                      onPress={() => handleScoreHabit(task.id, 'positive')}
                    >
                      <Ionicons name="add" size={20} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.negativeBtn]}
                      onPress={() => handleScoreHabit(task.id, 'negative')}
                    >
                      <Ionicons name="remove" size={20} color="#fff" />
                    </TouchableOpacity>
                  </>
                )}

                {activeTab === 'daily' && (
                  <TouchableOpacity
                    style={[styles.checkBtn, task.is_completed_today && styles.checkBtnDone]}
                    onPress={() => handleCompleteDaily(task.id)}
                    disabled={!!task.is_completed_today}
                  >
                    <Ionicons
                      name={task.is_completed_today ? 'checkmark-circle' : 'ellipse-outline'}
                      size={28}
                      color={task.is_completed_today ? Colors.brand.emerald : Colors.text.muted}
                    />
                  </TouchableOpacity>
                )}

                {activeTab === 'todo' && !task.is_done && (
                  <TouchableOpacity
                    style={styles.checkBtn}
                    onPress={() => handleCompleteTodo(task.id)}
                  >
                    <Ionicons name="ellipse-outline" size={28} color={Colors.text.muted} />
                  </TouchableOpacity>
                )}
                {activeTab === 'todo' && (task.is_done ? true : false) && (
                  <Ionicons name="checkmark-circle" size={28} color={Colors.brand.emerald} />
                )}

                {/* Nút xóa */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteTask(task)}
                >
                  <Ionicons name="trash-outline" size={18} color={Colors.text.muted} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* FAB — Tạo task mới */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowCreateModal(true)}
        activeOpacity={0.8}
      >
        <Ionicons name="add" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Create Modal */}
      <CreateTaskModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        defaultType={activeTab}
      />

      {/* Edit Modal */}
      {editingTask ? (
        <EditTaskModal
          task={editingTask}
          onClose={() => setEditingTask(null)}
        />
      ) : null}

      {/* Reward Toast */}
      <RewardToast reward={rewardToast} onDismiss={() => setRewardToast(null)} />
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// CREATE TASK MODAL
// ══════════════════════════════════════════════════════════════════

function CreateTaskModal({ visible, onClose, defaultType }: {
  visible: boolean; onClose: () => void; defaultType: TabType;
}) {
  const { createTask } = useTaskStore();
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [type, setType] = useState<TabType>(defaultType);
  const [difficulty, setDifficulty] = useState<'trivial' | 'easy' | 'medium' | 'hard'>('medium');

  useEffect(() => { setType(defaultType); }, [defaultType]);

  const handleCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề');
      return;
    }
    try {
      await createTask({ type, title: title.trim(), notes: notes.trim() || undefined, difficulty });
      setTitle('');
      setNotes('');
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const difficulties = ['trivial', 'easy', 'medium', 'hard'] as const;
  const diffLabels = { trivial: 'Rất dễ', easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Tạo Nhiệm Vụ Mới</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          {/* Type selector */}
          <View style={modalStyles.typeRow}>
            {(Object.entries(TAB_CONFIG) as [TabType, typeof TAB_CONFIG.habit][]).map(([key, config]) => (
              <TouchableOpacity
                key={key}
                style={[modalStyles.typeBtn, type === key && modalStyles.typeBtnActive]}
                onPress={() => setType(key)}
              >
                <Text style={[modalStyles.typeText, type === key && modalStyles.typeTextActive]}>
                  {config.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TextInput
            style={modalStyles.input}
            placeholder="Tiêu đề nhiệm vụ..."
            placeholderTextColor={Colors.text.muted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <TextInput
            style={[modalStyles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Ghi chú (tuỳ chọn)..."
            placeholderTextColor={Colors.text.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          {/* Difficulty selector */}
          <Text style={modalStyles.label}>Độ khó:</Text>
          <View style={modalStyles.diffRow}>
            {difficulties.map(d => (
              <TouchableOpacity
                key={d}
                style={[modalStyles.diffBtn, difficulty === d && { borderColor: DIFFICULTY_COLORS[d], backgroundColor: DIFFICULTY_COLORS[d] + '20' }]}
                onPress={() => setDifficulty(d)}
              >
                <View style={[modalStyles.diffDot, { backgroundColor: DIFFICULTY_COLORS[d] }]} />
                <Text style={[modalStyles.diffText, difficulty === d && { color: DIFFICULTY_COLORS[d] }]}>
                  {diffLabels[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={modalStyles.createBtn} onPress={handleCreate}>
            <Ionicons name="add-circle" size={20} color="#fff" />
            <Text style={modalStyles.createText}>Tạo Nhiệm Vụ</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ══════════════════════════════════════════════════════════════════
// EDIT TASK MODAL
// ══════════════════════════════════════════════════════════════════

function EditTaskModal({ task, onClose }: { task: Task; onClose: () => void }) {
  const { updateTask, deleteTask } = useTaskStore();
  const [title, setTitle] = useState(task.title);
  const [notes, setNotes] = useState(task.notes || '');
  const [difficulty, setDifficulty] = useState<'trivial' | 'easy' | 'medium' | 'hard'>(task.difficulty);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Tiêu đề không được để trống');
      return;
    }
    try {
      await updateTask(task.id, {
        title: title.trim(),
        notes: notes.trim() || undefined,
        difficulty,
      });
      onClose();
    } catch (err: any) {
      Alert.alert('Lỗi', err.message);
    }
  };

  const handleDelete = () => {
    Alert.alert('Xác nhận xóa', `Xóa "${task.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa', style: 'destructive',
        onPress: async () => {
          try {
            await deleteTask(task.id);
            onClose();
          } catch (err: any) {
            Alert.alert('Lỗi', err.message);
          }
        },
      },
    ]);
  };

  const difficulties = ['trivial', 'easy', 'medium', 'hard'] as const;
  const diffLabels = { trivial: 'Rất dễ', easy: 'Dễ', medium: 'Vừa', hard: 'Khó' };

  return (
    <Modal visible transparent animationType="slide">
      <View style={modalStyles.overlay}>
        <View style={modalStyles.container}>
          <View style={modalStyles.header}>
            <Text style={modalStyles.title}>Sửa Nhiệm Vụ</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={Colors.text.secondary} />
            </TouchableOpacity>
          </View>

          <TextInput
            style={modalStyles.input}
            placeholder="Tiêu đề nhiệm vụ..."
            placeholderTextColor={Colors.text.muted}
            value={title}
            onChangeText={setTitle}
            autoFocus
          />

          <TextInput
            style={[modalStyles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Ghi chú (tuỳ chọn)..."
            placeholderTextColor={Colors.text.muted}
            value={notes}
            onChangeText={setNotes}
            multiline
          />

          <Text style={modalStyles.label}>Độ khó:</Text>
          <View style={modalStyles.diffRow}>
            {difficulties.map(d => (
              <TouchableOpacity
                key={d}
                style={[modalStyles.diffBtn, difficulty === d && { borderColor: DIFFICULTY_COLORS[d], backgroundColor: DIFFICULTY_COLORS[d] + '20' }]}
                onPress={() => setDifficulty(d)}
              >
                <View style={[modalStyles.diffDot, { backgroundColor: DIFFICULTY_COLORS[d] }]} />
                <Text style={[modalStyles.diffText, difficulty === d && { color: DIFFICULTY_COLORS[d] }]}>
                  {diffLabels[d]}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <TouchableOpacity
              style={[modalStyles.createBtn, { flex: 1 }]}
              onPress={handleSave}
            >
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={modalStyles.createText}>Lưu</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[modalStyles.createBtn, { backgroundColor: Colors.brand.red, width: 52 }]}
              onPress={handleDelete}
            >
              <Ionicons name="trash" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: { paddingTop: 60, paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md },
  title: { fontSize: FontSize.xxl, fontWeight: '800', color: Colors.text.primary },

  tabBar: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    padding: 4, marginBottom: Spacing.md,
  },
  tab: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 4, paddingVertical: 10, borderRadius: BorderRadius.sm,
  },
  tabActive: { backgroundColor: Colors.bg.secondary },
  tabText: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '600' },
  tabTextActive: { color: Colors.brand.violet },

  list: { flex: 1 },
  listContent: { paddingHorizontal: Spacing.lg, paddingBottom: 100 },

  emptyState: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyText: { fontSize: FontSize.base, color: Colors.text.secondary, fontWeight: '600' },
  emptySubtext: { fontSize: FontSize.sm, color: Colors.text.muted },

  taskCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.lg,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  difficultyDot: { width: 4, height: 32, borderRadius: 2, marginRight: Spacing.md },
  taskContent: { flex: 1 },
  taskTitle: { fontSize: FontSize.base, fontWeight: '600', color: Colors.text.primary },
  taskDone: { textDecorationLine: 'line-through', color: Colors.text.muted },
  taskNotes: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 2 },
  streakBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4,
    backgroundColor: Colors.brand.gold + '20', paddingHorizontal: 8, paddingVertical: 2,
    borderRadius: BorderRadius.full, alignSelf: 'flex-start',
  },
  streakText: { fontSize: FontSize.xs, color: Colors.brand.gold, fontWeight: '700' },
  dueDate: { fontSize: FontSize.xs, color: Colors.text.muted, marginTop: 4 },

  taskActions: { flexDirection: 'row', gap: 6, marginLeft: Spacing.sm },
  actionBtn: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  positiveBtn: { backgroundColor: Colors.brand.emerald },
  negativeBtn: { backgroundColor: Colors.brand.red },
  checkBtn: { padding: 4 },
  checkBtnDone: { opacity: 0.6 },
  deleteBtn: { padding: 4, marginLeft: 2 },

  fab: {
    position: 'absolute', bottom: 90, right: Spacing.lg,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.brand.violet, alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.brand.violet, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5, shadowRadius: 12, elevation: 8,
  },
});

const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.bg.card, borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl, padding: Spacing.lg, paddingBottom: 40,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Spacing.lg },
  title: { fontSize: FontSize.lg, fontWeight: '700', color: Colors.text.primary },
  typeRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.md },
  typeBtn: {
    flex: 1, paddingVertical: 8, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.bg.secondary, alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: Colors.brand.violet + '30', borderWidth: 1, borderColor: Colors.brand.violet },
  typeText: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '600' },
  typeTextActive: { color: Colors.brand.violet },
  input: {
    backgroundColor: Colors.bg.secondary, borderRadius: BorderRadius.md,
    padding: Spacing.md, color: Colors.text.primary, fontSize: FontSize.base,
    marginBottom: Spacing.md, borderWidth: 1, borderColor: Colors.border.default,
  },
  label: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: '600', marginBottom: Spacing.sm },
  diffRow: { flexDirection: 'row', gap: Spacing.sm, marginBottom: Spacing.lg },
  diffBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, paddingVertical: 8, borderRadius: BorderRadius.sm,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  diffDot: { width: 8, height: 8, borderRadius: 4 },
  diffText: { fontSize: FontSize.xs, color: Colors.text.muted, fontWeight: '600' },
  createBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.md, height: 52,
  },
  createText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});
