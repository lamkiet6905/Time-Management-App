require('dotenv').config();
const { sequelize } = require('./src/config/db');

async function cleanup() {
  try {
    console.log('Fetching indexes for users table...');
    const [indexes] = await sequelize.query("SHOW INDEX FROM users");
    
    const indexNames = new Set();
    indexes.forEach(idx => {
      if (idx.Key_name !== 'PRIMARY') {
        indexNames.add(idx.Key_name);
      }
    });

    for (const idxName of indexNames) {
      console.log(`Dropping index: ${idxName}`);
      try {
        await sequelize.query(`ALTER TABLE users DROP INDEX \`${idxName}\``);
      } catch (e) {
        console.log(`Could not drop ${idxName}: ${e.message}`);
      }
    }
    
    console.log('Successfully dropped duplicate/unnecessary indexes.');
    
    // Now let sequelize sync it once properly without duplicates
    console.log('Re-syncing table to create proper constraints...');
    await sequelize.sync({ alter: true });
    console.log('Done!');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    process.exit();
  }
}

cleanup();
