import { useCallback, useRef, useState, useEffect } from 'react';
import { useSharedValue, useFrameCallback, runOnJS } from 'react-native-reanimated';

// ══════════════════════════════════════════════════════════════════
// ARENA PHYSICS — DVD Bounce Engine
// Cơ chế: 2 fighter bay lượn kiểu DVD, nảy tường, tự tìm nhau
// và tấn công khi đủ gần. Knockback + hitStun + recoil.
// ══════════════════════════════════════════════════════════════════

// ── HẰNG SỐ VẬT LÝ ──────────────────────────────────────────
const FIGHTER_RADIUS = 28;
const ATTACK_RANGE = 55;
const KNOCKBACK_FORCE = 14;
const MIN_ATTACK_INTERVAL = 900; // ms

const SPEED_MIN = 1.5;
const SPEED_MAX = 15;
const SPEED_NOISE_CHANCE = 0.015;
const SPEED_NOISE_AMP = 0.4;

const WALL_BOUNCE_MIN = 0.92;
const WALL_BOUNCE_MAX = 1.02;
const FRICTION_HITSTUN = 0.93;

const ATTACK_STATE_FRAMES = 35;
const HURT_STATE_FRAMES = 45;
const HIT_STUN_FRAMES = 10;

export type FighterState = 'idle' | 'attack' | 'hurt';

export interface FighterData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  hitStun: number;
  hurtTimer: number;
  attackTimer: number;
  lastAttack: number;
  state: FighterState;
  bounceGlow: number;
}

interface PhysicsOptions {
  mapSize: number;
  onClash: () => void;
}

function createFighter(mapSize: number, isPlayerA: boolean): FighterData {
  const randRange = (min: number, max: number) => min + Math.random() * (max - min);
  return {
    x: isPlayerA ? mapSize * 0.2 : mapSize * 0.8,
    y: mapSize * 0.5,
    vx: isPlayerA ? randRange(1.5, 2.5) : -randRange(1.5, 2.5),
    vy: randRange(-2, 2),
    hitStun: 0,
    hurtTimer: 0,
    attackTimer: 0,
    lastAttack: 0,
    state: 'idle',
    bounceGlow: 0,
  };
}

