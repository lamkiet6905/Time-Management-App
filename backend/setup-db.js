/**
 * LifeRPG – Interactive MySQL password setup
 * Run: node setup-db.js
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(res => rl.question(q, res));

async function main() {
  console.log('\n🔧 LifeRPG – Thiết lập Database\n');

  const host = process.env.DB_HOST || 'localhost';
  const port = parseInt(process.env.DB_PORT || '3306');
  const user = process.env.DB_USER || 'root';
  const dbName = process.env.DB_NAME || 'liferpg';

  console.log(`MySQL: ${user}@${host}:${port}  |  DB: ${dbName}`);

  const password = await ask('Nhập mật khẩu MySQL root (Enter nếu không có): ');

  // Test connection
  try {
    const conn = await mysql.createConnection({ host, port, user, password });
    console.log('\n✅ Kết nối MySQL thành công!');

    // Create database
    await conn.execute(`CREATE DATABASE IF NOT EXISTS \`${dbName}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`✅ Database "${dbName}" đã sẵn sàng`);
    await conn.end();

    // Write password to .env
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.readFileSync(envPath, 'utf8');
    envContent = envContent.replace(/^DB_PASSWORD=.*/m, `DB_PASSWORD=${password}`);
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Đã lưu DB_PASSWORD vào .env');
    console.log('\n🚀 Bây giờ chạy: npm run dev\n');

  } catch (err) {
    console.error(`\n❌ Kết nối thất bại: ${err.message}`);
    console.log('\n💡 Gợi ý:');
    console.log('  - Mở MySQL Workbench → double-click connection → xem password được lưu');
    console.log('  - Hoặc mở MySQL Workbench → Edit Connection → Advanced → chạy test connection');
    console.log('  - Hoặc reset password: mở cmd với quyền Admin, chạy: mysqld --skip-grant-tables');
  }
  rl.close();
}

main();
