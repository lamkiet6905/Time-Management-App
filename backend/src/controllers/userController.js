const { User, UserBuff } = require('../models');
const { formatUser } = require('./authController');

// GET /api/user/profile
async function getProfile(req, res) {
  try {
    const user = await User.findByPk(req.userId);
    const activeBuffs = await UserBuff.findAll({
      where: { user_id: req.userId, is_active: true },
      include: ['Buff'],
    });
    res.json({
      success: true,
      data: {
        ...formatUser(user),
        bio: user.bio,
        total_tasks_failed: user.total_tasks_failed,
        buffs: activeBuffs.map(ub => ({
          ...ub.Buff?.dataValues,
          expires_at: ub.expires_at,
          chosen_at: ub.chosen_at,
        })),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// PUT /api/user/profile
async function updateProfile(req, res) {
  try {
    const { display_name, bio, avatar_url } = req.body;
    await req.user.update({
      display_name: display_name ?? req.user.display_name,
      bio: bio ?? req.user.bio,
      avatar_url: avatar_url ?? req.user.avatar_url,
    });
    res.json({ success: true, data: formatUser(req.user), message: 'Cập nhật profile thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

module.exports = { getProfile, updateProfile };
