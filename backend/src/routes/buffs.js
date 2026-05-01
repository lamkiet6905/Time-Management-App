const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAvailableBuffs, chooseBuff, getActiveBuffs } = require('../controllers/buffController');

router.use(authenticate);
router.get('/available', getAvailableBuffs);
router.post('/choose', chooseBuff);
router.get('/active', getActiveBuffs);

module.exports = router;
