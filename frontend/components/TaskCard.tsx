import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Task } from '../stores/taskStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../constants/theme';

interface TaskCardProps {
  task: Task;
  onPress?: () => void;
  onComplete?: () => void;
  done?: boolean;
}

const DIFFICULTY_COLORS = {
  easy:   { color: Colors.difficulty.easy,   icon: '⭐', label: 'Dễ'          },
  normal: { color: Colors.difficulty.normal, icon: '⚔️', label: 'Bình Thường' },
  hard:   { color: Colors.difficulty.hard,   icon: '🔥', label: 'Khó'         },
  epic:   { color: Colors.difficulty.epic,   icon: '💎', label: 'Epic'        },
};

const PRIORITY_COLORS = {
  low:    Colors.priority.low,
  medium: Colors.priority.medium,
  high:   Colors.priority.high,
};

export default function TaskCard({ task, onPress, onComplete, done }: TaskCardProps) {
  const diff = DIFFICULTY_COLORS[task.difficulty as keyof typeof DIFFICULTY_COLORS] || DIFFICULTY_COLORS.normal;
  const priorityColor = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || Colors.priority.medium;

  const deadlineTime = task.due_date ? new Date(new Date(task.due_date).getTime() + (task.duration_minutes ? parseInt(task.duration_minutes.toString()) : 0) * 60000) : null;
  const isOverdue = !done && deadlineTime && deadlineTime < new Date() && task.status === 'pending';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        done && styles.doneCard,
        isOverdue && styles.overdueCard,
        task.isOffline && styles.offlineCard,
      ]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      {/* Left border indicator (priority) */}
      <View style={[styles.priorityBar, { backgroundColor: priorityColor }]} />

      <View style={styles.content}>
        {/* Top row */}
        <View style={styles.topRow}>
          <Text style={[styles.title, done && styles.doneTitle]} numberOfLines={2}>
            {task.title}
          </Text>
          {!done && onComplete && (
            <TouchableOpacity onPress={onComplete} style={styles.checkBtn} activeOpacity={0.8}>
              <Ionicons name="checkmark-circle-outline" size={28} color={Colors.status.success} />
            </TouchableOpacity>
          )}
          {done && <Ionicons name="checkmark-circle" size={22} color={Colors.status.success} />}
        </View>

        {/* Description */}
        {task.description ? (
          <Text style={styles.desc} numberOfLines={1}>{task.description}</Text>
        ) : null}

        {/* Badges row */}
        <View style={styles.badgesRow}>
          {/* Difficulty */}
          <View style={[styles.badge, { backgroundColor: diff.color + '20', borderColor: diff.color + '50' }]}>
            <Text style={[styles.badgeText, { color: diff.color }]}>{diff.icon} {diff.label}</Text>
          </View>

          {/* EXP reward */}
          <View style={[styles.badge, { backgroundColor: Colors.rpg.expBg, borderColor: Colors.rpg.exp + '50' }]}>
            <Ionicons name="star" size={10} color={Colors.rpg.exp} />
            <Text style={[styles.badgeText, { color: Colors.rpg.exp }]}>+{task.exp_reward}</Text>
          </View>

          {/* AI badge */}
          {task.source === 'ai' && (
            <View style={[styles.badge, { backgroundColor: 'rgba(123,94,167,0.15)', borderColor: Colors.border.default }]}>
              <Ionicons name="sparkles" size={10} color={Colors.brand.violet} />
              <Text style={[styles.badgeText, { color: Colors.brand.violet }]}>AI</Text>
            </View>
          )}

          {/* Offline badge */}
          {task.isOffline && (
            <View style={[styles.badge, { backgroundColor: 'rgba(255,152,0,0.15)', borderColor: 'rgba(255,152,0,0.4)' }]}>
              <Ionicons name="cloud-offline-outline" size={10} color={Colors.status.warning} />
              <Text style={[styles.badgeText, { color: Colors.status.warning }]}>Offline</Text>
            </View>
          )}

        </View>

        {/* Due date */}
        {deadlineTime && (
          <View style={styles.dueRow}>
            <Ionicons
              name="calendar-outline"
              size={12}
              color={isOverdue ? Colors.status.error : Colors.text.muted}
            />
            <Text style={[styles.dueText, isOverdue && { color: Colors.status.error }]}>
              Hết giờ: {deadlineTime.toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
              {isOverdue ? '  ⚠️ Quá hạn' : ''}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.lg,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border.default,
    overflow: 'hidden',
  },
  doneCard: { opacity: 0.6 },
  overdueCard: { borderColor: 'rgba(244, 67, 54, 0.4)' },
  offlineCard: { borderStyle: 'dashed' },
  priorityBar: { width: 4 },
  content: { flex: 1, padding: Spacing.md, gap: 6 },
  topRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 },
  title: { flex: 1, fontSize: FontSize.base, fontWeight: '700', color: Colors.text.primary },
  doneTitle: { textDecorationLine: 'line-through', color: Colors.text.muted },
  checkBtn: { padding: 2 },
  desc: { fontSize: FontSize.sm, color: Colors.text.secondary },
  badgesRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  badge: {
    flexDirection: 'row', alignItems: 'center', gap: 3,
    paddingVertical: 2, paddingHorizontal: 6,
    borderRadius: BorderRadius.full, borderWidth: 1, borderColor: Colors.border.default,
    backgroundColor: Colors.bg.secondary,
  },
  badgeText: { fontSize: 10, fontWeight: '700', color: Colors.text.muted },
  dueRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dueText: { fontSize: FontSize.xs, color: Colors.text.muted },
});
