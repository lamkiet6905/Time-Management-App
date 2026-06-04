const ArenaService = require('../services/arenaService');

// ══════════════════════════════════════════════════════════════════
// ARENA CONTROLLER — HTTP handlers cho Đấu trường
// ══════════════════════════════════════════════════════════════════

const ArenaController = {

  // POST /arena/start — Bắt đầu trận đánh
  async startBattle(req, res) {
    try {
      const result = await ArenaService.startBattle(req.user.id);
      return res.status(200).json({
        success: true,
        message: result.resumed ? 'Tiếp tục trận đấu đang dở' : 'Bắt đầu trận đấu mới!',
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // POST /arena/hit — Ghi nhận 1 va chạm
  async processHit(req, res) {
    try {
      const { battleId } = req.body;
      if (!battleId) {
        return res.status(400).json({ success: false, message: 'Thiếu battleId' });
      }
      const result = await ArenaService.processHit(req.user.id, battleId);
      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // POST /arena/end — Kết thúc trận đấu
  async endBattle(req, res) {
    try {
      const { battleId, outcome, durationSeconds } = req.body;
      if (!battleId || !outcome) {
        return res.status(400).json({ success: false, message: 'Thiếu battleId hoặc outcome' });
      }
      const validOutcomes = ['victory', 'defeat', 'draw'];
      if (!validOutcomes.includes(outcome)) {
        return res.status(400).json({ success: false, message: 'outcome phải là victory, defeat hoặc draw' });
      }
      const result = await ArenaService.endBattle(req.user.id, battleId, outcome, durationSeconds);
      return res.status(200).json({
        success: true,
        message: outcome === 'victory' ? '🏆 Chiến thắng!' : outcome === 'defeat' ? '💀 Thất bại...' : '🤝 Hòa!',
        data: result,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /arena/history — Lịch sử đấu trường
  async getHistory(req, res) {
    try {
      const history = await ArenaService.getHistory(req.user.id);
      return res.status(200).json({
        success: true,
        data: history,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },

  // GET /arena/stats — Thống kê tổng hợp
  async getStats(req, res) {
    try {
      const stats = await ArenaService.getStats(req.user.id);
      return res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
  },
};

module.exports = ArenaController;
