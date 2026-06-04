const { pool } = require('../config/db');
const ArenaModel = require('../models/arenaModel');
const CharacterModel = require('../models/characterModel');
const { calcBattleDamage, rollCritical, calcVampiricHeal } = require('../utils/gameFormulas');

// ══════════════════════════════════════════════════════════════════
// ARENA SERVICE — Business logic Đấu trường
//
// Cơ chế:
// - Boss = "Bản ngã hoàn hảo" (chỉ số tại level nếu hoàn thành 100% task)
// - Người chơi mang chỉ số hiện tại vào chiến đấu
// - Cơ chế DVD Bouncing xử lý ở Frontend (va chạm → gọi /arena/hit)
// - Backend chỉ tính toán damage, buff, kết quả
// ══════════════════════════════════════════════════════════════════

const ArenaService = {

  // ── Khởi tạo trận đánh mới ──────────────────────────────────
  async startBattle(userId) {
    // Đảm bảo bảng tồn tại
    await ArenaModel.ensureTable();

    // Kiểm tra xem đã có trận pending chưa
    const pending = await ArenaModel.getPendingBattle(userId);
    // Lấy chỉ số hiện tại của người chơi (dùng cho cả resumed và new battle)
    const playerStats = await CharacterModel.getFullStats(userId);
    if (!playerStats) throw new Error('User không tồn tại');

    if (pending) {
      return {
        battleId: pending.id,
        resumed: true,
        player: {
          hp: pending.player_hp,
          maxHP: pending.player_max_hp,
          strength: pending.player_strength,
          speed: pending.player_speed,
          spriteIdle: playerStats.sprite_idle_url,
          spriteAttack: playerStats.sprite_attack_url,
          spriteHurt: playerStats.sprite_hurt_url,
        },
        boss: {
          hp: pending.boss_hp,
          maxHP: pending.boss_max_hp,
          strength: pending.boss_strength,
          speed: pending.boss_speed,
          spriteIdle: playerStats.sprite_idle_url,
          spriteAttack: playerStats.sprite_attack_url,
          spriteHurt: playerStats.sprite_hurt_url,
        },
      };
    }

    // ── Tính chỉ số Boss (Bản ngã hoàn hảo) ──
    // Boss = phiên bản "nếu hoàn thành 100% task hôm nay"
    // Boss có HP = max_hp của player, strength & speed ở level hiện tại
    // Bonus: Boss mạnh hơn 20% sức mạnh để tạo thử thách
    const bossStrength = Math.floor(playerStats.strength * 1.2);
    const bossSpeed = Math.floor(playerStats.speed * 1.1);
    const bossMaxHP = playerStats.max_hp;

    const battleId = await ArenaModel.createBattle({
      userId,
      playerHP: playerStats.hp,         // HP hiện tại (có thể thấp hơn max nếu bị trừ)
      playerMaxHP: playerStats.max_hp,
      playerStrength: playerStats.strength,
      playerSpeed: playerStats.speed,
      bossHP: bossMaxHP,                // Boss luôn bắt đầu full HP
      bossMaxHP: bossMaxHP,
      bossStrength: bossStrength,
      bossSpeed: bossSpeed,
    });

    return {
      battleId,
      resumed: false,
      player: {
        hp: playerStats.hp,
        maxHP: playerStats.max_hp,
        strength: playerStats.strength,
        speed: playerStats.speed,
        spriteIdle: playerStats.sprite_idle_url,
        spriteAttack: playerStats.sprite_attack_url,
        spriteHurt: playerStats.sprite_hurt_url,
      },
      boss: {
        hp: bossMaxHP,
        maxHP: bossMaxHP,
        strength: bossStrength,
        speed: bossSpeed,
        // Boss dùng cùng sprite của player (đấu với chính mình)
        spriteIdle: playerStats.sprite_idle_url,
        spriteAttack: playerStats.sprite_attack_url,
        spriteHurt: playerStats.sprite_hurt_url,
      },
    };
  },

  // ── Xử lý 1 lần va chạm (HIT) ─────────────────────────────
  // Frontend gọi mỗi khi 2 hitbox chạm nhau
  async processHit(userId, battleId) {
    const battle = await ArenaModel.getPendingBattle(userId);
    if (!battle || battle.id !== battleId) {
      throw new Error('Trận đấu không tồn tại hoặc đã kết thúc');
    }

    // Lấy buff của player
    const playerBuffs = await CharacterModel.getActiveBuffs(userId);
    const hasVampiric = playerBuffs.includes('vampiric_strike');
    const hasCritical = playerBuffs.includes('critical_focus');
    const hasShield = playerBuffs.includes('iron_shield');

    // ── Lấy chỉ số tốc độ để đổ xí ngầu (Speed Roll) ──
    const playerSpeed = battle.player_speed || 1;
    const bossSpeed = battle.boss_speed || 1;
    const totalSpeed = playerSpeed + bossSpeed;
    const roll = Math.random() * totalSpeed;

    let playerDamage = 0;
    let bossDamage = 0;
    let playerCrit = false;
    let vampiricHeal = 0;

    // Phân định lượt đánh dựa trên tốc độ
    if (roll < playerSpeed) {
      // ── Player tấn công Boss ──
      playerCrit = rollCritical(hasCritical);
      playerDamage = calcBattleDamage(battle.player_strength, playerCrit, false);
      vampiricHeal = calcVampiricHeal(playerDamage, hasVampiric);
    } else {
      // ── Boss tấn công Player ──
      bossDamage = calcBattleDamage(battle.boss_strength, false, hasShield);
    }

    // ── Cập nhật HP ──
    let newPlayerHP = Math.max(0, battle.player_hp - bossDamage + vampiricHeal);
    let newBossHP = Math.max(0, battle.boss_hp - playerDamage);

    // Giới hạn HP player không vượt max
    newPlayerHP = Math.min(newPlayerHP, battle.player_max_hp);

    // Cập nhật trong DB
    await pool.execute(
      `UPDATE arena_battles SET
        player_hp = ?,
        boss_hp = ?,
        total_hits = total_hits + 1,
        player_damage_dealt = player_damage_dealt + ?,
        boss_damage_dealt = boss_damage_dealt + ?
       WHERE id = ?`,
      [newPlayerHP, newBossHP, playerDamage, bossDamage, battleId]
    );

    // Kiểm tra kết thúc trận
    let battleEnded = false;
    let outcome = null;

    if (newPlayerHP <= 0 && newBossHP <= 0) {
      outcome = 'draw';
      battleEnded = true;
    } else if (newBossHP <= 0) {
      outcome = 'victory';
      battleEnded = true;
    } else if (newPlayerHP <= 0) {
      outcome = 'defeat';
      battleEnded = true;
    }

    return {
      playerDamage,
      bossDamage,
      playerCrit,
      vampiricHeal,
      playerHP: newPlayerHP,
      bossHP: newBossHP,
      battleEnded,
      outcome,
    };
  },

  // ── Kết thúc trận đấu ──────────────────────────────────────
  async endBattle(userId, battleId, outcome, durationSeconds) {
    const battle = await ArenaModel.getPendingBattle(userId);
    if (!battle || battle.id !== battleId) {
      throw new Error('Trận đấu không tồn tại hoặc đã kết thúc');
    }

    // ── Tính phần thưởng dựa trên kết quả ──
    let expEarned = 0;
    let goldEarned = 0;

    // Tham gia đấu trường luôn nhận ít nhất 10 EXP
    const baseReward = 10;

    switch (outcome) {
      case 'victory':
        expEarned = baseReward + Math.floor(battle.boss_max_hp * 0.5);
        goldEarned = Math.floor(battle.boss_max_hp * 0.2);
        break;
      case 'defeat':
        expEarned = baseReward;
        goldEarned = 1;
        break;
      case 'draw':
        expEarned = baseReward + Math.floor(battle.boss_max_hp * 0.15);
        goldEarned = Math.floor(battle.boss_max_hp * 0.06);
        break;
      default:
        expEarned = baseReward;
    }

    // Lấy tổng damage đã gây ra từ DB
    const [battleRows] = await pool.execute(
      'SELECT total_hits, player_damage_dealt, boss_damage_dealt FROM arena_battles WHERE id = ?',
      [battleId]
    );
    const battleData = battleRows[0];

    // Lưu kết quả trận
    await ArenaModel.endBattle(battleId, {
      outcome,
      totalHits: battleData.total_hits,
      playerDamageDealt: battleData.player_damage_dealt,
      bossDamageDealt: battleData.boss_damage_dealt,
      expEarned,
      goldEarned,
      durationSeconds: durationSeconds || 0,
    });

    // Cộng EXP và Gold cho nhân vật
    const levelUpResult = await CharacterModel.addExp(userId, expEarned);
    await CharacterModel.addGold(userId, goldEarned);

    // Cập nhật HP thực tế của player sau trận (nếu thua thì HP = 0)
    if (outcome === 'defeat') {
      await CharacterModel.updateHP(userId, -battle.player_hp);
    }

    return {
      battleId,
      outcome,
      totalHits: battleData.total_hits,
      playerDamageDealt: battleData.player_damage_dealt,
      bossDamageDealt: battleData.boss_damage_dealt,
      expEarned,
      goldEarned,
      levelUp: levelUpResult,
    };
  },

  // ── Lấy lịch sử đấu trường ────────────────────────────────
  async getHistory(userId) {
    await ArenaModel.ensureTable();
    return ArenaModel.getHistory(userId);
  },

  // ── Lấy thống kê tổng hợp ─────────────────────────────────
  async getStats(userId) {
    await ArenaModel.ensureTable();
    return ArenaModel.getStats(userId);
  },
};

module.exports = ArenaService;
