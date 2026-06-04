const { pool } = require('../config/db');

// ══════════════════════════════════════════════════════════════════
// ARENA MODEL — Quản lý dữ liệu Đấu trường (Arena Battles)
// ══════════════════════════════════════════════════════════════════

const ArenaModel = {

  // ── Tạo bảng arena_battles nếu chưa có ──────────────────────
  async ensureTable() {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS arena_battles (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        
        -- Chỉ số người chơi khi vào trận
        player_hp INT NOT NULL,
        player_max_hp INT NOT NULL,
        player_strength INT NOT NULL,
        player_speed INT NOT NULL,
        
        -- Chỉ số Boss (bản ngã hoàn hảo - 100% task completion)
        boss_hp INT NOT NULL,
        boss_max_hp INT NOT NULL,
        boss_strength INT NOT NULL,
        boss_speed INT NOT NULL,
        
        -- Kết quả trận đấu
        result ENUM('pending', 'victory', 'defeat', 'draw') DEFAULT 'pending',
        total_hits INT DEFAULT 0,
        player_damage_dealt INT DEFAULT 0,
        boss_damage_dealt INT DEFAULT 0,
        exp_earned INT DEFAULT 0,
        gold_earned DECIMAL(10,2) DEFAULT 0,
        
        -- Thời gian
        started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        ended_at TIMESTAMP NULL,
        battle_duration_seconds INT DEFAULT 0,
        
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        INDEX idx_user_date (user_id, started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
    `);
  },

  // ── Kiểm tra hôm nay đã đánh boss chưa ─────────────────────
  async hasBattleToday(userId) {
    const [rows] = await pool.execute(
      `SELECT id FROM arena_battles
       WHERE user_id = ? AND DATE(started_at) = CURDATE()
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0;
  },

  // ── Lấy trận đánh đang pending của user ─────────────────────
  async getPendingBattle(userId) {
    const [rows] = await pool.execute(
      `SELECT * FROM arena_battles
       WHERE user_id = ? AND result = 'pending'
       ORDER BY started_at DESC LIMIT 1`,
      [userId]
    );
    return rows[0] || null;
  },

  // ── Tạo trận đánh mới ──────────────────────────────────────
  async createBattle(data) {
    const [result] = await pool.execute(
      `INSERT INTO arena_battles
       (user_id, player_hp, player_max_hp, player_strength, player_speed,
        boss_hp, boss_max_hp, boss_strength, boss_speed)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.userId,
        data.playerHP, data.playerMaxHP, data.playerStrength, data.playerSpeed,
        data.bossHP, data.bossMaxHP, data.bossStrength, data.bossSpeed,
      ]
    );
    return result.insertId;
  },

  // ── Cập nhật kết quả trận đánh ─────────────────────────────
  async endBattle(battleId, result) {
    await pool.execute(
      `UPDATE arena_battles SET
        result = ?,
        total_hits = ?,
        player_damage_dealt = ?,
        boss_damage_dealt = ?,
        exp_earned = ?,
        gold_earned = ?,
        battle_duration_seconds = ?,
        ended_at = NOW()
       WHERE id = ?`,
      [
        result.outcome,
        result.totalHits,
        result.playerDamageDealt,
        result.bossDamageDealt,
        result.expEarned,
        result.goldEarned,
        result.durationSeconds,
        battleId,
      ]
    );
  },

  // ── Lấy lịch sử đấu trường ────────────────────────────────
  async getHistory(userId, limit = 10) {
    const safeLimit = parseInt(limit, 10) || 10;
    const [rows] = await pool.execute(
      `SELECT id, result, total_hits, player_damage_dealt, boss_damage_dealt,
              exp_earned, gold_earned, battle_duration_seconds, started_at, ended_at
       FROM arena_battles
       WHERE user_id = ?
       ORDER BY started_at DESC
       LIMIT ${safeLimit}`,
      [userId]
    );
    return rows;
  },

  // ── Thống kê tổng hợp ──────────────────────────────────────
  async getStats(userId) {
    const [rows] = await pool.execute(
      `SELECT
        COUNT(*) as total_battles,
        SUM(result = 'victory') as victories,
        SUM(result = 'defeat') as defeats,
        SUM(result = 'draw') as draws,
        SUM(exp_earned) as total_exp_earned,
        SUM(gold_earned) as total_gold_earned,
        MAX(total_hits) as max_hits_in_battle
       FROM arena_battles
       WHERE user_id = ? AND result != 'pending'`,
      [userId]
    );
    return rows[0];
  },
};

module.exports = ArenaModel;
