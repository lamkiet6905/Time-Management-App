const MessageModel = require('../models/messageModel');
const FriendModel = require('../models/friendModel');
const { emitToUser } = require('../config/socket');

// ══════════════════════════════════════════════════════════════════
// MESSAGE SERVICE — Business logic cho tin nhắn 1-1
// ══════════════════════════════════════════════════════════════════

const MessageService = {
  // ── Gửi tin nhắn ──────────────────────────────────────────
  async sendMessage(senderId, receiverId, content) {
    if (!content || content.trim() === '') {
      throw new Error('Nội dung tin nhắn không được để trống');
    }

    if (senderId === receiverId) {
      throw new Error('Bạn không thể gửi tin nhắn cho chính mình');
    }

    // Kiểm tra xem 2 người có phải là bạn bè không
    const relationship = await FriendModel.findRelationship(senderId, receiverId);
    if (!relationship || relationship.status !== 'accepted') {
      throw new Error('Bạn chỉ có thể nhắn tin với bạn bè');
    }

    const messageId = await MessageModel.sendMessage(senderId, receiverId, content);
    
    // Đẩy sự kiện realtime tới người nhận
    const messagePayload = {
      id: messageId,
      sender_id: senderId,
      receiver_id: receiverId,
      content,
      is_read: false,
      created_at: new Date().toISOString(),
    };
    emitToUser(receiverId, 'new_message', messagePayload);

    // Gửi Push Notification (bất đồng bộ)
    const UserModel = require('../models/userModel');
    const sender = await UserModel.findById(senderId);
    const NotificationService = require('./notificationService');
    
    NotificationService.sendToUser(
      receiverId,
      `${sender.name} đã gửi tin nhắn`,
      content.length > 50 ? content.substring(0, 50) + '...' : content,
      { type: 'chat', senderId: senderId.toString() }
    );

    return messagePayload;
  },

  // ── Lấy lịch sử chat ──────────────────────────────────────
  async getConversation(userId, contactId, page = 1, limit = 50) {
    // Không cần check bạn bè khi lấy tin nhắn cũ (vì có thể đã unfriend nhưng giữ lịch sử)
    const offset = (page - 1) * limit;
    
    // Khi người dùng mở lịch sử chat, đánh dấu toàn bộ tin nhắn từ contactId gửi đến userId là ĐÃ ĐỌC
    const markedRead = await MessageModel.markAsRead(contactId, userId);
    if (markedRead && markedRead.affectedRows > 0) {
      // Báo cho contactId biết là userId đã đọc tin nhắn
      emitToUser(contactId, 'messages_read', { readerId: userId });
    }

    const messages = await MessageModel.getConversation(userId, contactId, limit, offset);
    return messages;
  },

  // ── Lấy danh sách Inbox ───────────────────────────────────
  async getInbox(userId) {
    const inbox = await MessageModel.getInbox(userId);
    return inbox;
  },
};

module.exports = MessageService;
