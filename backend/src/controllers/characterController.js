const CharacterService = require('../services/characterService');

// ══════════════════════════════════════════════════════════════════
// CHARACTER CONTROLLER — HTTP handlers cho chỉ số nhân vật
// ══════════════════════════════════════════════════════════════════

const CharacterController = {

  // GET /character/profile — Lấy full profile nhân vật
  async getProfile(req, res) {
    try {
      const profile = await CharacterService.getProfile(req.user.id);
      return res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /character/buffs — Lấy danh sách buff active
  async getBuffs(req, res) {
    try {
      const buffs = await CharacterService.getActiveBuffs(req.user.id);
      return res.status(200).json({
        success: true,
        data: buffs,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = CharacterController;
