const TaskService = require('../services/taskService');

// ══════════════════════════════════════════════════════════════════
// TASK CONTROLLER — HTTP handlers cho quản lý Tasks
// ══════════════════════════════════════════════════════════════════

const TaskController = {

  // POST /tasks — Tạo task mới
  async create(req, res) {
    try {
      const task = await TaskService.createTask(req.user.id, req.body);
      return res.status(201).json({
        success: true,
        message: 'Tạo task thành công',
        data: task,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /tasks?type=habit|daily|todo — Lấy tasks (lọc theo type nếu có)
  async getAll(req, res) {
    try {
      const { type } = req.query;
      let tasks;
      if (type && ['habit', 'daily', 'todo'].includes(type)) {
        tasks = await TaskService.getTasksByType(req.user.id, type);
      } else {
        tasks = await TaskService.getAllTasks(req.user.id);
      }
      return res.status(200).json({
        success: true,
        data: tasks,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // PUT /tasks/:id — Cập nhật task
  async update(req, res) {
    try {
      const task = await TaskService.updateTask(
        parseInt(req.params.id), req.user.id, req.body
      );
      return res.status(200).json({
        success: true,
        message: 'Cập nhật task thành công',
        data: task,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // DELETE /tasks/:id — Xóa task
  async delete(req, res) {
    try {
      await TaskService.deleteTask(parseInt(req.params.id), req.user.id);
      return res.status(200).json({
        success: true,
        message: 'Xóa task thành công',
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // ═══════════════════════════════════════════════════════════
  // POST /tasks/:id/score — Bấm +/- Habit
  // Body: { direction: 'positive' | 'negative' }
  // ═══════════════════════════════════════════════════════════
  async scoreHabit(req, res) {
    try {
      const { direction } = req.body;
      if (!['positive', 'negative'].includes(direction)) {
        return res.status(400).json({
          success: false,
          message: 'direction phải là "positive" hoặc "negative"',
        });
      }

      const result = await TaskService.scoreHabit(
        req.user.id, parseInt(req.params.id), direction
      );

      return res.status(200).json({
        success: true,
        message: direction === 'positive'
          ? `+${result.expEarned} EXP, +${result.goldEarned} Gold`
          : 'Thói quen xấu, -5 HP',
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // ═══════════════════════════════════════════════════════════
  // POST /tasks/:id/complete-daily — Hoàn thành Daily
  // ═══════════════════════════════════════════════════════════
  async completeDaily(req, res) {
    try {
      const result = await TaskService.completeDaily(
        req.user.id, parseInt(req.params.id)
      );
      return res.status(200).json({
        success: true,
        message: `+${result.expEarned} EXP, +${result.goldEarned} Gold, Streak: ${result.newStreak}`,
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // POST /tasks/:id/uncomplete-daily — Bỏ hoàn thành Daily
  async uncompleteDaily(req, res) {
    try {
      await TaskService.uncompleteDaily(req.user.id, parseInt(req.params.id));
      return res.status(200).json({
        success: true,
        message: 'Đã bỏ hoàn thành daily',
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // ═══════════════════════════════════════════════════════════
  // POST /tasks/:id/complete-todo — Hoàn thành To-Do
  // ═══════════════════════════════════════════════════════════
  async completeTodo(req, res) {
    try {
      const result = await TaskService.completeTodo(
        req.user.id, parseInt(req.params.id)
      );

      let msg = `+${result.expEarned} EXP, +${result.goldEarned} Gold`;
      if (result.multiplier > 1) {
        msg += ` (x${result.multiplier.toFixed(1)} bonus — quá hạn ${result.daysOverdue} ngày)`;
      }

      return res.status(200).json({
        success: true,
        message: msg,
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = TaskController;
