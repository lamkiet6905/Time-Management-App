const { pool } = require('../config/db');
const { expToNextLevel, getLevelUpBonus, BUFF_UNLOCK_MAP } = require('../utils/gameFormulas');

// ══════════════════════════════════════════════════════════════════
// CHARACTER MODEL — Quản lý chỉ số nhân vật, EXP, Level Up, Buffs
// ══════════════════════════════════════════════════════════════════

const CharacterModel = {

  // ── Lấy full stats + danh sách buff đang active ────────────
  async getFullStats(userId) {
    // Lấy thông tin user
    const [users] = await pool.execute(
      `SELECT id, name, level, exp, exp_to_next, hp, max_hp,
              strength, speed, gold, avatar_original_url, avatar_pixel_url,
              sprite_idle_url, sprite_attack_url, sprite_hurt_url,
              sprite_status
       FROM users WHERE id = ?`,
      [userId]
    );
    if (!users[0]) return null;

    // Lấy danh sách buff
    const [buffs] = await pool.execute(
      `SELECT buff_type, unlock_level, is_active
       FROM user_buffs WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );

    return { ...users[0], buffs };
  },

  // ── Cộng EXP và xử lý Level Up ────────────────────────────
  // Trả về { levelsGained, newBuffs } để frontend hiển thị
  async addExp(userId, amount) {
    const [users] = await pool.execute(
      'SELECT level, exp, exp_to_next, max_hp, strength, speed FROM users WHERE id = ?',
      [userId]
    );
    if (!users[0]) throw new Error('User không tồn tại');

    let { level, exp, exp_to_next, max_hp, strength, speed } = users[0];
    exp += amount;

    let levelsGained = 0;
    const newBuffs = [];

    // Loop xử lý level up (có thể lên nhiều level cùng lúc nếu EXP nhiều)
    while (exp >= exp_to_next) {
      exp -= exp_to_next;
      level += 1;
      levelsGained += 1;

      // Tăng chỉ số theo công thức
      const bonus = getLevelUpBonus();
      max_hp   += bonus.max_hp;     // +10
      strength += bonus.strength;   // +8
      speed    += bonus.speed;      // +5

      // Tính EXP cần cho level tiếp theo
      exp_to_next = expToNextLevel(level);

      // Kiểm tra mở khóa buff mới
      if (BUFF_UNLOCK_MAP[level]) {
        const buffType = BUFF_UNLOCK_MAP[level];
        try {
          await pool.execute(
            `INSERT INTO user_buffs (user_id, buff_type, unlock_level)
             VALUES (?, ?, ?)`,
            [userId, buffType, level]
          );
          newBuffs.push(buffType);
        } catch (err) {
          // Buff đã tồn tại (UNIQUE constraint) → bỏ qua
        }
      }
    }

    // Cập nhật user stats
    await pool.execute(
      `UPDATE users SET level = ?, exp = ?, exp_to_next = ?,
              max_hp = ?, hp = LEAST(hp + ?, ?), strength = ?, speed = ?
       WHERE id = ?`,
      [level, exp, exp_to_next, max_hp,
        levelsGained > 0 ? max_hp : 0, max_hp, // Hồi full HP khi level up
        strength, speed, userId]
    );

    return { levelsGained, newBuffs, level, exp, exp_to_next, max_hp, strength, speed };
  },

  // ── Cộng/Trừ HP ───────────────────────────────────────────
  // delta > 0: hồi máu | delta < 0: mất máu
  async updateHP(userId, delta) {
    const [result] = await pool.execute(
      `UPDATE users SET hp = GREATEST(0, LEAST(max_hp, hp + ?)) WHERE id = ?`,
      [delta, userId]
    );
    // Lấy HP mới
    const [rows] = await pool.execute(
      'SELECT hp, max_hp FROM users WHERE id = ?',
      [userId]
    );
    return rows[0];
  },

  // ── Cộng Vàng ─────────────────────────────────────────────
  async addGold(userId, amount) {
    await pool.execute(
      'UPDATE users SET gold = gold + ? WHERE id = ?',
      [amount, userId]
    );
  },

  // ── Kiểm tra user có buff cụ thể không ────────────────────
  async hasBuff(userId, buffType) {
    const [rows] = await pool.execute(
      `SELECT id FROM user_buffs
       WHERE user_id = ? AND buff_type = ? AND is_active = TRUE`,
      [userId, buffType]
    );
    return rows.length > 0;
  },

  // ── Lấy tất cả buff active của user ──────────────────────
  async getActiveBuffs(userId) {
    const [rows] = await pool.execute(
      `SELECT buff_type, unlock_level FROM user_buffs
       WHERE user_id = ? AND is_active = TRUE`,
      [userId]
    );
    return rows.map(r => r.buff_type);
  },
};

module.exports = CharacterModel;
