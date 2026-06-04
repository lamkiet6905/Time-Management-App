const FriendModel = require('../models/friendModel');

// ══════════════════════════════════════════════════════════════════
// SOCIAL SERVICE — Business logic kết bạn
// Xử lý: gửi lời mời, chấp nhận/từ chối, danh sách bạn bè
// ══════════════════════════════════════════════════════════════════

const SocialService = {

  // ── Gửi lời mời kết bạn (theo email) ──────────────────────
  async sendFriendRequest(requesterId, receiverEmail) {
    // 1. Tìm user nhận
    const receiver = await FriendModel.findUserByEmail(receiverEmail);
    if (!receiver) {
      throw new Error('Không tìm thấy người dùng với email này');
    }

    // 2. Không thể kết bạn với chính mình
    if (receiver.id === requesterId) {
      throw new Error('Bạn không thể kết bạn với chính mình');
    }

    // 3. Kiểm tra đã có quan hệ chưa
    const existing = await FriendModel.findRelationship(requesterId, receiver.id);
    if (existing) {
      if (existing.status === 'accepted') {
        throw new Error('Hai bạn đã là bạn bè rồi');
      }
      if (existing.status === 'pending') {
        // Nếu người kia đã gửi cho mình → tự động chấp nhận
        if (existing.requester_id === receiver.id) {
          await FriendModel.updateStatus(existing.id, 'accepted');
          return { action: 'auto_accepted', friend: receiver };
        }
        throw new Error('Bạn đã gửi lời mời cho người này rồi');
      }
      if (existing.status === 'rejected') {
        // Đã bị từ chối trước đó → xóa cũ, tạo mới
        await FriendModel.removeFriend(existing.id);
      }
      if (existing.status === 'blocked') {
        throw new Error('Không thể gửi lời mời cho người dùng này');
      }
    }

    // 4. Tạo lời mời mới
    const requestId = await FriendModel.sendRequest(requesterId, receiver.id);
    
    // 5. Bắn thông báo (Push Notification)
    const UserModel = require('../models/userModel');
    const sender = await UserModel.findById(requesterId);
    const NotificationService = require('./notificationService');
    NotificationService.sendToUser(
      receiver.id,
      'Lời mời kết bạn',
      `${sender.name} muốn kết bạn với bạn!`,
      { type: 'friend_request' }
    );

    return { action: 'request_sent', requestId, receiver };
  },

  // ── Chấp nhận lời mời ─────────────────────────────────────
  async acceptRequest(userId, requestId) {
    const request = await FriendModel.findById(requestId);
    if (!request) {
      throw new Error('Lời mời không tồn tại');
    }
    if (request.receiver_id !== userId) {
      throw new Error('Bạn không có quyền xử lý lời mời này');
    }
    if (request.status !== 'pending') {
      throw new Error('Lời mời đã được xử lý trước đó');
    }

    await FriendModel.updateStatus(requestId, 'accepted');
    return { message: 'Đã chấp nhận lời mời kết bạn' };
  },

  // ── Từ chối lời mời ───────────────────────────────────────
  async rejectRequest(userId, requestId) {
    const request = await FriendModel.findById(requestId);
    if (!request) {
      throw new Error('Lời mời không tồn tại');
    }
    if (request.receiver_id !== userId) {
      throw new Error('Bạn không có quyền xử lý lời mời này');
    }
    if (request.status !== 'pending') {
      throw new Error('Lời mời đã được xử lý trước đó');
    }

    await FriendModel.updateStatus(requestId, 'rejected');
    return { message: 'Đã từ chối lời mời kết bạn' };
  },

  // ── Lấy danh sách lời mời chờ ─────────────────────────────
  async getPendingRequests(userId) {
    return FriendModel.getPendingRequests(userId);
  },

  // ── Lấy danh sách bạn bè ──────────────────────────────────
  async getFriendsList(userId) {
    return FriendModel.getFriendsList(userId);
  },

  // ── Hủy kết bạn ──────────────────────────────────────────
  async removeFriend(userId, friendshipId) {
    const friendship = await FriendModel.findById(friendshipId);
    if (!friendship) {
      throw new Error('Quan hệ bạn bè không tồn tại');
    }
    // Chỉ 2 người trong quan hệ mới được xóa
    if (friendship.requester_id !== userId && friendship.receiver_id !== userId) {
      throw new Error('Bạn không có quyền thực hiện thao tác này');
    }

    await FriendModel.removeFriend(friendshipId);
    return { message: 'Đã hủy kết bạn' };
  },

  // ── Đếm bạn bè (cho achievements) ────────────────────────
  async countFriends(userId) {
    return FriendModel.countFriends(userId);
  },

  // ── Tìm kiếm người dùng ────────────────────────────────────
  async searchUsers(query, userId) {
    const UserModel = require('../models/userModel');
    const users = await UserModel.searchUsers(query, userId);
    
    // Gắn thêm trạng thái quan hệ (nếu cần thiết)
    // Để tối ưu, ta có thể query hàng loạt hoặc gọi vòng lặp cho < 20 users
    const results = [];
    for (const u of users) {
      const rel = await FriendModel.findRelationship(userId, u.id);
      let relStatus = 'none';
      if (rel) {
        if (rel.status === 'accepted') relStatus = 'friend';
        else if (rel.status === 'pending') {
          relStatus = rel.requester_id === userId ? 'request_sent' : 'request_received';
        } else if (rel.status === 'rejected' || rel.status === 'blocked') {
          continue; // Bỏ qua nếu bị block
        }
      }
      results.push({ ...u, relationship: relStatus });
    }
    return results;
  },
};

module.exports = SocialService;
