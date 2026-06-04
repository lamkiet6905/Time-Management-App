const TaskModel = require('../models/taskModel');
const CharacterModel = require('../models/characterModel');
const { calcHabitReward, calcTodoMultiplier, getBaseReward } = require('../utils/gameFormulas');

// ══════════════════════════════════════════════════════════════════
// TASK SERVICE — Business logic quản lý Tasks
// Xử lý: Diminishing Returns, EXP/Gold rewards, Level Up check
// ══════════════════════════════════════════════════════════════════

const TaskService = {

  // ── Tạo task mới ────────────────────────────────────────────
  async createTask(userId, data) {
    // Gán reward mặc định theo độ khó
    const baseReward = getBaseReward(data.difficulty || 'medium');
    data.base_exp_reward = data.base_exp_reward || baseReward.exp;
    data.base_gold_reward = data.base_gold_reward || baseReward.gold;

    const taskId = await TaskModel.create(userId, data);
    return TaskModel.findById(taskId);
  },

  // ── Lấy tasks theo loại ────────────────────────────────────
  async getTasksByType(userId, type) {
    return TaskModel.getByUserAndType(userId, type);
  },

  // ── Lấy tất cả tasks ──────────────────────────────────────
  async getAllTasks(userId) {
    return TaskModel.getAllByUser(userId);
  },

  // ── Cập nhật task ──────────────────────────────────────────
  async updateTask(taskId, userId, data) {
    const task = await TaskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      throw new Error('Task không tồn tại hoặc không thuộc về bạn');
    }
    await TaskModel.update(taskId, data);
    return TaskModel.findById(taskId);
  },

  // ── Xóa task ───────────────────────────────────────────────
  async deleteTask(taskId, userId) {
    const task = await TaskModel.findById(taskId);
    if (!task || task.user_id !== userId) {
      throw new Error('Task không tồn tại hoặc không thuộc về bạn');
    }
    await TaskModel.delete(taskId);
  },

  // ═══════════════════════════════════════════════════════════
  // SCORE HABIT — Logic Diminishing Returns
  // Mỗi lần bấm (+) trong ngày, reward giảm 50%
  // Bấm lần 1: 100% | Lần 2: 50% | Lần 3: 25% | ... → min 0.01
  // ═══════════════════════════════════════════════════════════
  async scoreHabit(userId, taskId, direction) {
    const task = await TaskModel.findById(taskId);
    if (!task || task.user_id !== userId || task.type !== 'habit') {
      throw new Error('Habit không hợp lệ');
    }

    let expEarned = 0;
    let goldEarned = 0;
    let levelUpResult = null;

    if (direction === 'positive') {
      // Đếm clicks hôm nay → tính diminishing reward
      const clicksToday = await TaskModel.getHabitClicksToday(taskId);
      expEarned = calcHabitReward(task.base_exp_reward, clicksToday);
      goldEarned = calcHabitReward(task.base_gold_reward, clicksToday);

      // Cập nhật count + timestamp
      await TaskModel.update(taskId, {
        positive_count: task.positive_count + 1,
        last_positive_at: new Date(),
      });

      // Cộng EXP + Gold cho user, kiểm tra level up
      levelUpResult = await CharacterModel.addExp(userId, Math.floor(expEarned));
      await CharacterModel.addGold(userId, goldEarned);

    } else if (direction === 'negative') {
      // Bấm (-) → trừ HP thay vì trừ EXP
      await CharacterModel.updateHP(userId, -5);
      await TaskModel.update(taskId, {
        negative_count: task.negative_count + 1,
      });
    }

    // Ghi log
    await TaskModel.logHabitClick(taskId, userId, direction, Math.floor(expEarned), goldEarned);

    return {
      direction,
      expEarned: Math.floor(expEarned),
      goldEarned: parseFloat(goldEarned.toFixed(2)),
      levelUp: levelUpResult,
    };
  },

  // ═══════════════════════════════════════════════════════════
  // COMPLETE DAILY — Tăng streak + nhận reward
  // ═══════════════════════════════════════════════════════════
  async completeDaily(userId, taskId) {
    const task = await TaskModel.findById(taskId);
    if (!task || task.user_id !== userId || task.type !== 'daily') {
      throw new Error('Daily không hợp lệ');
    }
    if (task.is_completed_today) {
      throw new Error('Daily này đã hoàn thành hôm nay rồi');
    }

    await TaskModel.completeDaily(taskId);

    // Nhận reward
    const levelUpResult = await CharacterModel.addExp(userId, task.base_exp_reward);
    await CharacterModel.addGold(userId, task.base_gold_reward);

    return {
      expEarned: task.base_exp_reward,
      goldEarned: task.base_gold_reward,
      newStreak: task.streak + 1,
      levelUp: levelUpResult,
    };
  },

  // ── Bỏ hoàn thành Daily (undo) ────────────────────────────
  async uncompleteDaily(userId, taskId) {
    const task = await TaskModel.findById(taskId);
    if (!task || task.user_id !== userId || task.type !== 'daily') {
      throw new Error('Daily không hợp lệ');
    }
    await TaskModel.uncompleteDaily(taskId);
  },

  // ═══════════════════════════════════════════════════════════
  // COMPLETE TO-DO — Nhân thưởng theo số ngày quá hạn
  // Trì hoãn 5 ngày → reward x1.5 (động lực clear nợ)
  // ═══════════════════════════════════════════════════════════
  async completeTodo(userId, taskId) {
    const task = await TaskModel.findById(taskId);
    if (!task || task.user_id !== userId || task.type !== 'todo') {
      throw new Error('To-Do không hợp lệ');
    }
    if (task.is_done) {
      throw new Error('To-Do này đã hoàn thành rồi');
    }

    // Tính số ngày quá hạn
    let daysOverdue = 0;
    if (task.due_date) {
      const now = new Date();
      const due = new Date(task.due_date);
      const diff = Math.floor((now - due) / (1000 * 60 * 60 * 24));
      daysOverdue = Math.max(0, diff);
    }

    // Nhân thưởng: trì hoãn càng lâu, reward càng cao (max 3x)
    const multiplier = calcTodoMultiplier(daysOverdue);
    const expEarned = Math.floor(task.base_exp_reward * multiplier);
    const goldEarned = parseFloat((task.base_gold_reward * multiplier).toFixed(2));

    await TaskModel.completeTodo(taskId);

    // Cộng reward
    const levelUpResult = await CharacterModel.addExp(userId, expEarned);
    await CharacterModel.addGold(userId, goldEarned);

    return {
      expEarned,
      goldEarned,
      multiplier,
      daysOverdue,
      levelUp: levelUpResult,
    };
  },
};

module.exports = TaskService;
