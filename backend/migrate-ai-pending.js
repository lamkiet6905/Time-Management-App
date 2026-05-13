require('dotenv').config();
const { sequelize } = require('./src/config/db');

async function migrate() {
  try {
    await sequelize.query(
      "ALTER TABLE tasks MODIFY COLUMN status ENUM('pending', 'done', 'failed', 'skipped', 'ai_pending') DEFAULT 'pending'"
    );
    console.log('✅ Added ai_pending status to tasks table');
  } catch (e) {
    if (e.message.includes('Duplicate')) {
      console.log('✅ ai_pending status already exists');
    } else {
      console.error('❌ Migration error:', e.message);
    }
  }
  process.exit(0);
}

migrate();
