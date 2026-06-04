const express = require('express');
const router = express.Router();
const ArenaController = require('../controllers/arenaController');
const authenticate = require('../middleware/authenticate');

// ── Arena Routes ─────────────────────────────────────────────
// Prefix: /arena (đặt trong app.js)

router.use(authenticate);

router.post('/start',   ArenaController.startBattle);   // POST /arena/start
router.post('/hit',     ArenaController.processHit);    // POST /arena/hit
router.post('/end',     ArenaController.endBattle);     // POST /arena/end
router.get('/history',  ArenaController.getHistory);    // GET  /arena/history
router.get('/stats',    ArenaController.getStats);      // GET  /arena/stats

module.exports = router;
