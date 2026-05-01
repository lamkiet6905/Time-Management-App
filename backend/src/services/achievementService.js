/**
 * Achievement Service – Checks and unlocks achievements for a user.
 */

const { User, Task, Achievement, UserAchievement } = require('../models');
const { Op } = require('sequelize');

// All achievement definitions
const ACHIEVEMENT_RULES = [
  // === TASKS ===
  { id: 'first_task',    condition_type: 'tasks_completed', condition_value: 1   },
  { id: 'task_10',       condition_type: 'tasks_completed', condition_value: 10  },
  { id: 'task_50',       condition_type: 'tasks_completed', condition_value: 50  },
  { id: 'task_100',      condition_type: 'tasks_completed', condition_value: 100 },
  { id: 'task_500',      condition_type: 'tasks_completed', condition_value: 500 },
  { id: 'epic_slayer',   condition_type: 'epic_tasks',      condition_value: 10  },
  { id: 'ai_user',       condition_type: 'ai_tasks',        condition_value: 5   },
  { id: 'night_owl',     condition_type: 'night_tasks',     condition_value: 10  },
  { id: 'early_bird',    condition_type: 'morning_tasks',   condition_value: 10  },
  // === STREAK ===
  { id: 'streak_3',      condition_type: 'streak_days',     condition_value: 3   },
  { id: 'streak_7',      condition_type: 'streak_days',     condition_value: 7   },
  { id: 'streak_30',     condition_type: 'streak_days',     condition_value: 30  },
  { id: 'streak_100',    condition_type: 'streak_days',     condition_value: 100 },
  // === LEVEL ===
  { id: 'level_5',       condition_type: 'level_reached',   condition_value: 5   },
  { id: 'level_10',      condition_type: 'level_reached',   condition_value: 10  },
  { id: 'level_25',      condition_type: 'level_reached',   condition_value: 25  },
  { id: 'level_50',      condition_type: 'level_reached',   condition_value: 50  },
  { id: 'level_100',     condition_type: 'level_reached',   condition_value: 100 },
  // === SPECIAL ===
  { id: 'comeback',      condition_type: 'hp_zero_recover', condition_value: 1   },
  { id: 'perfectionist', condition_type: 'no_fail_days',    condition_value: 30  },
];

/**
 * Get dynamic counter for a condition type.
 */
async function getConditionCount(userId, conditionType, user) {
  switch (conditionType) {
    case 'tasks_completed':
      return user.total_tasks_completed;
    case 'streak_days':
      return user.streak_days;
    case 'level_reached':
      return user.level;
    case 'epic_tasks':
      return await Task.count({
        where: { user_id: userId, status: 'done', difficulty: 'epic' },
      });
    case 'ai_tasks':
      return await Task.count({
        where: { user_id: userId, status: 'done', source: 'ai' },
      });
    case 'night_tasks': {
      const tasks = await Task.findAll({
        where: { user_id: userId, status: 'done', completed_at: { [Op.not]: null } },
        attributes: ['completed_at'],
      });
      return tasks.filter(t => {
        const h = new Date(t.completed_at).getHours();
        return h >= 22 || h < 4;
      }).length;
    }
    case 'morning_tasks': {
      const tasks = await Task.findAll({
        where: { user_id: userId, status: 'done', completed_at: { [Op.not]: null } },
        attributes: ['completed_at'],
      });
      return tasks.filter(t => {
        const h = new Date(t.completed_at).getHours();
        return h >= 5 && h < 8;
      }).length;
    }
    default:
      return 0;
  }
}

/**
 * Check all achievements for a user and unlock any newly earned ones.
 * Returns array of newly unlocked achievements.
 */
async function checkAndUnlockAchievements(userId) {
  const user = await User.findByPk(userId);
  if (!user) return [];

  // Get already unlocked achievement IDs
  const unlocked = await UserAchievement.findAll({ where: { user_id: userId } });
  const unlockedIds = new Set(unlocked.map(u => u.achievement_id));

  const newlyUnlocked = [];

  for (const rule of ACHIEVEMENT_RULES) {
    if (unlockedIds.has(rule.id)) continue;

    const count = await getConditionCount(userId, rule.condition_type, user);
    if (count >= rule.condition_value) {
      // Unlock it
      await UserAchievement.create({
        user_id: userId,
        achievement_id: rule.id,
      });

      // Grant EXP reward
      const achievement = await Achievement.findByPk(rule.id);
      if (achievement && achievement.exp_reward > 0) {
        await user.increment('exp', { by: achievement.exp_reward });
      }

      newlyUnlocked.push(rule.id);
    }
  }

  return newlyUnlocked;
}

module.exports = { checkAndUnlockAchievements, ACHIEVEMENT_RULES };
