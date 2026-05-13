/**
 * Seed script – Populates achievements and buffs tables.
 * Run: node src/utils/seed.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });
const { sequelize } = require('../config/db');
require('../models/index'); // Load associations
const { Achievement } = require('../models/Achievement');
const { Buff } = require('../models/Buff');

const achievements = [
  // Tasks
  { id: 'first_task',    name: 'Bước Đầu Tiên',    description: 'Hoàn thành task đầu tiên của bạn', icon: 'star', category: 'tasks',   condition_type: 'tasks_completed', condition_value: 1,   exp_reward: 20,  rarity: 'common'    },
  { id: 'task_10',       name: 'Chăm Chỉ',          description: 'Hoàn thành 10 tasks',              icon: 'checkmark-circle', category: 'tasks', condition_type: 'tasks_completed', condition_value: 10,  exp_reward: 50,  rarity: 'common'    },
  { id: 'task_50',       name: 'Siêng Năng',         description: 'Hoàn thành 50 tasks',              icon: 'ribbon', category: 'tasks',  condition_type: 'tasks_completed', condition_value: 50,  exp_reward: 150, rarity: 'rare'      },
  { id: 'task_100',      name: 'Bất Khuất',          description: 'Hoàn thành 100 tasks',             icon: 'medal', category: 'tasks',   condition_type: 'tasks_completed', condition_value: 100, exp_reward: 300, rarity: 'epic'      },
  { id: 'task_500',      name: 'Huyền Thoại',        description: 'Hoàn thành 500 tasks',             icon: 'trophy', category: 'tasks',  condition_type: 'tasks_completed', condition_value: 500, exp_reward: 1000, rarity: 'legendary' },
  { id: 'epic_slayer',   name: 'Người Diệt Epic',    description: 'Hoàn thành 10 task độ khó Epic',   icon: 'skull', category: 'tasks',   condition_type: 'epic_tasks',      condition_value: 10,  exp_reward: 200, rarity: 'rare'      },
  { id: 'ai_user',       name: 'Người Bạn AI',       description: 'Tạo 5 task bằng AI nhập liệu',     icon: 'sparkles', category: 'tasks', condition_type: 'ai_tasks',        condition_value: 5,   exp_reward: 50,  rarity: 'common'    },
  { id: 'night_owl',     name: 'Cú Đêm',             description: 'Hoàn thành 10 task sau 22:00',     icon: 'moon', category: 'special',  condition_type: 'night_tasks',     condition_value: 10,  exp_reward: 80,  rarity: 'common'    },
  { id: 'early_bird',    name: 'Chim Sớm',           description: 'Hoàn thành 10 task trước 7:00',    icon: 'sunny', category: 'special', condition_type: 'morning_tasks',   condition_value: 10,  exp_reward: 80,  rarity: 'common'    },
  // Streak
  { id: 'streak_3',      name: 'Khởi Đầu Tốt',      description: 'Duy trì streak 3 ngày liên tiếp',  icon: 'flame', category: 'streak',  condition_type: 'streak_days',     condition_value: 3,   exp_reward: 30,  rarity: 'common'    },
  { id: 'streak_7',      name: 'Tuần Hoàn Hảo',      description: 'Duy trì streak 7 ngày liên tiếp',  icon: 'flame', category: 'streak',  condition_type: 'streak_days',     condition_value: 7,   exp_reward: 100, rarity: 'rare'      },
  { id: 'streak_30',     name: 'Tháng Vàng',         description: 'Duy trì streak 30 ngày liên tiếp', icon: 'flame', category: 'streak',  condition_type: 'streak_days',     condition_value: 30,  exp_reward: 500, rarity: 'epic'      },
  { id: 'streak_100',    name: 'Thiết Kỷ Luật',      description: 'Duy trì streak 100 ngày liên tiếp',icon: 'flame', category: 'streak',  condition_type: 'streak_days',     condition_value: 100, exp_reward: 2000, rarity: 'legendary'},
  // Level
  { id: 'level_5',       name: 'Tân Thủ',            description: 'Đạt level 5',                      icon: 'arrow-up', category: 'level', condition_type: 'level_reached',   condition_value: 5,   exp_reward: 0,   rarity: 'common'    },
  { id: 'level_10',      name: 'Chiến Binh',         description: 'Đạt level 10',                     icon: 'shield', category: 'level',  condition_type: 'level_reached',   condition_value: 10,  exp_reward: 0,   rarity: 'rare'      },
  { id: 'level_25',      name: 'Dũng Sĩ',            description: 'Đạt level 25',                     icon: 'sword', category: 'level',   condition_type: 'level_reached',   condition_value: 25,  exp_reward: 0,   rarity: 'epic'      },
  { id: 'level_50',      name: 'Anh Hùng',           description: 'Đạt level 50',                     icon: 'cape', category: 'level',    condition_type: 'level_reached',   condition_value: 50,  exp_reward: 0,   rarity: 'legendary' },
  { id: 'level_100',     name: 'Thần Thánh',         description: 'Đạt level 100 – Đỉnh cao tuyệt đối',icon: 'planet', category: 'level', condition_type: 'level_reached',   condition_value: 100, exp_reward: 0,   rarity: 'legendary' },
  // Special
  { id: 'comeback',      name: 'Hồi Sinh',           description: 'HP về 0 và hồi phục trở lại',      icon: 'heart', category: 'special', condition_type: 'hp_zero_recover', condition_value: 1,   exp_reward: 100, rarity: 'rare'      },
  { id: 'perfectionist', name: 'Hoàn Hảo',           description: 'Không fail task nào trong 30 ngày', icon: 'diamond', category:'special',condition_type: 'no_fail_days',   condition_value: 30,  exp_reward: 500, rarity: 'epic'      },
];

const buffs = [
  { id: 'exp_boost_s',      name: 'Học Viên',       description: '+20% EXP từ tất cả task trong 7 ngày',           icon: 'book',       effect_type: 'exp_multiplier', effect_value: 20,   duration_days: 7,  is_one_time: false, min_level: 1  },
  { id: 'exp_boost_m',      name: 'Học Giả',        description: '+50% EXP từ tất cả task trong 3 ngày',           icon: 'school',     effect_type: 'exp_multiplier', effect_value: 50,   duration_days: 3,  is_one_time: false, min_level: 5  },
  { id: 'hp_regen',         name: 'Hồi Phục',       description: '+5 HP mỗi ngày trong 5 ngày',                    icon: 'heart',      effect_type: 'hp_regen',       effect_value: 5,    duration_days: 5,  is_one_time: false, min_level: 1  },
  { id: 'hp_shield',        name: 'Khiên Máu',      description: 'Giảm 30% HP penalty từ task thất bại (7 ngày)',   icon: 'shield',     effect_type: 'hp_shield',      effect_value: 30,   duration_days: 7,  is_one_time: false, min_level: 3  },
  { id: 'streak_protect',   name: 'Bảo Vệ Streak',  description: 'Không mất streak nếu bỏ 1 ngày (dùng 1 lần)',    icon: 'lock-closed',effect_type: 'streak_protect', effect_value: 1,    duration_days: null, is_one_time: true, min_level: 7 },
  { id: 'double_exp',       name: 'Nhân Đôi',       description: 'x2 EXP cho task tiếp theo bạn hoàn thành',       icon: 'flash',      effect_type: 'double_exp',     effect_value: 2,    duration_days: null, is_one_time: true, min_level: 1 },
  { id: 'max_hp_up',        name: 'Sức Sống',       description: '+20 HP tối đa vĩnh viễn',                        icon: 'fitness',    effect_type: 'max_hp_increase', effect_value: 20,  duration_days: null, is_one_time: true, min_level: 10},
  { id: 'no_penalty_easy',  name: 'Giảm Tải',       description: 'Task Easy/Normal không bị trừ HP (5 ngày)',       icon: 'happy',      effect_type: 'no_penalty',     effect_value: 1,    duration_days: 5,  is_one_time: false, min_level: 2  },
  { id: 'exp_boost_xl',     name: 'Bậc Thầy',       description: '+100% EXP từ tất cả task trong 1 ngày',          icon: 'star',       effect_type: 'exp_multiplier', effect_value: 100,  duration_days: 1,  is_one_time: false, min_level: 15 },
];

async function seed() {
  try {
    await sequelize.authenticate();
    try {
      await sequelize.query("UPDATE tasks SET status = 'pending' WHERE status NOT IN ('pending', 'done', 'failed', 'skipped')");
      console.log('✅ Cleaned up invalid task statuses');
    } catch (e) {
      console.log('ℹ️ Skipping status cleanup (table may not exist or other error)');
    }
    await sequelize.sync({ alter: true });
    console.log('✅ DB connected');

    // Upsert achievements
    for (const a of achievements) {
      await Achievement.upsert(a);
    }
    console.log(`✅ Seeded ${achievements.length} achievements`);

    // Upsert buffs
    for (const b of buffs) {
      await Buff.upsert(b);
    }
    console.log(`✅ Seeded ${buffs.length} buffs`);

    console.log('🎉 Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed();
