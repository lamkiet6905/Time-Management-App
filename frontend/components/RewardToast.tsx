import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, BorderRadius, Spacing } from '../constants/theme';

// ══════════════════════════════════════════════════════════════════
// REWARD TOAST — Hiển thị phần thưởng sau khi hoàn thành task
// Bay lên từ dưới, hiện 2.5s rồi tự biến mất
// ══════════════════════════════════════════════════════════════════

export interface RewardData {
  expEarned: number;
  goldEarned: number;
  hpChange?: number;       // số âm = trừ HP, dương = hồi HP
  levelUp?: {
    levelsGained: number;
    level: number;
  } | null;
  direction?: string;      // 'positive' | 'negative' cho habit
}

interface RewardToastProps {
  reward: RewardData | null;
  onDismiss: () => void;
}

export default function RewardToast({ reward, onDismiss }: RewardToastProps) {
  const translateY = useSharedValue(100);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    if (reward) {
      // Slide up + fade in
      translateY.value = withTiming(0, { duration: 400, easing: Easing.out(Easing.back(1.5)) });
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withTiming(1, { duration: 400, easing: Easing.out(Easing.back(1.2)) });

      // Sau 2.5s → fade out + slide down
      translateY.value = withDelay(2500, withTiming(100, { duration: 400 }));
      opacity.value = withDelay(2500, withTiming(0, { duration: 400 }, (finished) => {
        if (finished) {
          runOnJS(onDismiss)();
        }
      }));
      scale.value = withDelay(2500, withTiming(0.8, { duration: 400 }));
    }
  }, [reward]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
    opacity: opacity.value,
  }));

  if (!reward) return null;

  const isNegative = reward.direction === 'negative';
  const showHpLoss = isNegative && reward.hpChange && reward.hpChange < 0;

  return (
    <Animated.View style={[styles.container, animatedStyle]} pointerEvents="none">
      <View style={[styles.toast, isNegative ? styles.toastNegative : styles.toastPositive]}>
        {/* Level Up đặc biệt */}
        {reward.levelUp && reward.levelUp.levelsGained > 0 ? (
          <View style={styles.levelUpRow}>
            <Text style={styles.levelUpIcon}>🎉</Text>
            <Text style={styles.levelUpText}>LEVEL UP! Lv.{reward.levelUp.level}</Text>
          </View>
        ) : null}

        {/* Rewards row */}
        <View style={styles.rewardsRow}>
          {/* EXP */}
          {reward.expEarned > 0 ? (
            <View style={styles.rewardItem}>
              <Ionicons name="star" size={18} color={Colors.brand.violet} />
              <Text style={[styles.rewardValue, { color: Colors.brand.violet }]}>
                +{reward.expEarned}
              </Text>
              <Text style={styles.rewardLabel}>EXP</Text>
            </View>
          ) : null}

          {/* Gold */}
          {reward.goldEarned > 0 ? (
            <View style={styles.rewardItem}>
              <Ionicons name="cash" size={18} color={Colors.brand.gold} />
              <Text style={[styles.rewardValue, { color: Colors.brand.gold }]}>
                +{typeof reward.goldEarned === 'number' ? reward.goldEarned.toFixed(1) : reward.goldEarned}
              </Text>
              <Text style={styles.rewardLabel}>Gold</Text>
            </View>
          ) : null}

          {/* HP Loss (khi habit negative) */}
          {showHpLoss ? (
            <View style={styles.rewardItem}>
              <Ionicons name="heart-dislike" size={18} color={Colors.brand.red} />
              <Text style={[styles.rewardValue, { color: Colors.brand.red }]}>
                {reward.hpChange}
              </Text>
              <Text style={styles.rewardLabel}>HP</Text>
            </View>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 100,
    left: Spacing.lg,
    right: Spacing.lg,
    zIndex: 9999,
    alignItems: 'center',
  },
  toast: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderWidth: 2,
    minWidth: 200,
    alignItems: 'center',
    // Shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  toastPositive: {
    backgroundColor: '#F0FFF4',
    borderColor: Colors.brand.emerald,
  },
  toastNegative: {
    backgroundColor: '#FFF5F5',
    borderColor: Colors.brand.red,
  },

  levelUpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  levelUpIcon: {
    fontSize: 24,
  },
  levelUpText: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    color: Colors.brand.gold,
    letterSpacing: 1,
  },

  rewardsRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
    alignItems: 'center',
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardValue: {
    fontSize: FontSize.lg,
    fontWeight: '800',
  },
  rewardLabel: {
    fontSize: FontSize.xs,
    color: Colors.text.muted,
    fontWeight: '700',
  },
});
