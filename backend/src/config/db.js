const mysql2 = require('mysql2/promise');
require('dotenv').config();

// ── Connection Pool ──────────────────────────────────────────────
// Pool = nhóm connection dùng chung, tái sử dụng thay vì tạo mới mỗi request
// Tối ưu hiệu năng cho server nhiều request đồng thời
const pool = mysql2.createPool({
  host:     process.env.DB_HOST,
  port:     process.env.DB_PORT,
  user:     process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,   // chờ nếu pool đang bận
  connectionLimit: 10,         // tối đa 10 connection cùng lúc
  queueLimit: 0,               // không giới hạn hàng chờ
});

// Kiểm tra kết nối khi server khởi động
async function testConnection() {
  try {
    const conn = await pool.getConnection();
    console.log('✅ Kết nối MySQL thành công!');
    conn.release(); // trả connection về pool
  } catch (err) {
    console.error('❌ Kết nối MySQL thất bại:', err.message);
    process.exit(1); // tắt server nếu không kết nối được DB
  }
}

module.exports = { pool, testConnection };
