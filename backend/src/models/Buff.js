const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Buff = sequelize.define('Buff', {
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
    defaultValue: 'flash',
  },
  effect_type: {
    type: DataTypes.STRING(50),
    allowNull: false,
    comment: 'exp_multiplier, hp_regen, hp_shield, streak_protect, double_exp, max_hp_increase, deadline_extend, no_penalty',
  },
  effect_value: {
    type: DataTypes.DECIMAL(6, 2),
    defaultValue: 0,
  },
  duration_days: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    comment: 'NULL = permanent/one-time',
  },
  is_one_time: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  min_level: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
    comment: 'Minimum level required for this buff to appear',
  },
}, {
  tableName: 'buffs',
  timestamps: false,
});

const UserBuff = sequelize.define('UserBuff', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  user_id: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  buff_id: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  chosen_at: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  expires_at: {
    type: DataTypes.DATE,
    defaultValue: null,
  },
  is_active: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  uses_remaining: {
    type: DataTypes.INTEGER,
    defaultValue: null,
    comment: 'NULL = unlimited, 1 = one-time use',
  },
}, {
  tableName: 'user_buffs',
  timestamps: false,
});

module.exports = { Buff, UserBuff };
