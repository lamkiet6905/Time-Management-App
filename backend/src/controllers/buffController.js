const { User, Buff, UserBuff } = require('../models');
const rpgService = require('../services/rpgService');
const { Op } = require('sequelize');

// GET /api/buffs/available  (3 random buff options when leveling up)
async function getAvailableBuffs(req, res) {
  try {
    const user = await User.findByPk(req.userId);
    if (!user.pending_level_up) {
      return res.status(400).json({ success: false, message: 'Không có level-up chờ xử lý' });
    }
    const options = await rpgService.getBuffOptions(user);
    res.json({ success: true, data: options });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// POST /api/buffs/choose
async function chooseBuff(req, res) {
  try {
    const { buff_id } = req.body;
    if (!buff_id) return res.status(400).json({ success: false, message: 'buff_id là bắt buộc' });

    const user = await User.findByPk(req.userId);
    if (!user.pending_level_up) {
      return res.status(400).json({ success: false, message: 'Không có level-up chờ xử lý' });
    }

    const buff = await Buff.findByPk(buff_id);
    if (!buff) return res.status(404).json({ success: false, message: 'Buff không tồn tại' });

    // Apply special buffs immediately
    let expiresAt = null;
    if (buff.duration_days) {
      expiresAt = new Date(Date.now() + buff.duration_days * 86400000);
    }

    const usesRemaining = buff.is_one_time ? 1 : null;

    await UserBuff.create({
      user_id: req.userId,
      buff_id: buff.id,
      expires_at: expiresAt,
      uses_remaining: usesRemaining,
      is_active: true,
    });

    // Apply permanent effects
    if (buff.effect_type === 'max_hp_increase') {
      const newMaxHp = user.max_hp + parseInt(buff.effect_value);
      await user.update({ max_hp: newMaxHp, hp: Math.min(user.hp + parseInt(buff.effect_value), newMaxHp) });
    }

    // Clear pending level-up flag
    await user.update({ pending_level_up: false });

    res.json({
      success: true,
      message: `Đã kích hoạt buff: ${buff.name}! ✨`,
      data: { buff, expires_at: expiresAt },
    });
  } catch (error) {
    console.error('chooseBuff error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// GET /api/buffs/active
async function getActiveBuffs(req, res) {
  try {
    const buffs = await UserBuff.findAll({
      where: {
        user_id: req.userId,
        is_active: true,
        [Op.or]: [
          { expires_at: null },
          { expires_at: { [Op.gt]: new Date() } },
        ],
      },
      include: ['Buff'],
    });
    res.json({ success: true, data: buffs });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

module.exports = { getAvailableBuffs, chooseBuff, getActiveBuffs };
