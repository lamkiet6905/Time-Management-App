const { pool } = require('../config/db');

// ══════════════════════════════════════════════════════════════════
// FRIEND MODEL — Truy vấn bảng friends trong MySQL
// Quản lý: gửi lời mời, chấp nhận, từ chối, chặn, danh sách bạn bè
// ══════════════════════════════════════════════════════════════════

const FriendModel = {

  // ── Gửi lời mời kết bạn ────────────────────────────────────
  async sendRequest(requesterId, receiverId) {
    const [result] = await pool.execute(
      `INSERT INTO friends (requester_id, receiver_id, status)
       VALUES (?, ?, 'pending')`,
      [requesterId, receiverId]
    );
    return result.insertId;
  },

  // ── Kiểm tra đã có quan hệ chưa (cả 2 chiều) ─────────────
  // A gửi cho B, hoặc B đã gửi cho A → đều coi là đã có
  async findRelationship(userId1, userId2) {
    const [rows] = await pool.execute(
      `SELECT * FROM friends
       WHERE (requester_id = ? AND receiver_id = ?)
          OR (requester_id = ? AND receiver_id = ?)`,
      [userId1, userId2, userId2, userId1]
    );
    return rows[0] || null;
  },

  // ── Lấy lời mời theo ID ───────────────────────────────────
  async findById(id) {
    const [rows] = await pool.execute(
      'SELECT * FROM friends WHERE id = ?',
      [id]
    );
    return rows[0] || null;
  },

  // ── Cập nhật trạng thái (accepted / rejected / blocked) ────
  async updateStatus(id, status) {
    await pool.execute(
      'UPDATE friends SET status = ? WHERE id = ?',
      [status, id]
    );
  },

  // ── Lấy danh sách lời mời đang chờ (người nhận) ───────────
  async getPendingRequests(userId) {
    const [rows] = await pool.execute(
      `SELECT f.id, f.requester_id, f.status, f.created_at,
              u.name as requester_name, u.email as requester_email,
              u.level as requester_level
       FROM friends f
       JOIN users u ON f.requester_id = u.id
       WHERE f.receiver_id = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
      [userId]
    );
    return rows;
  },

  // ── Lấy danh sách bạn bè (đã accepted) ────────────────────
  // Trả về info của người bạn (không phải mình)
  async getFriendsList(userId) {
    const [rows] = await pool.execute(
      `SELECT f.id as friendship_id, f.created_at as friends_since,
              u.id as friend_id, u.name, u.email,
              u.level, u.hp, u.max_hp,
              u.avatar_original_url, u.sprite_idle_url
       FROM friends f
       JOIN users u ON (
         CASE
           WHEN f.requester_id = ? THEN u.id = f.receiver_id
           WHEN f.receiver_id = ? THEN u.id = f.requester_id
         END
       )
       WHERE (f.requester_id = ? OR f.receiver_id = ?)
         AND f.status = 'accepted'
       ORDER BY u.name`,
      [userId, userId, userId, userId]
    );
    return rows;
  },

  // ── Đếm số bạn bè (cho Achievements) ──────────────────────
  async countFriends(userId) {
    const [rows] = await pool.execute(
      `SELECT COUNT(*) as count FROM friends
       WHERE (requester_id = ? OR receiver_id = ?)
         AND status = 'accepted'`,
      [userId, userId]
    );
    return rows[0].count;
  },

  // ── Xóa bạn bè (unfriend) ─────────────────────────────────
  async removeFriend(friendshipId) {
    await pool.execute(
      'DELETE FROM friends WHERE id = ?',
      [friendshipId]
    );
  },

  // ── Tìm user theo email (để gửi lời mời) ──────────────────
  async findUserByEmail(email) {
    const [rows] = await pool.execute(
      'SELECT id, name, email, level FROM users WHERE email = ?',
      [email]
    );
    return rows[0] || null;
  },
};

module.exports = FriendModel;
