const CharacterModel = require('../models/characterModel');
const { BUFF_INFO } = require('../utils/gameFormulas');

// ══════════════════════════════════════════════════════════════════
// CHARACTER SERVICE — Business logic chỉ số nhân vật
// ══════════════════════════════════════════════════════════════════

const CharacterService = {

  // ── Lấy full profile nhân vật ──────────────────────────────
  async getProfile(userId) {
    const stats = await CharacterModel.getFullStats(userId);
    if (!stats) throw new Error('User không tồn tại');

    // Gắn thêm thông tin chi tiết cho từng buff
    stats.buffs = stats.buffs.map(b => ({
      ...b,
      info: BUFF_INFO[b.buff_type] || null,
    }));

    return stats;
  },

  // ── Cộng EXP (gọi từ task service hoặc achievement) ──────
  async addExp(userId, amount) {
    return CharacterModel.addExp(userId, amount);
  },

  // ── Cộng Gold ─────────────────────────────────────────────
  async addGold(userId, amount) {
    return CharacterModel.addGold(userId, amount);
  },

  // ── Hồi HP ────────────────────────────────────────────────
  async healHP(userId, amount) {
    return CharacterModel.updateHP(userId, Math.abs(amount));
  },

  // ── Trừ HP ────────────────────────────────────────────────
  async damageHP(userId, amount) {
    return CharacterModel.updateHP(userId, -Math.abs(amount));
  },

  // ── Kiểm tra buff ────────────────────────────────────────
  async hasBuff(userId, buffType) {
    return CharacterModel.hasBuff(userId, buffType);
  },

  // ── Lấy danh sách buff active ────────────────────────────
  async getActiveBuffs(userId) {
    return CharacterModel.getActiveBuffs(userId);
  },
};

module.exports = CharacterService;
