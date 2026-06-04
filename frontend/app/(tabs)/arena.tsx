import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView,
} from 'react-native';
import Animated, {
  useAnimatedStyle, useSharedValue, withTiming, withSequence,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, FontSize, BorderRadius } from '../../constants/theme';
import { useAuthStore } from '../../stores/authStore';
import { useArenaBattle } from '../../hooks/useArenaBattle';
import { useArenaPhysics } from '../../hooks/useArenaPhysics';
import { ArenaSprite } from '../../components/Arena/ArenaSprite';

// ══════════════════════════════════════════════════════════════════
// ARENA SCREEN — Đấu trường DVD Bounce
// Map vuông, 2 fighter nảy tường, sprite 3 trạng thái
// ══════════════════════════════════════════════════════════════════

const SCREEN_WIDTH = Dimensions.get('window').width;
const ARENA_PADDING = Spacing.lg * 2;
const MAP_SIZE = Math.min(SCREEN_WIDTH - ARENA_PADDING, 400); // Map vuông, tối đa 400px
const ENTITY_SIZE = MAP_SIZE * 0.22; // Kích thước sprite tỉ lệ map (khớp hitbox)

export default function ArenaScreen() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [showFlash, setShowFlash] = useState(false);

  // ── Battle logic (API) ─────────────────────────────────────
  const {
    battleId, playerStats, bossStats, isBattling, battleOutcome, logs,
    lastDamageEvent, initBattle, processHit,
  } = useArenaBattle();

  // ── Physics engine (DVD bounce) ────────────────────────────
  const {
    pX, pY, bX, bY,
    playerState, bossState,
    screenFlash, isRunning,
    applyHitResult, resetPhysics, stopPhysics,
    FIGHTER_RADIUS, ATTACK_RANGE,
  } = useArenaPhysics({
    mapSize: MAP_SIZE,
    onClash: async () => {
      const whoGotHit = await processHit();
      if (whoGotHit) {
        applyHitResult(whoGotHit);
        setShowFlash(true);
        setTimeout(() => setShowFlash(false), 80);
      }
    },
  });

  // ── Bắt đầu / kết thúc trận ───────────────────────────────
  useEffect(() => {
    if (isBattling && playerStats && bossStats) {
      resetPhysics(playerStats.speed, bossStats.speed);
    }
  }, [isBattling]);

  useEffect(() => {
    if (battleOutcome) {
      stopPhysics();
    }
  }, [battleOutcome]);

  // ── Kiểm tra avatar (SAU tất cả hooks) ─────────────────────
  if (user?.sprite_status === 'none' || user?.sprite_status === 'failed') {
    return (
      <View style={[styles.container, styles.centered]}>
        <Ionicons name="shield" size={64} color={Colors.brand.gold} />
        <Text style={styles.requireTitle}>Yêu Cầu Avatar</Text>
        <Text style={styles.requireDesc}>
          Bạn cần tạo Avatar Doodle bằng AI để tham gia Đấu Trường!
        </Text>
        <TouchableOpacity style={styles.actionButton} onPress={() => router.push('/avatar-setup')}>
          <Ionicons name="color-palette" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>TẠO AVATAR NGAY</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── HP bar animation ───────────────────────────────────────
  const playerHpPercent = playerStats
    ? Math.max(0, (playerStats.hp / playerStats.maxHP) * 100) : 100;
  const bossHpPercent = bossStats
    ? Math.max(0, (bossStats.hp / bossStats.maxHP) * 100) : 100;

  return (
    <View style={styles.container}>
      {/* ── HEADER ── */}
      <View style={styles.header}>
        <Text style={styles.screenTitle}>⚔️ Đấu Trường</Text>
      </View>

      {/* ── HP BARS ── */}
      <View style={styles.hpRow}>
        {/* Player HP */}
        <View style={styles.hpBox}>
          <View style={styles.hpLabelRow}>
            <Ionicons name="person" size={14} color={Colors.brand.cyan} />
            <Text style={styles.hpName}>Bạn</Text>
          </View>
          <View style={styles.hpBarBg}>
            <View style={[styles.hpBarFill, { width: `${playerHpPercent}%`, backgroundColor: Colors.brand.emerald }]} />
          </View>
          <Text style={styles.hpText}>{playerStats?.hp ?? 0}/{playerStats?.maxHP ?? 0}</Text>
        </View>

        <Text style={styles.vsText}>VS</Text>

        {/* Boss HP */}
        <View style={[styles.hpBox, { alignItems: 'flex-end' }]}>
          <View style={styles.hpLabelRow}>
            <Ionicons name="skull" size={14} color={Colors.brand.red} />
            <Text style={styles.hpName}>Boss</Text>
          </View>
          <View style={styles.hpBarBg}>
            <View style={[styles.hpBarFill, { width: `${bossHpPercent}%`, backgroundColor: Colors.brand.red }]} />
          </View>
          <Text style={styles.hpText}>{bossStats?.hp ?? 0}/{bossStats?.maxHP ?? 0}</Text>
        </View>
      </View>

      {/* ── Chỉ số ── */}
      {playerStats && bossStats ? (
        <View style={styles.statsCompare}>
          <Text style={styles.statChip}>🗡 STR: {playerStats.strength} vs {bossStats.strength}</Text>
          <Text style={styles.statChip}>⚡ SPD: {playerStats.speed} vs {bossStats.speed}</Text>
        </View>
      ) : null}

      {/* ── ARENA MAP (VUÔNG) ── */}
      <View style={[styles.arenaBox, { width: MAP_SIZE, height: MAP_SIZE }]}>
        {/* Grid nền */}
        <View style={styles.arenaGrid} />

        {/* Overlay: Chưa bắt đầu */}
        {!isBattling && !battleOutcome ? (
          <View style={styles.overlay}>
            <Ionicons name="shield-half" size={48} color={Colors.brand.gold} />
            <Text style={styles.overlayTitle}>Khiêu Chiến Bản Thân!</Text>
            <Text style={styles.overlayDesc}>Đánh bại phiên bản hoàn hảo của bạn</Text>
            <TouchableOpacity style={styles.actionButton} onPress={initBattle}>
              <Ionicons name="flash" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>BẮT ĐẦU</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Overlay: Kết thúc */}
        {battleOutcome ? (
          <View style={styles.overlay}>
            <Text style={styles.outcomeEmoji}>
              {battleOutcome === 'victory' ? '🏆' : battleOutcome === 'defeat' ? '💀' : '🤝'}
            </Text>
            <Text style={styles.outcomeText}>
              {battleOutcome === 'victory' ? 'CHIẾN THẮNG!' : battleOutcome === 'defeat' ? 'THẤT BẠI...' : 'HÒA KÈO!'}
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={initBattle}>
              <Ionicons name="refresh" size={20} color="#fff" />
              <Text style={styles.actionButtonText}>THỬ LẠI</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Fighters */}
        {(isBattling || battleOutcome) ? (
          <>
            <ArenaSprite
              x={pX} y={pY} size={ENTITY_SIZE}
              state={playerState}
              spriteUrls={{
                idle: playerStats?.spriteIdle,
                attack: playerStats?.spriteAttack,
                hurt: playerStats?.spriteHurt,
              }}
            />
            <ArenaSprite
              x={bX} y={bY} size={ENTITY_SIZE}
              state={bossState}
              isBoss
              spriteUrls={{
                idle: bossStats?.spriteIdle,
                attack: bossStats?.spriteAttack,
                hurt: bossStats?.spriteHurt,
              }}
            />
          </>
        ) : null}

        {/* Screen Flash (đỏ, 80ms khi trúng đòn) */}
        {showFlash ? <View style={styles.screenFlash} /> : null}

        {/* Damage Number */}
        {lastDamageEvent ? (
          <DamageNumber event={lastDamageEvent} mapSize={MAP_SIZE} />
        ) : null}
      </View>

      {/* ── COMBAT LOG ── */}
      <ScrollView style={styles.logsBox} contentContainerStyle={styles.logsContent}>
        <Text style={styles.logsTitle}>📜 Nhật ký chiến đấu</Text>
        {logs.map((log, i) => (
          <Text key={i} style={[styles.logText, i === 0 && styles.logTextLatest]}>
            {log}
          </Text>
        ))}
        {logs.length === 0 ? (
          <Text style={styles.logEmpty}>Nhấn BẮT ĐẦU để chiến đấu!</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

// ══════════════════════════════════════════════════════════════════
// DAMAGE NUMBER — Số sát thương bay lên
// ══════════════════════════════════════════════════════════════════

function DamageNumber({ event, mapSize }: { event: any; mapSize: number }) {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = 0;
    opacity.value = 1;
    translateY.value = withTiming(-40, { duration: 800 });
    opacity.value = withTiming(0, { duration: 1000 });
  }, [event]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const isPlayerHit = event.target === 'player';

  return (
    <Animated.View style={[
      styles.damageNumber,
      { left: isPlayerHit ? mapSize * 0.2 : mapSize * 0.65 },
      animStyle,
    ]}>
      <Text style={[
        styles.damageText,
        event.isCrit && styles.damageCrit,
        { color: isPlayerHit ? Colors.brand.red : Colors.brand.gold },
      ]}>
        -{event.amount}{event.isCrit ? ' CRIT!' : ''}
      </Text>
      {event.heal > 0 ? (
        <Text style={styles.healText}>+{event.heal} HP</Text>
      ) : null}
    </Animated.View>
  );
}

// ── STYLES ──────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg.primary,
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  header: {
    marginBottom: Spacing.md,
  },
  screenTitle: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.text.primary,
  },
  requireTitle: {
    fontSize: FontSize.xl,
    fontWeight: '800',
    color: Colors.brand.gold,
  },
  requireDesc: {
    fontSize: FontSize.base,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
  },

  // HP Bars
  hpRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  hpBox: { flex: 1 },
  hpLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  hpName: {
    color: Colors.text.primary,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },
  hpBarBg: {
    height: 10,
    backgroundColor: Colors.bg.secondary,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border.default,
  },
  hpBarFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  hpText: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
    marginTop: 2,
  },
  vsText: {
    fontSize: FontSize.sm,
    fontWeight: '900',
    color: Colors.brand.gold,
  },

  // Stats Compare
  statsCompare: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.sm,
  },
  statChip: {
    fontSize: FontSize.xs,
    color: Colors.text.secondary,
    backgroundColor: Colors.bg.secondary,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    fontWeight: '600',
    overflow: 'hidden',
  },

  // Arena
  arenaBox: {
    alignSelf: 'center',
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    borderColor: Colors.border.default,
    overflow: 'hidden',
    position: 'relative',
  },
  arenaGrid: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.08,
    borderWidth: 1,
    borderColor: '#fff',
  },



  // Overlays
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    gap: Spacing.sm,
  },
  overlayTitle: {
    fontSize: FontSize.lg,
    fontWeight: '800',
    color: '#fff',
  },
  overlayDesc: {
    fontSize: FontSize.sm,
    color: Colors.text.muted,
    marginBottom: Spacing.sm,
  },
  outcomeEmoji: {
    fontSize: 48,
  },
  outcomeText: {
    fontSize: FontSize.xxl,
    fontWeight: '900',
    color: Colors.brand.gold,
  },

  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.brand.violet,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginTop: Spacing.sm,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: FontSize.base,
  },

  // Screen Flash
  screenFlash: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 50, 50, 0.25)',
    zIndex: 20,
  },

  // Damage Numbers
  damageNumber: {
    position: 'absolute',
    top: '40%',
    zIndex: 15,
    alignItems: 'center',
  },
  damageText: {
    fontSize: FontSize.lg,
    fontWeight: '900',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  damageCrit: {
    fontSize: FontSize.xxl,
  },
  healText: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.brand.emerald,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },

  // Combat Log
  logsBox: {
    flex: 1,
    marginTop: Spacing.md,
    backgroundColor: Colors.bg.card,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border.default,
    maxHeight: 160,
  },
  logsContent: {
    padding: Spacing.md,
  },
  logsTitle: {
    color: Colors.brand.gold,
    fontWeight: '800',
    fontSize: FontSize.sm,
    marginBottom: Spacing.sm,
  },
  logText: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
    marginBottom: 3,
  },
  logTextLatest: {
    color: Colors.text.primary,
    fontWeight: '700',
  },
  logEmpty: {
    color: Colors.text.muted,
    fontSize: FontSize.xs,
    fontStyle: 'italic',
  },
});
