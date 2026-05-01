import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '../../stores/taskStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const DIFFICULTY_INFO = {
  easy:   { label: 'Dễ',          color: Colors.difficulty.easy,   icon: '⭐', exp: 20,  penalty: 5  },
  normal: { label: 'Bình Thường', color: Colors.difficulty.normal, icon: '⚔️', exp: 50,  penalty: 10 },
  hard:   { label: 'Khó',         color: Colors.difficulty.hard,   icon: '🔥', exp: 100, penalty: 20 },
  epic:   { label: 'Epic',        color: Colors.difficulty.epic,   icon: '💎', exp: 200, penalty: 35 },
};

const STATUS_INFO = {
  pending: { label: 'Đang chờ',  color: Colors.brand.violet },
  done:    { label: 'Hoàn thành', color: Colors.status.success },
  failed:  { label: 'Thất bại',  color: Colors.status.error },
  skipped: { label: 'Bỏ qua',    color: Colors.text.muted },
};

export default function TaskDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { tasks, updateTask, deleteTask, completeTask } = useTaskStore();

  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  const task = tasks.find(t => t.id === id);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
    }
  }, [task]);

  if (!task) {
    return (
      <View style={[styles.container, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <Text style={{ color: Colors.text.muted }}>Task không tồn tại</Text>
      </View>
    );
  }

  const diffInfo = DIFFICULTY_INFO[task.difficulty as keyof typeof DIFFICULTY_INFO] || DIFFICULTY_INFO.normal;
  const statusInfo = STATUS_INFO[task.status as keyof typeof STATUS_INFO] || STATUS_INFO.pending;

  const handleSave = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await updateTask(task.id, { title: title.trim(), description: description.trim() });
      setEditing(false);
    } catch { Alert.alert('Lỗi', 'Không thể cập nhật task'); }
    finally { setSaving(false); }
  };

  const handleDelete = () => {
    Alert.alert('Xóa Task', `Bạn chắc chắn muốn xóa "${task.title}"?`, [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Xóa', style: 'destructive', onPress: async () => {
        await deleteTask(task.id);
        router.back();
      }},
    ]);
  };

  const handleComplete = async () => {
    const result = await completeTask(task.id);
    router.back();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi Tiết Task</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {task.status === 'pending' && (
            <TouchableOpacity onPress={() => setEditing(!editing)} style={styles.iconBtn}>
              <Ionicons name={editing ? 'close' : 'create-outline'} size={20} color={Colors.text.primary} />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleDelete} style={styles.iconBtn}>
            <Ionicons name="trash-outline" size={20} color={Colors.status.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Status badge */}
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '25', borderColor: statusInfo.color + '60' }]}>
          <View style={[styles.statusDot, { backgroundColor: statusInfo.color }]} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>

        {/* Title */}
        {editing ? (
          <TextInput
            style={styles.titleInput}
            value={title}
            onChangeText={setTitle}
            placeholder="Tiêu đề task"
            placeholderTextColor={Colors.text.muted}
            autoFocus
          />
        ) : (
          <Text style={styles.title}>{task.title}</Text>
        )}

        {/* AI badge */}
        {task.source === 'ai' && (
          <View style={styles.aiBadge}>
            <Ionicons name="sparkles" size={12} color={Colors.brand.violet} />
            <Text style={styles.aiBadgeText}>Tạo bởi AI</Text>
          </View>
        )}

        {/* Description */}
        {editing ? (
          <TextInput
            style={styles.descInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Mô tả..."
            placeholderTextColor={Colors.text.muted}
            multiline
            textAlignVertical="top"
          />
        ) : task.description ? (
          <Text style={styles.description}>{task.description}</Text>
        ) : null}

        {/* Info grid */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Độ Khó</Text>
            <Text style={[styles.infoValue, { color: diffInfo.color }]}>
              {diffInfo.icon} {diffInfo.label}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>EXP Thưởng</Text>
            <Text style={[styles.infoValue, { color: Colors.rpg.exp }]}>+{task.exp_reward} EXP</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>HP Phạt</Text>
            <Text style={[styles.infoValue, { color: Colors.rpg.hp }]}>-{task.hp_penalty} HP</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoLabel}>Ưu Tiên</Text>
            <Text style={styles.infoValue}>{task.priority}</Text>
          </View>
          {task.due_date && (
            <View style={[styles.infoCard, { flex: 2 }]}>
              <Text style={styles.infoLabel}>Deadline</Text>
              <Text style={styles.infoValue}>
                {new Date(task.due_date).toLocaleString('vi-VN')}
              </Text>
            </View>
          )}
          {task.duration_minutes && (
            <View style={styles.infoCard}>
              <Text style={styles.infoLabel}>Thời Lượng</Text>
              <Text style={styles.infoValue}>{task.duration_minutes} phút</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {task.tags && task.tags.length > 0 && (
          <View style={styles.tagsRow}>
            {task.tags.map((tag: string) => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        )}

        {/* AI raw input */}
        {task.ai_raw_input && (
          <View style={styles.rawInput}>
            <Text style={styles.rawInputLabel}>Câu nhập AI gốc:</Text>
            <Text style={styles.rawInputText}>"{task.ai_raw_input}"</Text>
          </View>
        )}

        {/* Action buttons */}
        {editing ? (
          <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
            {saving ? <ActivityIndicator color="#fff" /> : (
              <>
                <Ionicons name="checkmark" size={20} color="#fff" />
                <Text style={styles.saveBtnText}>Lưu thay đổi</Text>
              </>
            )}
          </TouchableOpacity>
        ) : task.status === 'pending' ? (
          <TouchableOpacity style={styles.completeBtn} onPress={handleComplete} activeOpacity={0.85}>
            <Ionicons name="checkmark-circle" size={22} color="#fff" />
            <Text style={styles.completeBtnText}>✅ Hoàn Thành +{task.exp_reward} EXP</Text>
          </TouchableOpacity>
        ) : null}
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
  iconBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.bg.card, alignItems: 'center', justifyContent: 'center',
  },
  content: { padding: Spacing.md, gap: Spacing.md },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    alignSelf: 'flex-start', paddingVertical: 4, paddingHorizontal: 10,
    borderRadius: BorderRadius.full, borderWidth: 1,
  },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: FontSize.xs, fontWeight: '700' },
  title: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  titleInput: {
    fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary,
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.bright, padding: Spacing.sm,
  },
  aiBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', backgroundColor: 'rgba(123, 94, 167, 0.15)',
    paddingVertical: 3, paddingHorizontal: 8, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.border.default,
  },
  aiBadgeText: { fontSize: FontSize.xs, color: Colors.brand.violet, fontWeight: '600' },
  description: { fontSize: FontSize.base, color: Colors.text.secondary, lineHeight: 22 },
  descInput: {
    fontSize: FontSize.base, color: Colors.text.primary, lineHeight: 22,
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.default, padding: Spacing.sm, minHeight: 80,
  },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  infoCard: {
    flex: 1, minWidth: 100, backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border.default,
  },
  infoLabel: { fontSize: FontSize.xs, color: Colors.text.muted, marginBottom: 3, fontWeight: '600' },
  infoValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.primary },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  tag: {
    backgroundColor: Colors.bg.elevated, borderRadius: BorderRadius.full,
    paddingVertical: 4, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border.default,
  },
  tagText: { fontSize: FontSize.xs, color: Colors.text.secondary },
  rawInput: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    padding: Spacing.sm, borderWidth: 1, borderColor: Colors.border.default,
    borderLeftWidth: 3, borderLeftColor: Colors.brand.violet,
  },
  rawInputLabel: { fontSize: FontSize.xs, color: Colors.text.muted, marginBottom: 3 },
  rawInputText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontStyle: 'italic' },
  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.status.success, borderRadius: BorderRadius.md, height: 54,
    shadowColor: Colors.status.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  completeBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '800' },
  saveBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.md, height: 52,
  },
  saveBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});
