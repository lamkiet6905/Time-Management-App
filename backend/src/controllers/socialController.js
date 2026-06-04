const SocialService = require('../services/socialService');

// ══════════════════════════════════════════════════════════════════
// SOCIAL CONTROLLER — HTTP handlers cho hệ thống bạn bè
// ══════════════════════════════════════════════════════════════════

const SocialController = {

  // POST /social/friend-request — Gửi lời mời kết bạn
  // Body: { email: "friend@email.com" }
  async sendFriendRequest(req, res) {
    try {
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email người muốn kết bạn',
        });
      }

      const result = await SocialService.sendFriendRequest(req.user.id, email);
      const msg = result.action === 'auto_accepted'
        ? `Đã tự động kết bạn với ${result.friend.name} (cả hai đều gửi lời mời cho nhau)`
        : `Đã gửi lời mời kết bạn tới ${result.receiver.name}`;

      return res.status(200).json({
        success: true,
        message: msg,
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // PUT /social/friend-request/:id/accept — Chấp nhận
  async acceptRequest(req, res) {
    try {
      const result = await SocialService.acceptRequest(
        req.user.id, parseInt(req.params.id)
      );
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // PUT /social/friend-request/:id/reject — Từ chối
  async rejectRequest(req, res) {
    try {
      const result = await SocialService.rejectRequest(
        req.user.id, parseInt(req.params.id)
      );
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /social/pending — Lời mời đang chờ
  async getPending(req, res) {
    try {
      const requests = await SocialService.getPendingRequests(req.user.id);
      return res.status(200).json({
        success: true,
        data: requests,
        count: requests.length,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /social/friends — Danh sách bạn bè
  async getFriends(req, res) {
    try {
      const friends = await SocialService.getFriendsList(req.user.id);
      return res.status(200).json({
        success: true,
        data: friends,
        count: friends.length,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // DELETE /social/friends/:id — Hủy kết bạn
  async removeFriend(req, res) {
    try {
      const result = await SocialService.removeFriend(
        req.user.id, parseInt(req.params.id)
      );
      return res.status(200).json({ success: true, ...result });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /social/search?q=abc
  async searchUsers(req, res) {
    try {
      const query = req.query.q;
      if (!query || query.trim() === '') {
        return res.status(200).json({ success: true, data: [] });
      }
      const results = await SocialService.searchUsers(query.trim(), req.user.id);
      return res.status(200).json({
        success: true,
        data: results,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = SocialController;
