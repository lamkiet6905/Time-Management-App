const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');
const { v4: uuidv4 } = require('uuid');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: () => uuidv4(),
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING(50),
    allowNull: false,
    unique: true,
    validate: { len: [3, 50] },
  },
  email: {
    type: DataTypes.STRING(100),
    allowNull: false,
    unique: true,
    validate: { isEmail: true },
  },
  password_hash: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  avatar_url: {
    type: DataTypes.STRING(500),
    defaultValue: null,
  },
  display_name: {
    type: DataTypes.STRING(100),
    defaultValue: null,
  },
  bio: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
  level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  exp: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  exp_to_next: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  hp: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  max_hp: {
    type: DataTypes.INTEGER,
    defaultValue: 100,
  },
  streak_days: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  last_active_date: {
    type: DataTypes.DATEONLY,
    defaultValue: null,
  },
  total_tasks_completed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  total_tasks_failed: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
  },
  active_buffs: {
    type: DataTypes.JSON,
    defaultValue: [],
  },
  pending_level_up: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  refresh_token: {
    type: DataTypes.TEXT,
    defaultValue: null,
  },
}, {
  tableName: 'users',
});

module.exports = User;
