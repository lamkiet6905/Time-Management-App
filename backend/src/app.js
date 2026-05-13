require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/db');

// ⚠️ IMPORTANT: Load ALL models & associations first, before anything else
require('./models/index');

const cronJobs = require('./utils/cronJobs');

// Routes
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const userRoutes = require('./routes/user');
const buffRoutes = require('./routes/buffs');
const achievementRoutes = require('./routes/achievements');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/user', userRoutes);
app.use('/api/buffs', buffRoutes);
app.use('/api/achievements', achievementRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 3000;

// Start server
async function start() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully.');
    await sequelize.sync(); // Bỏ { alter: true } để không tự sinh thêm index thừa mỗi lần restart
    console.log('✅ Database synchronized.');
    cronJobs.init();
    console.log('✅ Cron jobs initialized.');
    app.listen(PORT, () => {
      console.log(`🚀 LifeRPG Backend running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

start();
