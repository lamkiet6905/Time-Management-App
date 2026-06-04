// ══════════════════════════════════════════════════════════════════
// MIGRATION — Thêm các cột thiếu vào bảng users
// Chạy: node src/config/migration-add-missing-cols.js
// ══════════════════════════════════════════════════════════════════

const mysql2 = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const connection = await mysql2.createConnection({
    host:     process.env.DB_HOST,
    port:     process.env.DB_PORT,
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  console.log('🔧 Đang thêm các cột thiếu vào bảng users...\n');

  const columnsToAdd = [
    {
      name: 'avatar_pixel_url',
      sql: 'ALTER TABLE users ADD COLUMN avatar_pixel_url VARCHAR(500) NULL AFTER avatar_original_url',
    },
    {
      name: 'character_description',
      sql: 'ALTER TABLE users ADD COLUMN character_description TEXT NULL AFTER avatar_pixel_url',
    },
    {
      name: 'fcm_token',
      sql: 'ALTER TABLE users ADD COLUMN fcm_token VARCHAR(500) NULL AFTER sprite_status',
    },
  ];

  for (const col of columnsToAdd) {
    try {
      // Kiểm tra cột đã tồn tại chưa
      const [rows] = await connection.query(`SHOW COLUMNS FROM users LIKE '${col.name}'`);
      if (rows.length > 0) {
        console.log(`  ⏭️  Cột "${col.name}" đã tồn tại → bỏ qua`);
      } else {
        await connection.query(col.sql);
        console.log(`  ✅ Đã thêm cột "${col.name}"`);
      }
    } catch (err) {
      console.error(`  ❌ Lỗi thêm cột "${col.name}":`, err.message);
    }
  }

  console.log('\n🎉 Migration hoàn tất!');
  await connection.end();
}

migrate().catch((err) => {
  console.error('❌ Lỗi migration:', err);
  process.exit(1);
});
