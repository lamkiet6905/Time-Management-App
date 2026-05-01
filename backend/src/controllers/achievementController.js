const { Achievement, UserAchievement } = require('../models');

// GET /api/achievements
async function getAllAchievements(req, res) {
  try {
    const all = await Achievement.findAll({ order: [['category', 'ASC'], ['condition_value', 'ASC']] });
    const unlocked = await UserAchievement.findAll({ where: { user_id: req.userId } });
    const unlockedMap = new Map(unlocked.map(u => [u.achievement_id, u.unlocked_at]));

    const result = all.map(a => ({
      ...a.dataValues,
      is_unlocked: unlockedMap.has(a.id),
      unlocked_at: unlockedMap.get(a.id) || null,
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// GET /api/achievements/unlocked
async function getUnlockedAchievements(req, res) {
  try {
    const unlocked = await UserAchievement.findAll({
      where: { user_id: req.userId },
      include: [{ model: Achievement, as: 'Achievement' }],
      order: [['unlocked_at', 'DESC']],
    });
    res.json({ success: true, data: unlocked });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

module.exports = { getAllAchievements, getUnlockedAchievements };
