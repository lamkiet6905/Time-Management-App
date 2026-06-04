const { pool } = require('../config/db');

// ══════════════════════════════════════════════════════════════════
// MESSAGE MODEL — Truy vấn bảng messages trong MySQL
// Quản lý: gửi tin nhắn, lấy tin nhắn, đánh dấu đã đọc
// ══════════════════════════════════════════════════════════════════

const MessageModel = {
  // ── Gửi tin nhắn ──────────────────────────────────────────
  async sendMessage(senderId, receiverId, content) {
    const [result] = await pool.execute(
      `INSERT INTO messages (sender_id, receiver_id, content)
       VALUES (?, ?, ?)`,
      [senderId, receiverId, content]
    );
    return result.insertId;
  },

  // ── Lấy tin nhắn giữa 2 người (Conversation) ────────────────
  async getConversation(userId1, userId2, limit = 50, offset = 0) {
    const [rows] = await pool.execute(
      `SELECT * FROM (
         SELECT m.id, m.sender_id, m.receiver_id, m.content, m.is_read, m.created_at,
                u.name as sender_name
         FROM messages m
         JOIN users u ON m.sender_id = u.id
         WHERE (m.sender_id = ? AND m.receiver_id = ?)
            OR (m.sender_id = ? AND m.receiver_id = ?)
         ORDER BY m.created_at DESC, m.id DESC
         LIMIT ? OFFSET ?
       ) sub
       ORDER BY created_at ASC, id ASC`,
      [userId1, userId2, userId2, userId1, String(limit), String(offset)]
    );
    return rows;
  },

  // ── Đánh dấu đã đọc toàn bộ tin nhắn từ người khác gửi ────────
  async markAsRead(senderId, receiverId) {
    const [result] = await pool.execute(
      `UPDATE messages SET is_read = TRUE
       WHERE sender_id = ? AND receiver_id = ? AND is_read = FALSE`,
      [senderId, receiverId] // senderId là người gửi, receiverId là người đọc
    );
    return result;
  },

  // ── Lấy danh sách inbox (Những người đã chat) ───────────────
  async getInbox(userId) {
    const [rows] = await pool.execute(
      `SELECT 
          IF(m.sender_id = ?, m.receiver_id, m.sender_id) as contact_id,
          MAX(m.created_at) as last_message_time,
          u.name as contact_name,
          u.avatar_original_url as contact_avatar,
          SUM(IF(m.receiver_id = ? AND m.is_read = FALSE, 1, 0)) as unread_count
       FROM messages m
       JOIN users u ON u.id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
       WHERE m.sender_id = ? OR m.receiver_id = ?
       GROUP BY contact_id, contact_name, contact_avatar
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId]
    );
    return rows;
  },
};

module.exports = MessageModel;
