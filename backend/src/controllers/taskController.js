const { Task, User } = require('../models');
const { Op } = require('sequelize');
const aiService = require('../services/aiService');
const rpgService = require('../services/rpgService');
const achievementService = require('../services/achievementService');

// GET /api/tasks
async function getTasks(req, res) {
  try {
    const { date, status, start_date, end_date } = req.query;
    const where = { user_id: req.userId };

    if (status) where.status = status;

    if (date) {
      const d = new Date(date);
      const nextDay = new Date(d.getTime() + 86400000);
      where.due_date = { [Op.between]: [d, nextDay] };
    } else if (start_date && end_date) {
      where.due_date = { [Op.between]: [new Date(start_date), new Date(end_date)] };
    }

    const tasks = await Task.findAll({
      where,
      order: [['due_date', 'ASC'], ['created_at', 'DESC']],
    });

    res.json({ success: true, data: tasks });
  } catch (error) {
    console.error('getTasks error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// POST /api/tasks
async function createTask(req, res) {
  try {
    const { title, description, due_date, priority, tags, difficulty: manualDifficulty, duration_minutes } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Tiêu đề task là bắt buộc' });
    }

    let difficulty = manualDifficulty;
    if (!difficulty) {
      try {
        const evalResult = await aiService.evaluateDifficulty({ title, description, duration_minutes, priority, tags });
        difficulty = evalResult.difficulty;
      } catch {
        difficulty = 'normal';
      }
    }

    const { baseExp, hpPenalty } = rpgService.DIFFICULTY_CONFIG[difficulty] || rpgService.DIFFICULTY_CONFIG.normal;

    const task = await Task.create({
      user_id: req.userId,
      title,
      description,
      due_date: due_date ? new Date(due_date) : null,
      priority: priority || 'medium',
      difficulty,
      exp_reward: baseExp,
      hp_penalty: hpPenalty,
      tags: tags || [],
      duration_minutes: duration_minutes || null,
      source: 'manual',
    });

    res.status(201).json({ success: true, data: task });
  } catch (error) {
    console.error('createTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// PUT /api/tasks/:id
async function updateTask(req, res) {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });
    if (task.status === 'done') return res.status(400).json({ success: false, message: 'Không thể sửa task đã hoàn thành' });

    const { title, description, due_date, priority, tags, duration_minutes } = req.body;
    await task.update({
      title: title ?? task.title,
      description: description ?? task.description,
      due_date: due_date ? new Date(due_date) : task.due_date,
      priority: priority ?? task.priority,
      tags: tags ?? task.tags,
      duration_minutes: duration_minutes ?? task.duration_minutes,
    });

    res.json({ success: true, data: task });
  } catch (error) {
    console.error('updateTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// DELETE /api/tasks/:id
async function deleteTask(req, res) {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });

    await task.destroy();
    res.json({ success: true, message: 'Đã xóa task' });
  } catch (error) {
    console.error('deleteTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// PATCH /api/tasks/:id/complete
async function completeTask(req, res) {
  try {
    const task = await Task.findOne({ where: { id: req.params.id, user_id: req.userId } });
    if (!task) return res.status(404).json({ success: false, message: 'Task không tồn tại' });
    if (task.status === 'done') return res.status(400).json({ success: false, message: 'Task đã hoàn thành rồi' });

    const user = await User.findByPk(req.userId);

    // Calculate EXP with buffs and streak
    const expGained = await rpgService.calculateExpReward(user, task.exp_reward);

    // Update streak
    const newStreak = await rpgService.updateStreak(user);

    // Gain EXP and check level
    const levelResult = await rpgService.gainExp(user, expGained);

    // Increment completed count
    await user.increment('total_tasks_completed');

    // Mark task done
    await task.update({ status: 'done', completed_at: new Date() });

    // Check achievements
    const newAchievements = await achievementService.checkAndUnlockAchievements(req.userId);

    await user.reload();
    res.json({
      success: true,
      message: 'Hoàn thành task! 🎉',
      data: {
        task,
        exp_gained: expGained,
        streak_days: newStreak,
        level_up: levelResult,
        new_achievements: newAchievements,
        user: {
          level: user.level,
          exp: user.exp,
          exp_to_next: user.exp_to_next,
          hp: user.hp,
          max_hp: user.max_hp,
          streak_days: user.streak_days,
          pending_level_up: user.pending_level_up,
        },
      },
    });
  } catch (error) {
    console.error('completeTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// POST /api/tasks/ai-parse
async function aiParseTask(req, res) {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ success: false, message: 'Text là bắt buộc' });

    let parsed;
    let aiAvailable = true;
    try {
      parsed = await aiService.parseTaskFromText(text);
    } catch (aiError) {
      if (aiError.message.includes('GEMINI_API_KEY')) {
        aiAvailable = false;
        parsed = { title: text.slice(0, 60), due_date: null, duration_minutes: null, tags: [], priority: 'medium', description: null };
      } else {
        throw aiError;
      }
    }

    let difficulty = 'normal';
    let difficultyReason = '';
    if (aiAvailable) {
      try {
        const evalResult = await aiService.evaluateDifficulty({ ...parsed });
        difficulty = evalResult.difficulty;
        difficultyReason = evalResult.reason;
      } catch { difficulty = 'normal'; }
    }

    const { baseExp, hpPenalty } = rpgService.DIFFICULTY_CONFIG[difficulty] || rpgService.DIFFICULTY_CONFIG.normal;

    // Create task from AI
    const task = await Task.create({
      user_id: req.userId,
      title: parsed.title,
      description: parsed.description,
      due_date: parsed.due_date ? new Date(parsed.due_date) : null,
      priority: parsed.priority,
      difficulty,
      exp_reward: baseExp,
      hp_penalty: hpPenalty,
      tags: parsed.tags,
      duration_minutes: parsed.duration_minutes,
      source: 'ai',
      ai_raw_input: text,
    });

    res.status(201).json({
      success: true,
      data: {
        task,
        ai_available: aiAvailable,
        difficulty_reason: difficultyReason,
        parsed_fields: parsed,
      },
    });
  } catch (error) {
    console.error('aiParseTask error:', error);
    res.status(500).json({ success: false, message: 'Lỗi xử lý AI' });
  }
}

// POST /api/tasks/sync  (offline sync)
async function syncTasks(req, res) {
  try {
    const { tasks } = req.body; // Array of offline tasks
    if (!Array.isArray(tasks)) {
      return res.status(400).json({ success: false, message: 'Tasks phải là mảng' });
    }

    const results = [];
    for (const t of tasks) {
      try {
        // Check if already synced by client_id
        const existing = t.client_id
          ? await Task.findOne({ where: { client_id: t.client_id, user_id: req.userId } })
          : null;

        if (existing) {
          results.push({ client_id: t.client_id, synced: true, task_id: existing.id });
          continue;
        }

        const difficulty = t.difficulty || 'normal';
        const { baseExp, hpPenalty } = rpgService.DIFFICULTY_CONFIG[difficulty] || rpgService.DIFFICULTY_CONFIG.normal;

        const task = await Task.create({
          user_id: req.userId,
          title: t.title,
          description: t.description,
          due_date: t.due_date ? new Date(t.due_date) : null,
          priority: t.priority || 'medium',
          difficulty,
          exp_reward: t.exp_reward || baseExp,
          hp_penalty: t.hp_penalty || hpPenalty,
          status: t.status || 'pending',
          source: t.source || 'manual',
          ai_raw_input: t.ai_raw_input || null,
          tags: t.tags || [],
          duration_minutes: t.duration_minutes || null,
          client_id: t.client_id || null,
          completed_at: t.completed_at ? new Date(t.completed_at) : null,
        });

        results.push({ client_id: t.client_id, synced: true, task_id: task.id });
      } catch (err) {
        results.push({ client_id: t.client_id, synced: false, error: err.message });
      }
    }

    res.json({ success: true, data: { results, synced_count: results.filter(r => r.synced).length } });
  } catch (error) {
    console.error('syncTasks error:', error);
    res.status(500).json({ success: false, message: 'Lỗi đồng bộ' });
  }
}

module.exports = { getTasks, createTask, updateTask, deleteTask, completeTask, aiParseTask, syncTasks };
