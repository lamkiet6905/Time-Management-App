const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Achievement = sequelize.define('Achievement', {
  id: {
    type: DataTypes.STRING(50),
    primaryKey: true,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  icon: {
    type: DataTypes.STRING(100),
    defaultValue: 'trophy',
  },
  category: {
    type: DataTypes.ENUM('tasks', 'streak', 'level', 'social', 'special'),
    allowNull: false,
  },
  condition_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'tasks_completed, streak_days, level_reached, etc.',
  },
  condition_value: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  condition_extra: {
    type: DataTypes.JSON,
    defaultValue: null,
    comment: 'Extra conditions like time_of_day, difficulty, etc.',
  },
  exp_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  rarity: {
    type: DataTypes.ENUM('common', 'rare', 'epic', 'legendary'),
    defaultValue: 'common',
  },
}, {
  tableName: 'achievements',
  timestamps: false,
});

const UserAchievement = sequelize.define('UserAchievement', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  achievement_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  unlocked_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
}, {
  tableName: 'user_achievements',
  timestamps: false,
});

module.exports = { Achievement, UserAchievement };
