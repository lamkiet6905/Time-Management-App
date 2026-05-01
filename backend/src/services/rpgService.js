/**
 * RPG Engine – Handles EXP, leveling, HP, buffs, and streak logic.
 */

const { User, UserBuff, Buff } = require('../models');
const { Op } = require('sequelize');

// EXP required to reach the next level
function expToNextLevel(level) {
  return Math.floor(100 * Math.pow(1.2, level - 1));
}

// Base EXP/HP rewards per difficulty
const DIFFICULTY_CONFIG = {
  easy:   { baseExp: 20,  hpPenalty: 5  },
  normal: { baseExp: 50,  hpPenalty: 10 },
  hard:   { baseExp: 100, hpPenalty: 20 },
  epic:   { baseExp: 200, hpPenalty: 35 },
};

// Max HP per milestone level (every 10 levels +20)
function maxHpForLevel(level) {
  return 100 + Math.floor((level - 1) / 10) * 20;
}

/**
 * Calculate EXP reward with streak bonus and active buffs.
 */
async function calculateExpReward(user, baseExp) {
  let multiplier = 1.0;

  // Streak bonus
  if (user.streak_days >= 30) multiplier += 0.5;
  else if (user.streak_days >= 7) multiplier += 0.25;
  else if (user.streak_days >= 3) multiplier += 0.1;

  // Active buffs
  const activeBuffs = await UserBuff.findAll({
    where: { user_id: user.id, is_active: true },
    include: ['Buff'],
  });

  for (const ub of activeBuffs) {
    if (!ub.Buff) continue;
    if (ub.Buff.effect_type === 'exp_multiplier') {
      multiplier += parseFloat(ub.Buff.effect_value) / 100;
    }
    if (ub.Buff.effect_type === 'double_exp') {
      multiplier *= 2;
      // Consume one-time buff
      if (ub.Buff.is_one_time) {
        await ub.update({ is_active: false });
      }
    }
  }

  return Math.floor(baseExp * multiplier);
}

/**
 * Calculate HP penalty with active buffs.
 */
async function calculateHpPenalty(user, basePenalty, difficulty) {
  const activeBuffs = await UserBuff.findAll({
    where: { user_id: user.id, is_active: true },
    include: ['Buff'],
  });

  for (const ub of activeBuffs) {
    if (!ub.Buff) continue;
    if (ub.Buff.effect_type === 'hp_shield') {
      const reduction = parseFloat(ub.Buff.effect_value) / 100;
      basePenalty = Math.floor(basePenalty * (1 - reduction));
    }
    if (ub.Buff.effect_type === 'no_penalty' && ['easy', 'normal'].includes(difficulty)) {
      return 0;
    }
  }

  return basePenalty;
}

/**
 * Apply EXP gain and handle level-up logic.
 * Returns { leveled_up, new_level, levels_gained, new_exp, new_exp_to_next }
 */
async function gainExp(user, expAmount) {
  let currentExp = user.exp + expAmount;
  let currentLevel = user.level;
  let levelsGained = 0;

  while (currentExp >= user.exp_to_next) {
    currentExp -= user.exp_to_next;
    currentLevel += 1;
    levelsGained += 1;
    const newMaxHp = maxHpForLevel(currentLevel);
    // Update on each level
    user.exp_to_next = expToNextLevel(currentLevel);
    user.max_hp = newMaxHp;
    // Restore some HP on level up
    user.hp = Math.min(user.hp + 20, newMaxHp);
  }

  const leveledUp = levelsGained > 0;
  await user.update({
    exp: currentExp,
    level: currentLevel,
    exp_to_next: expToNextLevel(currentLevel),
    max_hp: maxHpForLevel(currentLevel),
    hp: user.hp,
    pending_level_up: leveledUp || user.pending_level_up,
  });

  return {
    leveled_up: leveledUp,
    levels_gained: levelsGained,
    new_level: currentLevel,
    new_exp: currentExp,
    new_exp_to_next: expToNextLevel(currentLevel),
  };
}

/**
 * Apply HP damage. If HP reaches 0, lose 1 level.
 * Returns { died, new_hp, level_lost }
 */
async function takeDamage(user, damage) {
  let newHp = Math.max(0, user.hp - damage);
  let died = false;
  let levelLost = false;

  if (newHp === 0 && user.hp > 0) {
    died = true;
    // Lose 1 level but not below 1
    if (user.level > 1) {
      const newLevel = user.level - 1;
      await user.update({
        hp: Math.floor(maxHpForLevel(newLevel) * 0.5), // Revive at 50% HP
        level: newLevel,
        exp_to_next: expToNextLevel(newLevel),
        max_hp: maxHpForLevel(newLevel),
      });
      levelLost = true;
    } else {
      await user.update({ hp: 1 }); // Minimum 1 HP at level 1
    }
  } else {
    await user.update({ hp: newHp });
  }

  return { died, new_hp: user.hp, level_lost: levelLost };
}

/**
 * Update streak when a task is completed.
 */
async function updateStreak(user) {
  const today = new Date().toISOString().slice(0, 10);
  const lastActive = user.last_active_date;

  if (!lastActive || lastActive !== today) {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    const newStreak = lastActive === yesterday ? user.streak_days + 1 : 1;
    await user.update({
      streak_days: newStreak,
      last_active_date: today,
    });
    return newStreak;
  }
  return user.streak_days;
}

/**
 * Generate 3 random buff options for level-up selection.
 */
async function getBuffOptions(user) {
  // Get all buffs available for user's level
  const allBuffs = await Buff.findAll({
    where: {
      min_level: { [Op.lte]: user.level },
    },
  });

  // Shuffle and pick 3
  const shuffled = allBuffs.sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

module.exports = {
  DIFFICULTY_CONFIG,
  expToNextLevel,
  maxHpForLevel,
  calculateExpReward,
  calculateHpPenalty,
  gainExp,
  takeDamage,
  updateStreak,
  getBuffOptions,
};
