const express = require('express');
const router = express.Router();
const CharacterController = require('../controllers/characterController');
const authenticate = require('../middleware/authenticate');

// ── Character Routes ────────────────────────────────────────
// Prefix: /character (đặt trong app.js)

router.use(authenticate);

router.get('/profile', CharacterController.getProfile);  // GET /character/profile
router.get('/buffs',   CharacterController.getBuffs);     // GET /character/buffs

module.exports = router;