export const useArenaPhysics = ({ mapSize, onClash }: PhysicsOptions) => {
  // Shared values cho smooth animation 60fps
  const pX = useSharedValue(mapSize * 0.2);
  const pY = useSharedValue(mapSize * 0.5);
  const bX = useSharedValue(mapSize * 0.8);
  const bY = useSharedValue(mapSize * 0.5);

  // Fighter data — dùng shared value để an toàn khi truy cập từ UI thread
  const playerData = useSharedValue<FighterData>(createFighter(mapSize, true));
  const bossData = useSharedValue<FighterData>(createFighter(mapSize, false));

  // State cho JS thread rendering
  const [playerState, setPlayerState] = useState<FighterState>('idle');
  const [bossState, setBossState] = useState<FighterState>('idle');
  const [playerBounceGlow, setPlayerBounceGlow] = useState(0);
  const [bossBounceGlow, setBossBounceGlow] = useState(0);
  const [screenFlash, setScreenFlash] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  // Tracking last synced states
  const lastPState = useSharedValue<string>('idle');
  const lastBState = useSharedValue<string>('idle');
  const running = useSharedValue(false);

  // Stable ref for onClash
  const onClashRef = useRef(onClash);
  useEffect(() => {
    onClashRef.current = onClash;
  }, [onClash]);

  // JS-side handler that calls onClash
  const handleClash = useCallback(() => {
    onClashRef.current();
  }, []);

  // ── FRAME CALLBACK (60fps game loop) ──────────────────────
  useFrameCallback(() => {
    'worklet';
    if (!running.value) return;

    const player = playerData.value;
    const boss = bossData.value;
    const now = Date.now();

    const randRange = (min: number, max: number) => min + Math.random() * (max - min);

    // Hàm update một fighter
    const update = (
      fighter: FighterData,
      other: FighterData,
    ): { f: FighterData; o: FighterData; clashed: boolean } => {
      const f = { ...fighter };
      const o = { ...other };
      let clashed = false;

      // BƯỚC 1: Timer & state
      if (f.hitStun > 0) {
        f.hitStun--;
        f.vx *= FRICTION_HITSTUN;
        f.vy *= FRICTION_HITSTUN;
        f.state = 'hurt';
      } else if (f.hurtTimer > 0) {
        f.hurtTimer--;
        f.state = 'hurt';
      } else if (f.attackTimer > 0) {
        f.attackTimer--;
        f.state = 'attack';
      } else {
        f.state = 'idle';
      }

      // BƯỚC 2: Di chuyển
      f.x += f.vx;
      f.y += f.vy;

      // BƯỚC 3: Nảy tường
      const R = FIGHTER_RADIUS;
      const factor = randRange(WALL_BOUNCE_MIN, WALL_BOUNCE_MAX);

      if (f.x - R < 0) { f.x = R; f.vx = Math.abs(f.vx) * factor; f.bounceGlow = 6; }
      if (f.x + R > mapSize) { f.x = mapSize - R; f.vx = -Math.abs(f.vx) * factor; f.bounceGlow = 6; }
      if (f.y - R < 0) { f.y = R; f.vy = Math.abs(f.vy) * factor; f.bounceGlow = 6; }
      if (f.y + R > mapSize) { f.y = mapSize - R; f.vy = -Math.abs(f.vy) * factor; f.bounceGlow = 6; }

      // BƯỚC 4: Nhiễu hướng
      if (f.hitStun === 0 && Math.random() < SPEED_NOISE_CHANCE) {
        f.vx += randRange(-SPEED_NOISE_AMP, SPEED_NOISE_AMP);
        f.vy += randRange(-SPEED_NOISE_AMP, SPEED_NOISE_AMP);
      }

      // BƯỚC 5: Giới hạn tốc độ
      const speed = Math.sqrt(f.vx * f.vx + f.vy * f.vy);
      if (speed < SPEED_MIN && f.hitStun === 0) {
        const scale = (SPEED_MIN + 0.5) / Math.max(speed, 0.01);
        f.vx *= scale;
        f.vy *= scale;
      }
      if (speed > SPEED_MAX) {
        const scale = SPEED_MAX / speed;
        f.vx *= scale;
        f.vy *= scale;
      }

      // BƯỚC 6: Bounce glow countdown
      if (f.bounceGlow > 0) f.bounceGlow--;

      // BƯỚC 7: Kiểm tra tấn công
      const dx = o.x - f.x;
      const dy = o.y - f.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const attackThreshold = ATTACK_RANGE + FIGHTER_RADIUS * 2;

      if (
        dist < attackThreshold &&
        f.hitStun === 0 &&
        f.hurtTimer === 0 &&
        o.hitStun === 0 &&
        (now - f.lastAttack) > MIN_ATTACK_INTERVAL
      ) {
        f.lastAttack = now;
        f.state = 'attack';
        f.attackTimer = ATTACK_STATE_FRAMES;

        const nx = dx / Math.max(dist, 0.01);
        const ny = dy / Math.max(dist, 0.01);

        o.vx = nx * KNOCKBACK_FORCE + randRange(-2, 2);
        o.vy = ny * KNOCKBACK_FORCE + randRange(-2, 2);
        o.hitStun = HIT_STUN_FRAMES;
        o.hurtTimer = HURT_STATE_FRAMES;

        f.vx = -nx * KNOCKBACK_FORCE * 0.35;
        f.vy = -ny * KNOCKBACK_FORCE * 0.35;

        clashed = true;
      }

      return { f, o, clashed };
    };

    // Random thứ tự update mỗi frame
    let newPlayer: FighterData;
    let newBoss: FighterData;
    let clashed = false;

    if (Math.random() < 0.5) {
      const r1 = update(player, boss);
      newPlayer = r1.f;
      clashed = r1.clashed;
      const r2 = update(r1.o, newPlayer);
      newBoss = r2.f;
      newPlayer = r2.o;
      clashed = clashed || r2.clashed;
    } else {
      const r1 = update(boss, player);
      newBoss = r1.f;
      clashed = r1.clashed;
      const r2 = update(r1.o, newBoss);
      newPlayer = r2.f;
      newBoss = r2.o;
      clashed = clashed || r2.clashed;
    }

    // Update shared values
    playerData.value = newPlayer;
    bossData.value = newBoss;

    pX.value = newPlayer.x - FIGHTER_RADIUS;
    pY.value = newPlayer.y - FIGHTER_RADIUS;
    bX.value = newBoss.x - FIGHTER_RADIUS;
    bY.value = newBoss.y - FIGHTER_RADIUS;

    // Sync states → JS thread (chỉ khi thay đổi)
    if (newPlayer.state !== lastPState.value) {
      lastPState.value = newPlayer.state;
      runOnJS(setPlayerState)(newPlayer.state);
    }
    if (newBoss.state !== lastBState.value) {
      lastBState.value = newBoss.state;
      runOnJS(setBossState)(newBoss.state);
    }

    // Trigger clash callback
    if (clashed) {
      runOnJS(handleClash)();
    }
  });

  // ── APPLY HIT RESULT ─────────────────────────────────────
  const applyHitResult = useCallback((whoGotHit: 'player' | 'boss') => {
    if (whoGotHit === 'boss') {
      setPlayerState('attack');
      setBossState('hurt');
    } else {
      setPlayerState('hurt');
      setBossState('attack');
    }
  }, []);

  // ── RESET PHYSICS ─────────────────────────────────────────
  const resetPhysics = useCallback((playerSpeed: number, bossSpeed: number) => {
    const player = createFighter(mapSize, true);
    const boss = createFighter(mapSize, false);

    // Scale vận tốc theo speed stat
    const pSpeedScale = 1 + (playerSpeed * 0.03);
    const bSpeedScale = 1 + (bossSpeed * 0.03);
    player.vx *= pSpeedScale;
    player.vy *= pSpeedScale;
    boss.vx *= bSpeedScale;
    boss.vy *= bSpeedScale;

    playerData.value = player;
    bossData.value = boss;

    pX.value = player.x - FIGHTER_RADIUS;
    pY.value = player.y - FIGHTER_RADIUS;
    bX.value = boss.x - FIGHTER_RADIUS;
    bY.value = boss.y - FIGHTER_RADIUS;

    setPlayerState('idle');
    setBossState('idle');
    setScreenFlash(false);
    setIsRunning(true);
    running.value = true;

    lastPState.value = 'idle';
    lastBState.value = 'idle';
  }, [mapSize]);

  const stopPhysics = useCallback(() => {
    setIsRunning(false);
    running.value = false;
  }, []);

  return {
    pX, pY, bX, bY,
    playerState,
    bossState,
    playerBounceGlow,
    bossBounceGlow,
    screenFlash,
    isRunning,
    applyHitResult,
    resetPhysics,
    stopPhysics,
    FIGHTER_RADIUS,
    ATTACK_RANGE,
  };
};
