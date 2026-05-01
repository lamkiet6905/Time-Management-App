const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const { getAllAchievements, getUnlockedAchievements } = require('../controllers/achievementController');

router.use(authenticate);
router.get('/', getAllAchievements);
router.get('/unlocked', getUnlockedAchievements);

module.exports = router;
