const express = require('express');
const router = express.Router();
const SocialController = require('../controllers/socialController');
const authenticate = require('../middleware/authenticate');

// ── Social Routes ───────────────────────────────────────────
// Prefix: /social (đặt trong app.js)
// Tất cả routes cần token xác thực

router.use(authenticate);

// Bạn bè
router.post('/friend-request',              SocialController.sendFriendRequest);   // POST /social/friend-request
router.put('/friend-request/:id/accept',    SocialController.acceptRequest);       // PUT  /social/friend-request/:id/accept
router.put('/friend-request/:id/reject',    SocialController.rejectRequest);       // PUT  /social/friend-request/:id/reject
router.get('/pending',                      SocialController.getPending);          // GET  /social/pending
router.get('/friends',                      SocialController.getFriends);          // GET  /social/friends
router.delete('/friends/:id',               SocialController.removeFriend);        // DELETE /social/friends/:id
router.get('/search',                       SocialController.searchUsers);         // GET  /social/search?q=

module.exports = router;
