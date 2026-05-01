import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import api from '../../services/api';
import { useAuthStore } from '../../stores/authStore';
import { Colors, Spacing, BorderRadius, FontSize } from '../../constants/theme';

interface Buff {
  id: string;
  name: string;
  description: string;
  icon: string;
  effect_type: string;
  effect_value: number;
  duration_days: number | null;
  is_one_time: boolean;
}

const EFFECT_LABELS: Record<string, string> = {
  exp_multiplier:  'Tăng EXP',
  hp_regen:        'Hồi HP mỗi ngày',
  hp_shield:       'Giảm HP penalty',
  streak_protect:  'Bảo vệ Streak',
  double_exp:      'Nhân đôi EXP',
  max_hp_increase: 'Tăng HP tối đa',
  no_penalty:      'Miễn HP phạt',
};

function formatEffect(buff: Buff): string {
  const val = buff.effect_value;
  switch (buff.effect_type) {
    case 'exp_multiplier': return `+${val}% EXP`;
    case 'hp_regen': return `+${val} HP/ngày`;
    case 'hp_shield': return `-${val}% phạt`;
    case 'double_exp': return `x${val} EXP`;
    case 'max_hp_increase': return `+${val} HP max`;
    case 'no_penalty': return 'Không phạt';
    default: return `+${val}`;
  }
}

function formatDuration(buff: Buff): string {
  if (buff.is_one_time) return '1 lần dùng';
  if (!buff.duration_days) return 'Vĩnh viễn';
  return `${buff.duration_days} ngày`;
}

const BUFF_COLORS = [
  { bg: 'rgba(123, 94, 167, 0.2)', border: Colors.brand.violet, accent: Colors.brand.violet },
  { bg: 'rgba(244, 162, 97, 0.2)', border: Colors.rpg.exp,      accent: Colors.rpg.exp      },
  { bg: 'rgba(76, 175, 80, 0.2)',  border: Colors.status.success, accent: Colors.status.success },
];

export default function LevelUpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, updateUser } = useAuthStore();
  const [buffs, setBuffs] = useState<Buff[]>([]);
  const [loading, setLoading] = useState(true);
  const [choosing, setChoosing] = useState<string | null>(null);
  const [chosen, setChosen] = useState(false);
  const scaleAnims = [
    new Animated.Value(0), new Animated.Value(0), new Animated.Value(0),
  ];

  useEffect(() => {
    loadBuffOptions();
  }, []);

  async function loadBuffOptions() {
    try {
      const { data } = await api.get('/buffs/available');
      setBuffs(data.data);
      // Staggered entrance animation
      data.data.forEach((_: any, i: number) => {
        setTimeout(() => {
          Animated.spring(scaleAnims[i], {
            toValue: 1, tension: 80, friction: 8, useNativeDriver: true,
          }).start();
        }, i * 120);
      });
    } catch {}
    finally { setLoading(false); }
  }

  async function chooseBuff(buffId: string) {
    setChoosing(buffId);
    try {
      await api.post('/buffs/choose', { buff_id: buffId });
      updateUser({ pending_level_up: false });
      setChosen(true);
      setTimeout(() => router.back(), 1500);
    } catch {}
    finally { setChoosing(null); }
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={Colors.brand.violet} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.levelUpEmoji}>🌟</Text>
          <Text style={styles.levelUpTitle}>LEVEL UP!</Text>
          <Text style={styles.levelUpLevel}>Cấp độ {user?.level}</Text>
          <Text style={styles.levelUpSub}>Chọn 1 buff để tiếp tục hành trình</Text>
        </View>

        {chosen ? (
          <View style={styles.chosenFeedback}>
            <Ionicons name="checkmark-circle" size={60} color={Colors.status.success} />
            <Text style={styles.chosenText}>Buff đã được kích hoạt! ✨</Text>
          </View>
        ) : (
          <View style={styles.buffsContainer}>
            {buffs.map((buff, i) => {
              const colorScheme = BUFF_COLORS[i % BUFF_COLORS.length];
              const isChoosing = choosing === buff.id;
              return (
                <Animated.View key={buff.id} style={{ transform: [{ scale: scaleAnims[i] || new Animated.Value(1) }] }}>
                  <TouchableOpacity
                    style={[styles.buffCard, { backgroundColor: colorScheme.bg, borderColor: colorScheme.border }]}
                    onPress={() => chooseBuff(buff.id)}
                    disabled={!!choosing}
                    activeOpacity={0.85}
                  >
                    {/* Buff icon */}
                    <View style={[styles.buffIconBg, { borderColor: colorScheme.border }]}>
                      <Ionicons name={buff.icon as any || 'flash'} size={32} color={colorScheme.accent} />
                    </View>

                    {/* Info */}
                    <View style={styles.buffInfo}>
                      <Text style={styles.buffName}>{buff.name}</Text>
                      <Text style={styles.buffDesc}>{buff.description}</Text>
                      <View style={styles.buffTags}>
                        <View style={[styles.buffTag, { backgroundColor: colorScheme.accent + '30' }]}>
                          <Text style={[styles.buffTagText, { color: colorScheme.accent }]}>
                            {formatEffect(buff)}
                          </Text>
                        </View>
                        <View style={styles.buffTag}>
                          <Text style={styles.buffTagText}>{formatDuration(buff)}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Choose button */}
                    <View style={[styles.chooseBtn, { backgroundColor: colorScheme.accent }]}>
                      {isChoosing ? (
                        <ActivityIndicator color="#fff" size="small" />
                      ) : (
                        <Ionicons name="checkmark" size={20} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        )}

        {/* Skip later option */}
        {!chosen && (
          <TouchableOpacity onPress={() => router.back()} style={styles.skipBtn}>
            <Text style={styles.skipText}>Chọn sau</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg.primary },
  scroll: { paddingHorizontal: Spacing.md, paddingBottom: 60 },
  header: { alignItems: 'center', paddingVertical: Spacing.xl, gap: 4 },
  levelUpEmoji: { fontSize: 64 },
  levelUpTitle: { fontSize: 40, fontWeight: '900', color: Colors.rpg.level, letterSpacing: 4 },
  levelUpLevel: { fontSize: FontSize.xl, fontWeight: '800', color: Colors.text.primary },
  levelUpSub: { fontSize: FontSize.base, color: Colors.text.secondary, marginTop: Spacing.sm },
  buffsContainer: { gap: Spacing.md },
  buffCard: {
    flexDirection: 'row', alignItems: 'center', borderRadius: BorderRadius.xl,
    borderWidth: 1.5, padding: Spacing.md, gap: Spacing.md,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8,
  },
  buffIconBg: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: 'rgba(0,0,0,0.2)', borderWidth: 1.5,
    alignItems: 'center', justifyContent: 'center',
  },
  buffInfo: { flex: 1, gap: 4 },
  buffName: { fontSize: FontSize.md, fontWeight: '800', color: Colors.text.primary },
  buffDesc: { fontSize: FontSize.sm, color: Colors.text.secondary },
  buffTags: { flexDirection: 'row', gap: 6, marginTop: 4 },
  buffTag: {
    paddingVertical: 3, paddingHorizontal: 8,
    borderRadius: BorderRadius.full, backgroundColor: Colors.bg.elevated,
  },
  buffTagText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.text.secondary },
  chooseBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
  },
  chosenFeedback: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.md },
  chosenText: { fontSize: FontSize.lg, fontWeight: '800', color: Colors.text.primary },
  skipBtn: { alignItems: 'center', marginTop: Spacing.xl },
  skipText: { color: Colors.text.muted, fontSize: FontSize.sm },
});
