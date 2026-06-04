// ══════════════════════════════════════════════════════════════════
// DATABASE INITIALIZATION — Tạo toàn bộ bảng cho LifeRPG 3.0
// Chạy: npm run db:init
// ══════════════════════════════════════════════════════════════════

const mysql2 = require('mysql2/promise');
require('dotenv').config();

async function initDatabase() {
  // Kết nối KHÔNG chỉ định database (để tạo DB nếu chưa có)
  const connection = await mysql2.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    multipleStatements: true, // cho phép chạy nhiều câu SQL cùng lúc
  });

  const dbName = process.env.DB_NAME;

  console.log('🔧 Đang khởi tạo database LifeRPG 3.0...\n');

  // ── Bước 1: Tạo database ──────────────────────────────────
  await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await connection.query(`USE \`${dbName}\``);
  console.log(`✅ Database "${dbName}" đã sẵn sàng`);

  // Xóa các bảng cũ liên quan đến tổ đội nếu có (tránh lỗi xung đột)
  try {
    await connection.query(`ALTER TABLE users DROP FOREIGN KEY IF EXISTS fk_user_party`);
    await connection.query(`DROP TABLE IF EXISTS party_members, parties, bosses`);
    // Thử xóa cột party_id nếu bảng users đã tồn tại
    const [cols] = await connection.query(`SHOW COLUMNS FROM users LIKE 'party_id'`);
    if (cols.length > 0) {
      await connection.query(`ALTER TABLE users DROP COLUMN party_id`);
    }
  } catch (err) {
    // Bỏ qua nếu bảng hoặc FK chưa tồn tại
  }

  // ── Bước 2: Tạo bảng ──────────────────────────────────────

  // BẢNG 1: USERS (mở rộng RPG stats)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      name                VARCHAR(100) NOT NULL,
      email               VARCHAR(255) UNIQUE NOT NULL,
      password            VARCHAR(255) NOT NULL,

      -- RPG Character Stats
      level               INT DEFAULT 1,
      exp                 INT DEFAULT 0,
      exp_to_next         INT DEFAULT 100,
      hp                  INT DEFAULT 50,
      max_hp              INT DEFAULT 50,
      strength            INT DEFAULT 10,
      speed               INT DEFAULT 10,
      gold                DECIMAL(10,2) DEFAULT 0,

      -- Sprite URLs (Firebase Storage)
      avatar_original_url VARCHAR(500) NULL,
      avatar_pixel_url    VARCHAR(500) NULL,
      character_description TEXT NULL,
      sprite_idle_url     VARCHAR(500) NULL,
      sprite_attack_url   VARCHAR(500) NULL,
      sprite_hurt_url     VARCHAR(500) NULL,
      sprite_status       ENUM('none','processing','ready','failed') DEFAULT 'none',

      -- Push Notifications
      fcm_token           VARCHAR(500) NULL,

      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      INDEX idx_email (email)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng users');

  // BẢNG 2: USER_BUFFS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_buffs (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      buff_type     ENUM('vampiric_strike','critical_focus','iron_shield') NOT NULL,
      unlock_level  INT NOT NULL,
      is_active     BOOLEAN DEFAULT TRUE,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_user_buff (user_id, buff_type)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng user_buffs');

  // BẢNG 3: TASKS (Habits, Dailies, To-Dos)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id                  INT AUTO_INCREMENT PRIMARY KEY,
      user_id             INT NOT NULL,
      type                ENUM('habit','daily','todo') NOT NULL,
      title               VARCHAR(255) NOT NULL,
      notes               TEXT NULL,
      difficulty          ENUM('trivial','easy','medium','hard') DEFAULT 'medium',

      -- Habit-specific
      positive_count      INT DEFAULT 0,
      negative_count      INT DEFAULT 0,
      last_positive_at    TIMESTAMP NULL,

      -- Daily-specific
      is_completed_today  BOOLEAN DEFAULT FALSE,
      streak              INT DEFAULT 0,
      repeat_days         VARCHAR(7) DEFAULT '1111111',

      -- Todo-specific
      due_date            DATE NULL,
      is_done             BOOLEAN DEFAULT FALSE,
      done_at             TIMESTAMP NULL,

      -- Chung
      base_exp_reward     INT DEFAULT 10,
      base_gold_reward    DECIMAL(10,2) DEFAULT 5.00,
      created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_user_type (user_id, type),
      INDEX idx_daily_completed (user_id, type, is_completed_today)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng tasks');

  // BẢNG 4: HABIT_LOGS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS habit_logs (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      task_id       INT NOT NULL,
      user_id       INT NOT NULL,
      direction     ENUM('positive','negative') NOT NULL,
      exp_earned    INT DEFAULT 0,
      gold_earned   DECIMAL(10,2) DEFAULT 0,
      logged_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_task_time (task_id, logged_at)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng habit_logs');

  // BẢNG 5: DAILY_RESET_LOGS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS daily_reset_logs (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      user_id       INT NOT NULL,
      missed_count  INT DEFAULT 0,
      hp_lost       INT DEFAULT 0,
      reset_date    DATE NOT NULL,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_user_date (user_id, reset_date)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng daily_reset_logs');

  // BẢNG 6: FRIENDS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS friends (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      requester_id  INT NOT NULL,
      receiver_id   INT NOT NULL,
      status        ENUM('pending','accepted','rejected','blocked') DEFAULT 'pending',
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      FOREIGN KEY (requester_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      UNIQUE KEY uq_friend_pair (requester_id, receiver_id),
      INDEX idx_receiver (receiver_id, status)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng friends');

  // BẢNG 7: MESSAGES
  await connection.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      sender_id     INT NOT NULL,
      receiver_id   INT NOT NULL,
      content       TEXT NOT NULL,
      is_read       BOOLEAN DEFAULT FALSE,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_conversation (sender_id, receiver_id, created_at),
      INDEX idx_unread (receiver_id, is_read)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng messages');

  // BẢNG 8: BATTLE_LOGS (Cho Arena 1-1)
  await connection.query(`
    CREATE TABLE IF NOT EXISTS battle_logs (
      id            INT AUTO_INCREMENT PRIMARY KEY,
      attacker_id   INT NOT NULL,
      defender_id   INT NOT NULL,
      damage_dealt  INT NOT NULL,
      is_critical   BOOLEAN DEFAULT FALSE,
      hp_healed     INT DEFAULT 0,
      created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (attacker_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (defender_id) REFERENCES users(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng battle_logs');

  // BẢNG 9: ACHIEVEMENTS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS achievements (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      key_name        VARCHAR(50) UNIQUE NOT NULL,
      title           VARCHAR(100) NOT NULL,
      description     TEXT NOT NULL,
      icon_url        VARCHAR(500) NULL,
      category        ENUM('tasks','social','combat','special') DEFAULT 'tasks',
      condition_type  VARCHAR(50) NOT NULL,
      condition_value INT NOT NULL,
      exp_reward      INT DEFAULT 50,
      gold_reward     DECIMAL(10,2) DEFAULT 25.00,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng achievements');

  // BẢNG 10: USER_ACHIEVEMENTS
  await connection.query(`
    CREATE TABLE IF NOT EXISTS user_achievements (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      achievement_id  INT NOT NULL,
      unlocked_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (achievement_id) REFERENCES achievements(id) ON DELETE CASCADE,
      UNIQUE KEY uq_user_achievement (user_id, achievement_id)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng user_achievements');

  // BẢNG 11: IMAGE_QUEUE
  await connection.query(`
    CREATE TABLE IF NOT EXISTS image_queue (
      id              INT AUTO_INCREMENT PRIMARY KEY,
      user_id         INT NOT NULL,
      original_url    VARCHAR(500) NOT NULL,
      status          ENUM('pending','processing','completed','failed') DEFAULT 'pending',
      error_message   TEXT NULL,
      attempts        INT DEFAULT 0,
      max_attempts    INT DEFAULT 3,
      created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      INDEX idx_status (status)
    ) ENGINE=InnoDB
  `);
  console.log('  ✅ Bảng image_queue');

  // ── Bước 3: Seed Data ─────────────────────────────────────
  console.log('\n📦 Đang seed dữ liệu mặc định...');

  // Seed Achievements
  await connection.query(`
    INSERT IGNORE INTO achievements (key_name, title, description, category, condition_type, condition_value, exp_reward, gold_reward) VALUES
      ('daily_destroyer',  'Kẻ Hủy Diệt Trì Hoãn', '7 ngày liên tiếp hoàn thành tất cả Dailies',  'tasks',   'streak_days',  7,  100, 50.00),
      ('first_blood',      'Máu Đầu',               'Hoàn thành task đầu tiên',                      'tasks',   'tasks_done',   1,   25, 10.00),
      ('centurion',        'Bách Chiến Bách Thắng',  'Hoàn thành 100 tasks',                          'tasks',   'tasks_done', 100,  200, 100.00),
      ('social_butterfly', 'Bướm Xã Giao',          'Kết bạn với 10 người',                          'social',  'friends_count',10,  50,  25.00),
      ('arena_warrior',    'Chiến Binh Đấu Trường', 'Tham gia 10 trận đấu Arena',                    'combat',  'arena_fights',10, 100,  50.00)
  `);
  console.log('  ✅ Seed achievements');

  console.log('\n🎉 Khởi tạo database hoàn tất! LifeRPG 3.0 sẵn sàng.\n');

  await connection.end();
}

initDatabase().catch((err) => {
  console.error('❌ Lỗi khởi tạo database:', err);
  process.exit(1);
});
