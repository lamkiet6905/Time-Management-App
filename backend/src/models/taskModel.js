const { pool } = require('../config/db');

// ══════════════════════════════════════════════════════════════════
// TASK MODEL — Truy vấn bảng tasks + habit_logs
// Xử lý CRUD cho Habits, Dailies, To-Dos
// ══════════════════════════════════════════════════════════════════

const TaskModel = {

  // ── Tạo task mới ────────────────────────────────────────────
  async create(userId, data) {
    const {
      type, title, notes = null, difficulty = 'medium',
      repeat_days = '1111111', due_date = null,
      base_exp_reward = 10, base_gold_reward = 5.00,
    } = data;

    const [result] = await pool.execute(
      `INSERT INTO tasks (user_id, type, title, notes, difficulty,
        repeat_days, due_date, base_exp_reward, base_gold_reward)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, type, title, notes, difficulty,
        repeat_days, due_date, base_exp_reward, base_gold_reward]
    );
    return result.insertId;
  },

  // ── Lấy tasks theo user + type ──────────────────────────────
  async getByUserAndType(userId, type) {
    // Với dailies: tự động coi là chưa hoàn thành nếu updated_at không phải hôm nay
    if (type === 'daily') {
      const [rows] = await pool.execute(
        `SELECT *, 
           CASE WHEN is_completed_today = TRUE AND DATE(updated_at) = CURDATE()
                THEN TRUE ELSE FALSE END AS is_completed_today
         FROM tasks WHERE user_id = ? AND type = ? ORDER BY created_at DESC`,
        [userId, type]
      );
      return rows;
    }
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE user_id = ? AND type = ? ORDER BY created_at DESC',
      [userId, type]
    );
    return rows;
  },

  // ── Lấy tất cả tasks của user ──────────────────────────────
  async getAllByUser(userId) {
    // Smart query: dailies tự động reset nếu updated_at ≠ hôm nay
    const [rows] = await pool.execute(
      `SELECT *,
         CASE WHEN type = 'daily' AND is_completed_today = TRUE AND DATE(updated_at) != CURDATE()
              THEN FALSE ELSE is_completed_today END AS is_completed_today
       FROM tasks WHERE user_id = ? ORDER BY type, created_at DESC`,
      [userId]
    );
    return rows;
  },

  // ── Lấy task theo ID ───────────────────────────────────────
  async findById(taskId) {
    const [rows] = await pool.execute(
      'SELECT * FROM tasks WHERE id = ?',
      [taskId]
    );
    return rows[0];
  },

  // ── Cập nhật task ──────────────────────────────────────────
  async update(taskId, data) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(data)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(taskId);
    await pool.execute(
      `UPDATE tasks SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // ── Xóa task ───────────────────────────────────────────────
  async delete(taskId) {
    await pool.execute('DELETE FROM tasks WHERE id = ?', [taskId]);
  },

  // ── Đếm số lần bấm (+) habit hôm nay → Diminishing Returns ─
  async getHabitClicksToday(taskId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM habit_logs
       WHERE task_id = ? AND direction = 'positive'
       AND DATE(logged_at) = CURDATE()`,
      [taskId]
    );
    return rows[0].count;
  },

  // ── Ghi log bấm +/- habit ─────────────────────────────────
  async logHabitClick(taskId, userId, direction, expEarned, goldEarned) {
    await pool.execute(
      `INSERT INTO habit_logs (task_id, user_id, direction, exp_earned, gold_earned)
       VALUES (?, ?, ?, ?, ?)`,
      [taskId, userId, direction, expEarned, goldEarned]
    );
  },

  // ── Hoàn thành Daily → tăng streak ────────────────────────
  async completeDaily(taskId) {
    await pool.execute(
      `UPDATE tasks SET is_completed_today = TRUE, streak = streak + 1,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [taskId]
    );
  },

  // ── Bỏ hoàn thành Daily (undo) ────────────────────────────
  async uncompleteDaily(taskId) {
    await pool.execute(
      `UPDATE tasks SET is_completed_today = FALSE, streak = GREATEST(0, streak - 1),
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [taskId]
    );
  },

  // ── Hoàn thành To-Do ──────────────────────────────────────
  async completeTodo(taskId) {
    await pool.execute(
      `UPDATE tasks SET is_done = TRUE, done_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [taskId]
    );
  },

  // ── CRONJOB: Lấy tất cả dailies chưa hoàn thành hôm nay ──
  // Kết hợp JOIN users để lấy thông tin user_name
  async getIncompleteDailies() {
    const [rows] = await pool.execute(
      `SELECT t.id as task_id, t.user_id, t.difficulty, t.streak,
              u.hp, u.max_hp, u.name as user_name
       FROM tasks t
       JOIN users u ON t.user_id = u.id
       WHERE t.type = 'daily'
         AND t.is_completed_today = FALSE
         AND SUBSTRING(t.repeat_days, DAYOFWEEK(CURDATE()), 1) = '1'`
      // DAYOFWEEK: 1=Sun, 2=Mon... match với repeat_days string
    );
    return rows;
  },

  // ── CRONJOB: Reset tất cả dailies cho ngày mới ────────────
  async resetAllDailies() {
    // Dailies không hoàn thành → reset streak về 0
    await pool.execute(
      `UPDATE tasks SET streak = 0
       WHERE type = 'daily' AND is_completed_today = FALSE`
    );
    // Reset trạng thái hoàn thành cho tất cả dailies
    await pool.execute(
      `UPDATE tasks SET is_completed_today = FALSE WHERE type = 'daily'`
    );
  },

  // ── Đếm tổng tasks đã hoàn thành (cho Achievements) ───────
  async countCompletedTasks(userId) {
    const [rows] = await pool.execute(
      `SELECT
        (SELECT COUNT(*) FROM habit_logs WHERE user_id = ? AND direction = 'positive') +
        (SELECT COUNT(*) FROM tasks WHERE user_id = ? AND type = 'todo' AND is_done = TRUE)
        AS total`,
      [userId, userId]
    );
    return rows[0].total;
  },

  // ── Lấy streak cao nhất của dailies (cho Achievements) ────
  async getMaxStreak(userId) {
    const [rows] = await pool.execute(
      `SELECT MAX(streak) as max_streak FROM tasks
       WHERE user_id = ? AND type = 'daily'`,
      [userId]
    );
    return rows[0].max_streak || 0;
  },
};

module.exports = TaskModel;
