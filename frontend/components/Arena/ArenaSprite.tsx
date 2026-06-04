import React from 'react';
import { View, StyleSheet, Image } from 'react-native';
import Animated, { useAnimatedStyle, SharedValue } from 'react-native-reanimated';
import { API_BASE_URL } from '../../constants/theme';
import type { FighterState } from '../../hooks/useArenaPhysics';

// ══════════════════════════════════════════════════════════════════
// ARENA SPRITE — Render fighter với sprite state machine
// Hiệu ứng: Hurt glow (đỏ), Attack glow (vàng), Bounce glow (trắng)
// ══════════════════════════════════════════════════════════════════

interface ArenaSpriteProps {
  x: SharedValue<number>;
  y: SharedValue<number>;
  size: number;
  state: FighterState;
  spriteUrls?: {
    idle?: string;
    attack?: string;
    hurt?: string;
  };
  isBoss?: boolean;
}

export const ArenaSprite: React.FC<ArenaSpriteProps> = ({
  x, y, size, state, spriteUrls, isBoss = false,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: x.value },
      { translateY: y.value },
    ],
  }));

  // Chọn sprite theo state (fallback: state → idle → null)
  let imageUri = spriteUrls?.[state] || spriteUrls?.idle;

  // Convert relative path / absolute path → full URL
  if (imageUri && !imageUri.startsWith('http')) {
    // Đường dẫn tương đối: "uploads/sprites/user_1_idle.png"
    // Hoặc tuyệt đối Windows: "C:\...\uploads\sprites\user_1_idle.png"
    const filename = imageUri.replace(/\\/g, '/').split('/').pop();
    imageUri = `${API_BASE_URL}/uploads/sprites/${filename}`;
  }

  // Glow colors theo state
  const isHurt = state === 'hurt';
  const isAttack = state === 'attack';

  return (
    <Animated.View style={[styles.container, { width: size, height: size }, animatedStyle]}>
      {/* Hurt Glow — vòng đỏ khi bị đánh */}
      {isHurt ? (
        <View style={[styles.glowRing, styles.hurtGlow, { 
          width: size + 12, height: size + 12, borderRadius: (size + 12) / 2 
        }]} />
      ) : null}

      {/* Attack Glow — vòng vàng khi ra đòn */}
      {isAttack ? (
        <View style={[styles.glowRing, styles.attackGlow, { 
          width: size + 16, height: size + 16, borderRadius: (size + 16) / 2 
        }]} />
      ) : null}

      {/* Sprite Image */}
      {imageUri ? (
        <Image
          source={{ uri: imageUri }}
          style={[
            styles.image,
            isBoss && styles.bossFlip,
            isHurt && styles.hurtTint,
          ]}
          resizeMode="contain"
        />
      ) : (
        <View style={[
          styles.placeholder,
          isBoss ? styles.bossPlaceholder : styles.playerPlaceholder,
          isHurt && { opacity: 0.6 },
          isAttack && { borderWidth: 3, borderColor: '#FFD700' },
        ]} />
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowRing: {
    position: 'absolute',
  },
  hurtGlow: {
    backgroundColor: 'rgba(255, 60, 60, 0.35)',
  },
  attackGlow: {
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  bossFlip: {
    transform: [{ scaleX: -1 }],
  },
  hurtTint: {
    opacity: 0.7,
    tintColor: '#ff6666',
  },
  placeholder: {
    width: '80%',
    height: '80%',
    borderRadius: 999,
    borderWidth: 2,
  },
  playerPlaceholder: {
    backgroundColor: '#3B82F6',
    borderColor: '#60A5FA',
  },
  bossPlaceholder: {
    backgroundColor: '#EF4444',
    borderColor: '#F87171',
  },
});
