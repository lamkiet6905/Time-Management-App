import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity,
  Switch, Platform, KeyboardAvoidingView, ActivityIndicator, Animated, Alert, Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTaskStore } from '../../stores/taskStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

const PRIORITIES = [
  { value: 'low', label: 'Thấp', color: Colors.priority.low, icon: 'arrow-down' },
  { value: 'medium', label: 'Vừa', color: Colors.priority.medium, icon: 'remove' },
  { value: 'high', label: 'Cao', color: Colors.priority.high, icon: 'arrow-up' },
];

const DIFFICULTIES = [
  { value: 'easy', label: 'Dễ', color: Colors.difficulty.easy, exp: 20, icon: '⭐' },
  { value: 'normal', label: 'Bình Thường', color: Colors.difficulty.normal, exp: 50, icon: '⚔️' },
  { value: 'hard', label: 'Khó', color: Colors.difficulty.hard, exp: 100, icon: '🔥' },
  { value: 'epic', label: 'Epic', color: Colors.difficulty.epic, exp: 200, icon: '💎' },
];

export default function CreateTaskScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { createTask, aiParseTask } = useTaskStore();

  const [useAI, setUseAI] = useState(false);
  const [aiText, setAiText] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [dueTime, setDueTime] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDate, setShowDate] = useState(false);
  const [showTime, setShowTime] = useState(false);
  const [taskMissingDate, setTaskMissingDate] = useState<any>(null);
  const [taskMissingDuration, setTaskMissingDuration] = useState<any>(null);
  const [missingDurationInput, setMissingDurationInput] = useState('');

  const handleMissingDurationSubmit = async () => {
     if (!missingDurationInput || isNaN(parseInt(missingDurationInput)) || parseInt(missingDurationInput) <= 0) {
        Alert.alert('Lỗi', 'Vui lòng nhập số phút hợp lệ');
        return;
     }
     await useTaskStore.getState().updateTask(taskMissingDuration.id, { duration_minutes: parseInt(missingDurationInput) });
     Alert.alert('Thành công', 'Đã lưu task đầy đủ thông tin!');
     setTaskMissingDuration(null);
     router.back();
  };

  const onChangeDate = async (event: any, selectedDate?: Date) => {
    setShowDate(false);
    if (selectedDate) {
      setDate(selectedDate);
      const yyyy = selectedDate.getFullYear();
      const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const dd = String(selectedDate.getDate()).padStart(2, '0');
      
      if (taskMissingDate) {
        const finalDate = `${yyyy}-${mm}-${dd}T23:59:00+07:00`;
        await useTaskStore.getState().updateTask(taskMissingDate.id, { due_date: finalDate });
        
        if (!taskMissingDate.duration_minutes) {
           Alert.alert('Thông báo', 'Vui lòng bổ sung thêm thời lượng cho task!');
           setTaskMissingDuration(taskMissingDate);
           setTaskMissingDate(null);
           return;
        }
        
        Alert.alert('Thành công', 'Đã cập nhật deadline!');
        router.back();
        return;
      }
      setDueDate(`${yyyy}-${mm}-${dd}`);
    } else {
      if (taskMissingDate) {
        Alert.alert('Bắt buộc', 'Task chưa có deadline. Vui lòng chọn ngày!', [{ text: 'OK', onPress: () => setShowDate(true) }]);
      }
    }
  };

  const onChangeTime = (event: any, selectedDate?: Date) => {
    setShowTime(false);
    if (selectedDate) {
      setDate(selectedDate);
      const hh = String(selectedDate.getHours()).padStart(2, '0');
      const min = String(selectedDate.getMinutes()).padStart(2, '0');
      setDueTime(`${hh}:${min}`);
    }
  };

  const [priority, setPriority] = useState('medium');
  const [difficulty, setDifficulty] = useState('');
  const [tags, setTags] = useState('');
  const [duration, setDuration] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAiParse = async () => {
    if (!aiText.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    try {
      const { task, aiAvailable } = await aiParseTask(aiText.trim());
      
      if (!task.due_date) {
        setTaskMissingDate(task);
        setShowDate(true);
        return; // Don't go back, wait for user to pick date
      }
      if (!task.duration_minutes) {
        Alert.alert('Thông báo', 'AI không tìm thấy thời lượng. Vui lòng nhập thời lượng!');
        setTaskMissingDuration(task);
        return;
      }

      if (!aiAvailable) {
        setAiResult('⚠️ AI chưa được cấu hình. Task đã được tạo với thông tin cơ bản.');
      } else {
        setAiResult('✅ AI đã phân tích và tạo task thành công!');
      }
      setTimeout(() => { router.back(); }, 1500);
    } catch (err: any) {
      setAiResult('❌ Lỗi: ' + (err.response?.data?.message || err.message));
    } finally {
      setAiLoading(false);
    }
  };

  const handleManualCreate = async () => {
    if (!title.trim()) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập tiêu đề task');
      return;
    }
    if (!dueDate) {
      Alert.alert('Thiếu thông tin', 'Vui lòng chọn ngày bắt đầu (Ngày) cho task');
      return;
    }
    if (!duration || isNaN(parseInt(duration)) || parseInt(duration) <= 0) {
      Alert.alert('Thiếu thông tin', 'Vui lòng nhập thời lượng (phút) hợp lệ cho task');
      return;
    }
    setIsLoading(true);
    try {
      let finalDueDate = dueDate;
      if (dueTime && !dueDate) {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        finalDueDate = `${yyyy}-${mm}-${dd}`;
      }

      let due_date: string | undefined;
      if (finalDueDate) {
        const dateStr = dueTime ? `${finalDueDate}T${dueTime}:00+07:00` : `${finalDueDate}T23:59:00+07:00`;
        due_date = dateStr;
      }

      await createTask({
        title: title.trim(),
        description: description.trim() || undefined,
        due_date,
        priority: priority as any,
        difficulty: difficulty as any || undefined,
        tags: tags.split(',').map(t => t.trim()).filter(Boolean),
        duration_minutes: duration ? parseInt(duration) : undefined,
        source: 'manual',
        exp_reward: DIFFICULTIES.find(d => d.value === difficulty)?.exp || 50,
        hp_penalty: 10,
      });
      router.back();
    } catch (err: any) {
      Alert.alert('Lỗi', err.response?.data?.message || 'Không thể tạo task');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={Colors.text.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Thêm Task</Text>
        <View style={{ width: 36 }} />
      </View>

      {/* Mode toggle */}
      <View style={styles.modeToggle}>
        <TouchableOpacity
          style={[styles.modeBtn, !useAI && styles.modeBtnActive]}
          onPress={() => setUseAI(false)}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={16} color={!useAI ? '#fff' : Colors.text.muted} />
          <Text style={[styles.modeBtnText, !useAI && styles.modeBtnTextActive]}>Thủ Công</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.modeBtn, useAI && styles.modeBtnActive, useAI && { backgroundColor: '#7B5EA7' }]}
          onPress={() => setUseAI(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="sparkles" size={16} color={useAI ? '#fff' : Colors.text.muted} />
          <Text style={[styles.modeBtnText, useAI && styles.modeBtnTextActive]}>AI Nhập Liệu</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {useAI ? (
          /* AI Input mode */
          <View style={styles.aiSection}>
            <View style={styles.aiHeader}>
              <Ionicons name="sparkles" size={24} color={Colors.brand.violet} />
              <Text style={styles.aiTitle}>AI Nhập Liệu Thông Minh</Text>
            </View>
            <Text style={styles.aiSubtitle}>
              Nhập tự nhiên như bạn đang ghi chú. AI sẽ tự động phân tích và tạo task.
            </Text>
            <View style={styles.aiExamples}>
              {[
                '"Ngày mai 8 giờ đá bóng 2 tiếng"',
                '"Thứ 6 tuần sau nộp báo cáo dự án"',
                '"Mỗi ngày 30 phút học tiếng Anh"',
              ].map(ex => (
                <TouchableOpacity key={ex} onPress={() => setAiText(ex.replace(/"/g, ''))} activeOpacity={0.7}>
                  <Text style={styles.aiExample}>{ex}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              style={styles.aiInput}
              placeholder="Nhập mô tả task theo ngôn ngữ tự nhiên..."
              placeholderTextColor={Colors.text.muted}
              value={aiText}
              onChangeText={setAiText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {aiResult ? (
              <View style={[styles.aiResultBox, aiResult.startsWith('✅') ? styles.aiSuccess : styles.aiWarning]}>
                <Text style={styles.aiResultText}>{aiResult}</Text>
              </View>
            ) : null}

            <TouchableOpacity
              style={[styles.submitBtn, { backgroundColor: Colors.brand.violet }]}
              onPress={handleAiParse}
              disabled={aiLoading || !aiText.trim()}
              activeOpacity={0.85}
            >
              {aiLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="sparkles" size={18} color="#fff" />
                  <Text style={styles.submitBtnText}>Phân Tích & Tạo Task</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        ) : (
          /* Manual mode */
          <View style={styles.manualSection}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiêu đề *</Text>
              <TextInput
                style={styles.input}
                placeholder="Tên task..."
                placeholderTextColor={Colors.text.muted}
                value={title}
                onChangeText={setTitle}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mô tả</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Mô tả thêm..."
                placeholderTextColor={Colors.text.muted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Ngày</Text>
                <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowDate(true)}>
                  <Text style={{ color: dueDate ? Colors.text.primary : Colors.text.muted }}>
                    {dueDate || 'Chọn ngày'}
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Giờ</Text>
                <TouchableOpacity style={[styles.input, { justifyContent: 'center' }]} onPress={() => setShowTime(true)}>
                  <Text style={{ color: dueTime ? Colors.text.primary : Colors.text.muted }}>
                    {dueTime || 'Chọn giờ'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {showDate && (
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onChangeDate}
              />
            )}
            {showTime && (
              <DateTimePicker
                value={date}
                mode="time"
                display="default"
                onChange={onChangeTime}
              />
            )}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Ưu tiên</Text>
              <View style={styles.chipRow}>
                {PRIORITIES.map(p => (
                  <TouchableOpacity
                    key={p.value}
                    style={[styles.chip, priority === p.value && { backgroundColor: p.color + '30', borderColor: p.color }]}
                    onPress={() => setPriority(p.value)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={p.icon as any} size={14} color={priority === p.value ? p.color : Colors.text.muted} />
                    <Text style={[styles.chipText, priority === p.value && { color: p.color }]}>{p.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Độ khó (để trống → AI tự đánh giá)</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                <View style={[styles.chipRow, { flexWrap: 'nowrap' }]}>
                  {DIFFICULTIES.map(d => (
                    <TouchableOpacity
                      key={d.value}
                      style={[styles.chip, difficulty === d.value && { backgroundColor: d.color + '25', borderColor: d.color }]}
                      onPress={() => setDifficulty(prev => prev === d.value ? '' : d.value)}
                      activeOpacity={0.8}
                    >
                      <Text>{d.icon}</Text>
                      <Text style={[styles.chipText, difficulty === d.value && { color: d.color }]}>{d.label}</Text>
                      <Text style={[styles.chipExp, { color: d.color }]}>+{d.exp} EXP</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </ScrollView>
            </View>

            <View style={styles.dateRow}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Thời lượng (phút)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="60"
                  placeholderTextColor={Colors.text.muted}
                  value={duration}
                  onChangeText={setDuration}
                  keyboardType="number-pad"
                />
              </View>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Tags (ngăn bằng dấu ,)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="học, công việc"
                  placeholderTextColor={Colors.text.muted}
                  value={tags}
                  onChangeText={setTags}
                />
              </View>
            </View>

            <TouchableOpacity
              style={styles.submitBtn}
              onPress={handleManualCreate}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Ionicons name="checkmark-circle" size={20} color="#fff" />
                  <Text style={styles.submitBtnText}>Tạo Task</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      <Modal visible={!!taskMissingDuration} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Nhập thời lượng</Text>
            <Text style={styles.modalDesc}>Task này chưa có thời lượng. Vui lòng nhập số phút (ví dụ: 60):</Text>
            <TextInput
              style={styles.modalInput}
              keyboardType="number-pad"
              placeholder="60"
              placeholderTextColor={Colors.text.muted}
              value={missingDurationInput}
              onChangeText={setMissingDurationInput}
              autoFocus
            />
            <TouchableOpacity style={styles.modalBtn} onPress={handleMissingDurationSubmit}>
              <Text style={styles.modalBtnText}>Lưu Thời Lượng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border.default,
  },
  headerTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  closeBtn: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18, backgroundColor: Colors.bg.card },
  modeToggle: {
    flexDirection: 'row', margin: Spacing.md,
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.full,
    padding: 4, borderWidth: 1, borderColor: Colors.border.default,
  },
  modeBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 8, borderRadius: BorderRadius.full },
  modeBtnActive: { backgroundColor: Colors.bg.elevated },
  modeBtnText: { fontSize: FontSize.sm, color: Colors.text.muted, fontWeight: '600' },
  modeBtnTextActive: { color: '#fff' },
  scroll: { paddingHorizontal: Spacing.md },
  aiSection: { gap: Spacing.md },
  aiHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  aiTitle: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  aiSubtitle: { fontSize: FontSize.sm, color: Colors.text.secondary },
  aiExamples: { gap: 6 },
  aiExample: { fontSize: FontSize.sm, color: Colors.brand.violet, fontStyle: 'italic', paddingVertical: 2 },
  aiInput: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.border.default,
    padding: Spacing.md, color: Colors.text.primary, fontSize: FontSize.base, minHeight: 100,
  },
  aiResultBox: { borderRadius: BorderRadius.md, padding: Spacing.sm, borderWidth: 1 },
  aiSuccess: { backgroundColor: 'rgba(76, 175, 80, 0.15)', borderColor: 'rgba(76, 175, 80, 0.4)' },
  aiWarning: { backgroundColor: 'rgba(255, 152, 0, 0.15)', borderColor: 'rgba(255, 152, 0, 0.4)' },
  aiResultText: { color: Colors.text.primary, fontSize: FontSize.sm },
  submitBtn: {
    backgroundColor: Colors.status.success, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, height: 52, borderRadius: BorderRadius.md, marginTop: Spacing.sm,
    shadowColor: Colors.status.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8,
  },
  submitBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
  manualSection: { gap: 0 },
  inputGroup: { marginBottom: Spacing.md },
  label: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: 6, fontWeight: '600' },
  input: {
    backgroundColor: Colors.bg.card, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.border.default,
    paddingHorizontal: Spacing.md, height: 46, color: Colors.text.primary, fontSize: FontSize.base,
  },
  textArea: { height: 80, paddingTop: Spacing.sm },
  dateRow: { flexDirection: 'row', gap: Spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingVertical: 6, paddingHorizontal: 12, borderRadius: BorderRadius.full,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.default,
  },
  chipText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: '600' },
  chipExp: { fontSize: 10, fontWeight: '700' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center', padding: Spacing.xl },
  modalContent: { backgroundColor: Colors.bg.card, width: '100%', borderRadius: BorderRadius.lg, padding: Spacing.lg, borderWidth: 1, borderColor: Colors.border.default },
  modalTitle: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary, marginBottom: Spacing.sm },
  modalDesc: { fontSize: FontSize.sm, color: Colors.text.secondary, marginBottom: Spacing.md },
  modalInput: { backgroundColor: Colors.bg.primary, borderRadius: BorderRadius.md, borderWidth: 1, borderColor: Colors.border.default, color: Colors.text.primary, fontSize: FontSize.lg, padding: Spacing.md, marginBottom: Spacing.lg, textAlign: 'center' },
  modalBtn: { backgroundColor: Colors.brand.violet, paddingVertical: 14, borderRadius: BorderRadius.md, alignItems: 'center' },
  modalBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: '700' },
});
