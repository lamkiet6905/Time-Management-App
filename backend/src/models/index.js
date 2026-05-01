const User = require('./User');
const Task = require('./Task');
const { Achievement, UserAchievement } = require('./Achievement');
const { Buff, UserBuff } = require('./Buff');

// User → Tasks (one to many)
User.hasMany(Task, { foreignKey: 'user_id', as: 'tasks', onDelete: 'CASCADE' });
Task.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

// User ↔ Achievements (many to many via UserAchievement)
User.belongsToMany(Achievement, {
  through: UserAchievement,
  foreignKey: 'user_id',
  as: 'achievements',
});
Achievement.belongsToMany(User, {
  through: UserAchievement,
  foreignKey: 'achievement_id',
  as: 'users',
});
UserAchievement.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
UserAchievement.belongsTo(Achievement, { foreignKey: 'achievement_id', as: 'Achievement' });

// User ↔ Buffs (many to many via UserBuff)
User.belongsToMany(Buff, {
  through: UserBuff,
  foreignKey: 'user_id',
  as: 'buffs',
});
Buff.belongsToMany(User, {
  through: UserBuff,
  foreignKey: 'buff_id',
  as: 'users',
});
UserBuff.belongsTo(User, { foreignKey: 'user_id', as: 'User' });
UserBuff.belongsTo(Buff, { foreignKey: 'buff_id', as: 'Buff' });

module.exports = { User, Task, Achievement, UserAchievement, Buff, UserBuff };
