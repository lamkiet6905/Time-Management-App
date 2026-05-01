import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  exp_reward: number;
  is_unlocked: boolean;
  unlocked_at?: string;
}

const RARITY_COLORS = {
  common:    { bg: 'rgba(158, 158, 158, 0.15)', border: 'rgba(158, 158, 158, 0.4)', text: '#9E9E9E' },
  rare:      { bg: 'rgba(33, 150, 243, 0.15)',  border: 'rgba(33, 150, 243, 0.4)',  text: '#2196F3' },
  epic:      { bg: 'rgba(156, 39, 176, 0.15)',  border: 'rgba(156, 39, 176, 0.4)',  text: '#CE93D8' },
  legendary: { bg: 'rgba(255, 152, 0, 0.15)',   border: 'rgba(255, 152, 0, 0.4)',   text: '#FFB74D' },
};

const CATEGORY_LABELS: Record<string, string> = {
  tasks: '⚔️ Tasks',
  streak: '🔥 Streak',
  level: '⬆️ Level',
  special: '✨ Đặc Biệt',
  social: '👥 Xã Hội',
};

export default function AchievementsScreen() {
  const insets = useSafeAreaInsets();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAchievements();
  }, []);

  async function loadAchievements() {
    try {
      const { data } = await api.get('/achievements');
      setAchievements(data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  const categories = ['all', 'tasks', 'streak', 'level', 'special'];
  const filtered = filter === 'all' ? achievements : achievements.filter(a => a.category === filter);
  const unlockedCount = achievements.filter(a => a.is_unlocked).length;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🏆 Thành Tựu</Text>
          <Text style={styles.headerSub}>{unlockedCount}/{achievements.length} đã đạt</Text>
        </View>
        <View style={styles.progressCircle}>
          <Text style={styles.progressText}>{achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%</Text>
        </View>
      </View>

      {/* Category filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={styles.filterContent}>
        {categories.map(cat => (
          <TouchableOpacity
            key={cat}
            style={[styles.filterChip, filter === cat && styles.filterChipActive]}
            onPress={() => setFilter(cat)}
            activeOpacity={0.8}
          >
            <Text style={[styles.filterChipText, filter === cat && styles.filterChipTextActive]}>
              {cat === 'all' ? '🌟 Tất cả' : CATEGORY_LABELS[cat] || cat}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Achievement grid */}
      <FlatList
        data={filtered}
        keyExtractor={item => item.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const rarity = RARITY_COLORS[item.rarity] || RARITY_COLORS.common;
          return (
            <View style={[
              styles.achieveCard,
              { backgroundColor: rarity.bg, borderColor: rarity.border },
              !item.is_unlocked && styles.lockedCard,
            ]}>
              <View style={[styles.achieveIconBg, { borderColor: rarity.border }]}>
                <Ionicons
                  name={item.icon as any || 'trophy'}
                  size={28}
                  color={item.is_unlocked ? rarity.text : Colors.text.muted}
                />
              </View>
              <Text style={[styles.achieveName, !item.is_unlocked && styles.lockedText]} numberOfLines={2}>
                {item.is_unlocked ? item.name : '???'}
              </Text>
              <Text style={[styles.achieveDesc, !item.is_unlocked && styles.lockedText]} numberOfLines={2}>
                {item.is_unlocked ? item.description : 'Chưa mở khóa'}
              </Text>
              <View style={styles.achieveFooter}>
                <View style={[styles.rarityBadge, { backgroundColor: rarity.border }]}>
                  <Text style={[styles.rarityText, { color: rarity.text }]}>{item.rarity}</Text>
                </View>
                {item.is_unlocked && item.exp_reward > 0 && (
                  <Text style={styles.expReward}>+{item.exp_reward} EXP</Text>
                )}
              </View>
              {item.is_unlocked && (
                <View style={styles.unlockedBadge}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.status.success} />
                </View>
              )}
            </View>
          );
        }}
        ListFooterComponent={<View style={{ height: 100 }} />}
      />
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
  headerSub: { fontSize: FontSize.sm, color: Colors.text.secondary, marginTop: 2 },
  progressCircle: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: Colors.bg.card, borderWidth: 2, borderColor: Colors.brand.violet,
    alignItems: 'center', justifyContent: 'center',
  },
  progressText: { fontSize: FontSize.sm, fontWeight: '900', color: Colors.brand.violet },
  filterScroll: { maxHeight: 48 },
  filterContent: { paddingHorizontal: Spacing.md, gap: 8 },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 14, borderRadius: BorderRadius.full,
    backgroundColor: Colors.bg.card, borderWidth: 1, borderColor: Colors.border.default,
  },
  filterChipActive: { backgroundColor: Colors.brand.violet, borderColor: Colors.brand.violet },
  filterChipText: { fontSize: FontSize.sm, color: Colors.text.secondary, fontWeight: '600' },
  filterChipTextActive: { color: '#fff' },
  list: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md },
  row: { gap: 12, marginBottom: 12 },
  achieveCard: {
    flex: 1, borderRadius: BorderRadius.lg, borderWidth: 1,
    padding: Spacing.md, gap: 6, minHeight: 160,
  },
  lockedCard: { opacity: 0.5 },
  achieveIconBg: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  achieveName: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text.primary },
  achieveDesc: { fontSize: FontSize.xs, color: Colors.text.secondary, flexShrink: 1 },
  lockedText: { color: Colors.text.muted },
  achieveFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' as any },
  rarityBadge: { borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6 },
  rarityText: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase' },
  expReward: { fontSize: FontSize.xs, color: Colors.rpg.exp, fontWeight: '700' },
  unlockedBadge: { position: 'absolute', top: 8, right: 8 },
});
