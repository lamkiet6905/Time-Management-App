const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  due_date: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  duration_minutes: {
    type: DataTypes.INTEGER,
    defaultValue: null,
  },
  priority: {
    type: DataTypes.ENUM('low', 'medium', 'high'),
    defaultValue: 'medium',
  },
  difficulty: {
    type: DataTypes.ENUM('easy', 'normal', 'hard', 'epic'),
    defaultValue: 'normal',
  },
  exp_reward: {
    type: DataTypes.INTEGER,
    defaultValue: 50,
  },
  hp_penalty: {
    type: DataTypes.INTEGER,
    defaultValue: 10,
  },
  status: {
    type: DataTypes.ENUM('pending', 'done', 'failed', 'skipped'),
    defaultValue: 'pending',
  },
  source: {
    type: DataTypes.ENUM('manual', 'ai'),
    defaultValue: 'manual',
  },
  ai_raw_input: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  tags: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  completed_at: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  // For offline sync
  client_id: {
    type: DataTypes.STRING(100),
    defaultValue: null,
    comment: 'Client-generated ID for offline sync',
  },
}, {
  tableName: 'tasks',
});

module.exports = Task;
