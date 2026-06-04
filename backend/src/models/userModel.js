const { pool } = require('../config/db');

// ══════════════════════════════════════════════════════════════════
// USER MODEL — Truy vấn bảng users trong MySQL
// Mở rộng từ 2.0: thêm RPG stats, sprites, party
// ══════════════════════════════════════════════════════════════════

const UserModel = {

  // ── Tìm user theo email (Login) ─────────────────────────────
  async findByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    return rows[0];
  },

  // ── Tìm user theo ID (Auth middleware + lấy thông tin) ──────
  // Không SELECT password — bảo mật tuyệt đối
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, name, email, level, exp, exp_to_next, hp, max_hp,
              strength, speed, gold, avatar_original_url, avatar_pixel_url,
              sprite_idle_url, sprite_attack_url, sprite_hurt_url,
              sprite_status, created_at
       FROM users WHERE id = ?`,
      [id]
    );
    return rows[0];
  },

  // ── Tạo user mới (Register) ────────────────────────────────
  async create({ name, email, hashedPassword }) {
    const [result] = await pool.execute(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [name, email, hashedPassword]
    );
    return result.insertId;
  },

  // ── Cập nhật stats (Level up, nhận EXP, mất HP...) ─────────
  async updateStats(id, updates) {
    const fields = [];
    const values = [];
    for (const [key, value] of Object.entries(updates)) {
      fields.push(`${key} = ?`);
      values.push(value);
    }
    values.push(id);
    await pool.execute(
      `UPDATE users SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
  },

  // ── Cập nhật sprite URLs ────────────────────────────────────
  async updateSprites(id, { spriteIdleUrl, spriteAttackUrl, spriteHurtUrl }) {
    await pool.execute(
      `UPDATE users SET sprite_idle_url = ?, sprite_attack_url = ?,
              sprite_hurt_url = ?, sprite_status = 'ready' WHERE id = ?`,
      [spriteIdleUrl, spriteAttackUrl, spriteHurtUrl, id]
    );
  },

  // ── Cập nhật FCM Token cho Push Notifications ──────────────
  async updateFcmToken(id, fcmToken) {
    await pool.execute(
      'UPDATE users SET fcm_token = ? WHERE id = ?',
      [fcmToken, id]
    );
  },

  // ── Tìm kiếm user (Theo tên hoặc email) ─────────────────────
  async searchUsers(query, excludeUserId) {
    const searchParam = `%${query}%`;
    const [rows] = await pool.execute(
      `SELECT id, name, email, level, sprite_idle_url, avatar_original_url
       FROM users 
       WHERE id != ? AND (name LIKE ? OR email LIKE ?)
       LIMIT 20`,
      [excludeUserId, searchParam, searchParam]
    );
    return rows;
  },
};

module.exports = UserModel;
