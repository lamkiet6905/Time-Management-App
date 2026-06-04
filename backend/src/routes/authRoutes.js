const express = require('express');
const router = express.Router();
const AuthController = require('../controllers/authController');
const authenticate = require('../middleware/authenticate');

// ── Auth Routes ─────────────────────────────────────────────
// Prefix: /auth (đặt trong app.js)

router.post('/register', AuthController.register);   // POST /auth/register
router.post('/login',    AuthController.login);       // POST /auth/login
router.post('/refresh',  AuthController.refresh);     // POST /auth/refresh
router.get('/me', authenticate, AuthController.me);   // GET  /auth/me (cần token)
router.put('/fcm-token', authenticate, AuthController.saveFcmToken); // PUT /auth/fcm-token

module.exports = router;
