// ══════════════════════════════════════════════════════════════════
// GAME FORMULAS — Tất cả công thức toán học cốt lõi của LifeRPG
// ══════════════════════════════════════════════════════════════════

// ── Diminishing Returns (Habits) ──────────────────────────────
// Khi bấm liên tục nút (+) trong cùng 1 ngày, reward giảm dần
// Công thức: reward = base × (0.5 ^ clicksToday)
// Tối thiểu: 0.01 EXP / 0.01 Gold (không bao giờ về 0)
function calcHabitReward(baseReward, clicksToday) {
  return Math.max(0.01, baseReward * Math.pow(0.5, clicksToday));
}

// ── EXP cần để lên Level ─────────────────────────────────────
// Công thức phi tuyến: expNeeded = 100 × level^1.5
// Level 1→2: 100 EXP | Level 5→6: 1118 EXP | Level 10→11: 3162 EXP
function expToNextLevel(level) {
  return Math.floor(100 * Math.pow(level, 1.5));
}

// ── Bonus chỉ số khi lên Level ───────────────────────────────
// Mỗi lần level up: Max_HP +10, Speed +5, Strength +8
function getLevelUpBonus() {
  return { max_hp: 10, speed: 5, strength: 8 };
}

// ── Bản đồ Buff nội tại ──────────────────────────────────────
// Mở khóa tự động mỗi 5 level
// Level 5:  Vampiric Strike — Hồi 10% damage dealt thành HP
// Level 10: Critical Focus  — 15% tỷ lệ gây x2 damage
// Level 15: Iron Shield     — Giảm 20% damage nhận vào
const BUFF_UNLOCK_MAP = {
  5:  'vampiric_strike',
  10: 'critical_focus',
  15: 'iron_shield',
};

// Thông tin chi tiết từng buff (dùng cho frontend hiển thị)
const BUFF_INFO = {
  vampiric_strike: {
    name: 'Hút Máu',
    description: 'Hồi 10% sát thương gây ra thành HP',
    icon: 'water',          // Ionicons name
    color: '#EF4444',       // Đỏ máu
    effect: 0.10,           // 10%
  },
  critical_focus: {
    name: 'Chí Mạng',
    description: '15% tỷ lệ gây x2 sát thương',
    icon: 'flash',
    color: '#F59E0B',       // Vàng
    effect: 0.15,           // 15% chance
  },
  iron_shield: {
    name: 'Khiên Sắt',
    description: 'Giảm 20% sát thương nhận vào',
    icon: 'shield',
    color: '#3B82F6',       // Xanh dương
    effect: 0.20,           // 20% reduction
  },
};

// ── Nhân thưởng To-Do quá hạn ────────────────────────────────
// Trì hoãn càng lâu → reward càng cao khi hoàn thành (động lực clear nợ)
// Công thức: multiplier = 1 + (daysOverdue × 0.1), giới hạn 3x
function calcTodoMultiplier(daysOverdue) {
  return Math.min(3.0, 1 + daysOverdue * 0.1);
}

// ── HP bị trừ khi miss Daily ─────────────────────────────────
// Mỗi daily không hoàn thành → trừ HP = 10 × hệ số độ khó
const DIFFICULTY_WEIGHT = {
  trivial: 0.5,   // Rất dễ — trừ ít
  easy:    1.0,
  medium:  1.5,
  hard:    2.0,    // Khó — trừ nhiều
};

function calcDailyPenalty(difficulty) {
  return Math.floor(10 * (DIFFICULTY_WEIGHT[difficulty] || 1));
}

// ── Tính sát thương trong Arena ──────────────────────────────
// baseDamage = strength của attacker
// isCritical: roll ngẫu nhiên, nếu có buff critical_focus → 15% chance
// hasIronShield: defender có buff iron_shield → giảm 20%
function calcBattleDamage(strength, isCritical, hasIronShield) {
  let damage = strength;
  if (isCritical) damage *= 2;                // Chí mạng x2
  if (hasIronShield) damage *= (1 - 0.20);    // Khiên giảm 20%
  return Math.floor(damage);
}

// ── Kiểm tra chí mạng ───────────────────────────────────────
// Roll random 0-1, nếu < 0.15 (15%) thì critical
function rollCritical(hasCriticalBuff) {
  if (!hasCriticalBuff) return false;
  return Math.random() < BUFF_INFO.critical_focus.effect;
}

// ── Tính HP hồi từ Vampiric Strike ──────────────────────────
function calcVampiricHeal(damageDealt, hasVampiricBuff) {
  if (!hasVampiricBuff) return 0;
  return Math.floor(damageDealt * BUFF_INFO.vampiric_strike.effect);
}

// ── Reward cơ bản theo độ khó ────────────────────────────────
const BASE_REWARDS = {
  trivial: { exp: 5,  gold: 1.00 },
  easy:    { exp: 10, gold: 5.00 },
  medium:  { exp: 15, gold: 10.00 },
  hard:    { exp: 25, gold: 20.00 },
};

function getBaseReward(difficulty) {
  return BASE_REWARDS[difficulty] || BASE_REWARDS.medium;
}

module.exports = {
  calcHabitReward,
  expToNextLevel,
  getLevelUpBonus,
  BUFF_UNLOCK_MAP,
  BUFF_INFO,
  calcTodoMultiplier,
  calcDailyPenalty,
  DIFFICULTY_WEIGHT,
  calcBattleDamage,
  rollCritical,
  calcVampiricHeal,
  getBaseReward,
  BASE_REWARDS,
};
