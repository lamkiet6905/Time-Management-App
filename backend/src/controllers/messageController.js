const MessageService = require('../services/messageService');

// ══════════════════════════════════════════════════════════════════
// MESSAGE CONTROLLER — HTTP handlers cho nhắn tin 1-1
// ══════════════════════════════════════════════════════════════════

const MessageController = {
  // POST /messages/:contactId — Gửi tin nhắn
  async sendMessage(req, res) {
    try {
      const { content } = req.body;
      const contactId = parseInt(req.params.contactId);
      
      const result = await MessageService.sendMessage(req.user.id, contactId, content);
      return res.status(200).json({
        success: true,
        message: 'Gửi tin nhắn thành công',
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /messages/inbox — Lấy danh sách hộp thoại (inbox)
  async getInbox(req, res) {
    try {
      const inbox = await MessageService.getInbox(req.user.id);
      return res.status(200).json({
        success: true,
        data: inbox,
        count: inbox.length,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /messages/:contactId — Lấy lịch sử chat với 1 người
  async getConversation(req, res) {
    try {
      const contactId = parseInt(req.params.contactId);
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 50;

      const messages = await MessageService.getConversation(req.user.id, contactId, page, limit);
      return res.status(200).json({
        success: true,
        data: messages,
        count: messages.length,
        page,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = MessageController;
