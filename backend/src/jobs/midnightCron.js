const cron = require('node-cron');
const { pool } = require('../config/db');
const TaskModel = require('../models/taskModel');
const CharacterModel = require('../models/characterModel');
const { calcDailyPenalty } = require('../utils/gameFormulas');

// ══════════════════════════════════════════════════════════════════
// MIDNIGHT CRON — Chạy lúc 00:00 hàng đêm
// Nhiệm vụ:
//   1. Quét tất cả Dailies chưa hoàn thành → trừ HP user
//   2. Reset trạng thái Dailies cho ngày mới
//   3. Ghi log kết quả
// ══════════════════════════════════════════════════════════════════

function startMidnightCron() {
  // Cron expression: 0 0 * * * = mỗi ngày lúc 00:00:00
  // Để test, đổi thành '*/1 * * * *' (mỗi phút)
  cron.schedule('0 0 * * *', async () => {
    console.log('\n🌙 [CRON] Midnight Reset bắt đầu...');
    const startTime = Date.now();

    try {
      // ── Bước 1: Lấy tất cả dailies chưa hoàn thành ────────
      const incompleteDailies = await TaskModel.getIncompleteDailies();
      console.log(`   📋 Tìm thấy ${incompleteDailies.length} dailies chưa hoàn thành`);

      // Gom theo user: { userId: [daily1, daily2, ...] }
      const userDailiesMap = {};
      for (const daily of incompleteDailies) {
        if (!userDailiesMap[daily.user_id]) {
          userDailiesMap[daily.user_id] = {
            dailies: [],
            user_name: daily.user_name,
          };
        }
        userDailiesMap[daily.user_id].dailies.push(daily);
      }

      // ── Bước 2: Trừ HP cho từng user ──────────────────────
      for (const [userId, userData] of Object.entries(userDailiesMap)) {
        let totalHpLost = 0;

        for (const daily of userData.dailies) {
          const penalty = calcDailyPenalty(daily.difficulty);
          totalHpLost += penalty;
        }

        // Trừ HP user
        await CharacterModel.updateHP(parseInt(userId), -totalHpLost);

        // Ghi log
        const today = new Date().toISOString().split('T')[0];
        try {
          await pool.execute(
            `INSERT INTO daily_reset_logs (user_id, missed_count, hp_lost, reset_date)
             VALUES (?, ?, ?, ?)`,
            [parseInt(userId), userData.dailies.length, totalHpLost, today]
          );
        } catch (err) {
          // Duplicate entry (đã reset rồi) → bỏ qua
        }

        console.log(`   ⚔️  ${userData.user_name}: miss ${userData.dailies.length} dailies, -${totalHpLost} HP`);
      }

      // ── Bước 3: Reset tất cả Dailies cho ngày mới ─────────
      await TaskModel.resetAllDailies();

      const elapsed = Date.now() - startTime;
      console.log(`   ✅ Midnight Reset hoàn tất trong ${elapsed}ms\n`);

    } catch (err) {
      console.error('   ❌ Lỗi Midnight Cron:', err);
    }
  }, {
    timezone: 'Asia/Ho_Chi_Minh', // Múi giờ Việt Nam
  });

  console.log('⏰ Midnight Cron đã lên lịch (00:00 hàng đêm, timezone Asia/Ho_Chi_Minh)');
}

module.exports = { startMidnightCron };
