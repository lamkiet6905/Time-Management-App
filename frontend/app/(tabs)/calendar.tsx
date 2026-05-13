import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTaskStore } from '../../stores/taskStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';
import TaskCard from '../../components/TaskCard';

const WEEKDAYS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
const MONTHS = ['Tháng 1','Tháng 2','Tháng 3','Tháng 4','Tháng 5','Tháng 6',
  'Tháng 7','Tháng 8','Tháng 9','Tháng 10','Tháng 11','Tháng 12'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}
function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getLocalDateString(dateStr: string) {
  const d = new Date(dateStr);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

export default function CalendarScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { tasks, fetchTasks, completeTask } = useTaskStore();

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(now.toISOString().slice(0, 10));

  useEffect(() => {
    // Fetch tasks for entire month view
    const start = toDateStr(viewYear, viewMonth, 1);
    const lastDay = getDaysInMonth(viewYear, viewMonth);
    const end = toDateStr(viewYear, viewMonth, lastDay);
    fetchTasks({ start_date: start, end_date: end });
  }, [viewYear, viewMonth]);

  // Map task dates for dot markers
  const taskDotMap: Record<string, { hasPending: boolean; hasDone: boolean; hasFailed: boolean }> = {};
  tasks.forEach(t => {
    if (!t.due_date) return;
    
    const startDate = new Date(t.due_date);
    const durationDays = Math.max(0, Math.ceil((t.duration_minutes || 0) / 1440) - 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    
    let current = new Date(startDate);
    current.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    
    while (current <= end) {
      const d = getLocalDateString(current.toISOString());
      if (!taskDotMap[d]) taskDotMap[d] = { hasPending: false, hasDone: false, hasFailed: false };
      if (t.status === 'pending') taskDotMap[d].hasPending = true;
      else if (t.status === 'done') taskDotMap[d].hasDone = true;
      else taskDotMap[d].hasFailed = true;
      current.setDate(current.getDate() + 1);
    }
  });

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);
  const today = now.toISOString().slice(0, 10);

  // Generate calendar grid (blanks + days)
  const cells: (number | null)[] = Array(firstDay).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  };

  const selectedTasks = tasks.filter(t => {
    if (!t.due_date) return false;
    const startDate = new Date(t.due_date);
    const durationDays = Math.max(0, Math.ceil((t.duration_minutes || 0) / 1440) - 1);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + durationDays);
    
    const selectedD = new Date(selectedDate);
    selectedD.setHours(12, 0, 0, 0);
    
    const startD = new Date(startDate);
    startD.setHours(0, 0, 0, 0);
    const endD = new Date(endDate);
    endD.setHours(23, 59, 59, 999);
    
    return selectedD >= startD && selectedD <= endD;
  });

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📅 Lịch Task</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/task/create')} activeOpacity={0.8}>
          <Ionicons name="add" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Month navigator */}
        <View style={styles.monthNav}>
          <TouchableOpacity onPress={prevMonth} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={Colors.brand.violet} />
          </TouchableOpacity>
          <Text style={styles.monthTitle}>{MONTHS[viewMonth]} {viewYear}</Text>
          <TouchableOpacity onPress={nextMonth} style={styles.navBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={22} color={Colors.brand.violet} />
          </TouchableOpacity>
        </View>

        {/* Calendar grid */}
        <View style={styles.calendarCard}>
          {/* Weekday labels */}
          <View style={styles.weekRow}>
            {WEEKDAYS.map(w => (
              <Text key={w} style={[styles.weekLabel, w === 'CN' && { color: Colors.status.error }]}>{w}</Text>
            ))}
          </View>

          {/* Days grid */}
          {Array.from({ length: cells.length / 7 }, (_, row) => (
            <View key={row} style={styles.weekRow}>
              {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                if (!day) return <View key={col} style={styles.dayCell} />;
                const dateStr = toDateStr(viewYear, viewMonth, day);
                const dots = taskDotMap[dateStr];
                const isSelected = dateStr === selectedDate;
                const isToday = dateStr === today;
                return (
                  <TouchableOpacity
                    key={col}
                    style={[styles.dayCell, isSelected && styles.dayCellSelected, isToday && !isSelected && styles.dayCellToday]}
                    onPress={() => setSelectedDate(dateStr)}
                    activeOpacity={0.7}
                  >
                    <Text style={[
                      styles.dayText,
                      isSelected && styles.dayTextSelected,
                      isToday && !isSelected && { color: Colors.brand.violet, fontWeight: '800' },
                      col === 0 && !isSelected && { color: Colors.status.error },
                    ]}>
                      {day}
                    </Text>
                    {/* Task dots */}
                    {dots && (
                      <View style={styles.dotsRow}>
                        {dots.hasPending && <View style={[styles.dot, { backgroundColor: Colors.brand.violet }]} />}
                        {dots.hasDone && <View style={[styles.dot, { backgroundColor: Colors.status.success }]} />}
                        {dots.hasFailed && <View style={[styles.dot, { backgroundColor: Colors.status.error }]} />}
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>

        {/* Legend */}
        <View style={styles.legend}>
          {[
            { color: Colors.brand.violet, label: 'Đang chờ' },
            { color: Colors.status.success, label: 'Hoàn thành' },
            { color: Colors.status.error, label: 'Thất bại' },
          ].map(l => (
            <View key={l.label} style={styles.legendItem}>
              <View style={[styles.dot, { backgroundColor: l.color }]} />
              <Text style={styles.legendText}>{l.label}</Text>
            </View>
          ))}
        </View>

        {/* Task list for selected date */}
        <View style={styles.taskSection}>
          <Text style={styles.selectedDateLabel}>
            {new Date(selectedDate + 'T00:00:00').toLocaleDateString('vi-VN', {
              weekday: 'long', day: 'numeric', month: 'long',
            })}
          </Text>

          {selectedTasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={36} color={Colors.text.muted} />
              <Text style={styles.emptyText}>Không có task nào</Text>
              <TouchableOpacity onPress={() => router.push('/task/create')} style={styles.emptyAddBtn} activeOpacity={0.8}>
                <Text style={styles.emptyAddBtnText}>+ Thêm task</Text>
              </TouchableOpacity>
            </View>
          ) : (
            selectedTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onPress={() => router.push(`/task/${task.id}`)}
                onComplete={task.status === 'pending' ? () => completeTask(task.id) : undefined}
                done={task.status === 'done'}
              />
            ))
          )}
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.md,
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  addBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: Colors.brand.violet, alignItems: 'center', justifyContent: 'center',
  },
  monthNav: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: Spacing.md, marginBottom: Spacing.sm },
  navBtn: { padding: 6 },
  monthTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  calendarCard: {
    marginHorizontal: Spacing.md, backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.border.default,
    padding: Spacing.sm, marginBottom: Spacing.sm,
  },
  weekRow: { flexDirection: 'row' },
  weekLabel: {
    flex: 1, textAlign: 'center', fontSize: FontSize.xs, fontWeight: '700',
    color: Colors.text.muted, paddingVertical: 6,
  },
  dayCell: {
    flex: 1, height: 44, alignItems: 'center', justifyContent: 'center',
    borderRadius: 8, gap: 2,
  },
  dayCellSelected: { backgroundColor: Colors.brand.violet },
  dayCellToday: { borderWidth: 1.5, borderColor: Colors.brand.violet },
  dayText: { fontSize: FontSize.sm, fontWeight: '600', color: Colors.text.primary },
  dayTextSelected: { color: '#fff', fontWeight: '800' },
  dotsRow: { flexDirection: 'row', gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: Spacing.md, marginBottom: Spacing.md },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  legendText: { fontSize: FontSize.xs, color: Colors.text.muted },
  taskSection: { paddingHorizontal: Spacing.md },
  selectedDateLabel: {
    fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.secondary,
    marginBottom: Spacing.sm, textTransform: 'capitalize',
  },
  emptyState: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 8 },
  emptyText: { fontSize: FontSize.base, color: Colors.text.muted },
  emptyAddBtn: {
    backgroundColor: Colors.brand.violet, borderRadius: BorderRadius.full,
    paddingVertical: 8, paddingHorizontal: 20, marginTop: 4,
  },
  emptyAddBtnText: { color: '#fff', fontWeight: '700', fontSize: FontSize.sm },
});
