const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();
const { testConnection } = require('./src/config/db');
const { initFirebase } = require('./src/config/firebase');
const { initSocket } = require('./src/config/socket');
const { startMidnightCron } = require('./src/jobs/midnightCron');

// ── Import Routes ────────────────────────────────────────────
const authRoutes      = require('./src/routes/authRoutes');
const taskRoutes      = require('./src/routes/taskRoutes');
const characterRoutes = require('./src/routes/characterRoutes');
const socialRoutes    = require('./src/routes/socialRoutes');
const messageRoutes   = require('./src/routes/messageRoutes');
const imageRoutes     = require('./src/routes/imageRoutes');
const arenaRoutes     = require('./src/routes/arenaRoutes');

const app = express();
const server = http.createServer(app);

// ── Khởi tạo Socket.IO ────────────────────────────────────────
initSocket(server);

// ── Middleware toàn cục ──────────────────────────────────────
app.use(cors());                              // Cho phép mọi origin (dev)
app.use(express.json({ limit: '10mb' }));     // Parse JSON body (tăng limit cho upload ảnh)
app.use(express.urlencoded({ extended: true }));

// Phục vụ thư mục uploads dạng static file
const path = require('path');
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ── Routes ──────────────────────────────────────────────────
app.use('/auth',      authRoutes);       // /auth/register, /auth/login, ...
app.use('/tasks',     taskRoutes);       // /tasks, /tasks/:id/score, ...
app.use('/character', characterRoutes);  // /character/profile, /character/buffs
app.use('/social',    socialRoutes);     // /social/friend-request, /social/friends, ...
app.use('/messages',  messageRoutes);    // /messages/inbox, /messages/:contactId
app.use('/images',    imageRoutes);      // /images/generate-sprites, /images/status
app.use('/arena',     arenaRoutes);      // /arena/start, /arena/hit, /arena/end

// Route test server
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'LifeRPG 3.0 server đang chạy 🚀',
    version: '3.0.0',
    timestamp: new Date().toISOString(),
  });
});

// ── Error handler toàn cục ──────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Lỗi server:', err.stack);
  res.status(500).json({
    success: false,
    message: 'Lỗi server nội bộ',
  });
});

// ── Khởi động server ────────────────────────────────────────
const PORT = process.env.PORT || 3000;

async function start() {
  // 1. Test kết nối MySQL
  await testConnection();

  // 2. Khởi tạo Firebase (không crash nếu chưa config)
  initFirebase();

  // 3. Startup reset — kiểm tra nếu cron midnight miss thì reset ngay
  try {
    const TaskModel = require('./src/models/taskModel');
    const { pool } = require('./src/config/db');
    const today = new Date().toISOString().split('T')[0];
    
    // Kiểm tra xem có daily nào is_completed_today = TRUE mà updated_at khác hôm nay không
    const [stale] = await pool.execute(
      `SELECT COUNT(*) as cnt FROM tasks 
       WHERE type = 'daily' AND is_completed_today = TRUE AND DATE(updated_at) != CURDATE()`
    );
    
    if (stale[0].cnt > 0) {
      console.log(`\n🔄 [STARTUP] Phát hiện ${stale[0].cnt} dailies chưa reset → reset ngay...`);
      await TaskModel.resetAllDailies();
      console.log('   ✅ Startup reset hoàn tất');
    } else {
      console.log('✅ Dailies đã được reset cho hôm nay');
    }
  } catch (err) {
    console.error('⚠️ Lỗi startup reset:', err.message);
  }

  // 4. Khởi động Midnight Cron
  startMidnightCron();

  // 4. Lắng nghe requests
  server.listen(PORT, () => {
    console.log(`\n🚀 LifeRPG 3.0 Server đang chạy tại http://localhost:${PORT}`);
    console.log(`   📡 Health check: http://localhost:${PORT}/health\n`);
  });
}

start();
