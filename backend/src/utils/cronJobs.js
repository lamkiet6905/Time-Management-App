const cron = require('node-cron');
const { Task, User, UserBuff, Buff } = require('../models');
const { Op } = require('sequelize');
const rpgService = require('../services/rpgService');

function init() {
  // Run daily at 00:05 Vietnam time (17:05 UTC)
  cron.schedule('5 17 * * *', async () => {
    console.log('⏰ [Cron] Running daily HP deduction...');
    await runDailyHpDeduction();
  });

  // Expire buffs every hour
  cron.schedule('0 * * * *', async () => {
    await expireBuffs();
  });

  console.log('✅ Cron jobs scheduled');
}

async function runDailyHpDeduction() {
  try {
    const now = new Date();
    const overdueThreshold = new Date(now.getTime() - 60000); // 1 minute grace

    // Find all overdue tasks that are still pending
    const overdueTasks = await Task.findAll({
      where: {
        status: 'pending',
        due_date: { [Op.lt]: overdueThreshold },
      },
    });

    const userPenalties = {};
    for (const task of overdueTasks) {
      if (!userPenalties[task.user_id]) {
        userPenalties[task.user_id] = 0;
      }
      userPenalties[task.user_id] += task.hp_penalty;
      await task.update({ status: 'failed' });
      await User.increment('total_tasks_failed', { where: { id: task.user_id } });
    }

    // Apply HP deductions
    for (const [userId, damage] of Object.entries(userPenalties)) {
      const user = await User.findByPk(userId);
      if (user) {
        const actualDamage = await rpgService.calculateHpPenalty(user, damage, 'normal');
        await rpgService.takeDamage(user, actualDamage);
        console.log(`  👤 User ${user.username}: -${actualDamage} HP (${overdueTasks.filter(t => t.user_id === userId).length} tasks failed)`);
      }
    }

    // Break streaks for users with no completion today
    const today = new Date().toISOString().slice(0, 10);
    const inactiveUsers = await User.findAll({
      where: {
        last_active_date: { [Op.lt]: today },
        streak_days: { [Op.gt]: 0 },
      },
    });

    for (const user of inactiveUsers) {
      await user.update({ streak_days: 0 });
      console.log(`  💔 Streak reset for ${user.username}`);
    }

    // HP regen buff
    const hpRegenBuffs = await UserBuff.findAll({
      where: { is_active: true },
      include: [{ model: Buff, as: 'Buff', where: { effect_type: 'hp_regen' } }],
    });
    for (const ub of hpRegenBuffs) {
      const user = await User.findByPk(ub.user_id);
      if (user) {
        const regenAmount = parseInt(ub.Buff.effect_value);
        const newHp = Math.min(user.hp + regenAmount, user.max_hp);
        await user.update({ hp: newHp });
      }
    }

    console.log('✅ [Cron] Daily HP deduction complete');
  } catch (error) {
    console.error('❌ [Cron] Daily HP deduction error:', error);
  }
}

async function expireBuffs() {
  try {
    await UserBuff.update(
      { is_active: false },
      {
        where: {
          is_active: true,
          expires_at: { [Op.lt]: new Date() },
        },
      }
    );
  } catch (error) {
    console.error('❌ [Cron] Expire buffs error:', error);
  }
}

module.exports = { init };
