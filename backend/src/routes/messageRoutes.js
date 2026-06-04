const express = require('express');
const router = express.Router();
const MessageController = require('../controllers/messageController');
const authenticate = require('../middleware/authenticate');

// ── Message Routes ───────────────────────────────────────────
// Prefix: /messages (đặt trong app.js)
// Tất cả routes cần token xác thực

router.use(authenticate);

// Hộp thư (Inbox)
router.get('/inbox',            MessageController.getInbox);          // GET /messages/inbox

// Lịch sử chat (với 1 người)
router.get('/:contactId',       MessageController.getConversation);   // GET /messages/:contactId

// Gửi tin nhắn
router.post('/:contactId',      MessageController.sendMessage);       // POST /messages/:contactId

module.exports = router;
