const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

function generateTokens(userId) {
  const accessToken = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
  const refreshToken = jwt.sign({ userId, type: 'refresh' }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  });
  return { accessToken, refreshToken };
}

// POST /api/auth/register
async function register(req, res) {
  try {
    const { username, email, password, display_name } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, message: 'Username, email và password là bắt buộc' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'Password phải có ít nhất 6 ký tự' });
    }

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: 'Email đã được sử dụng' });
    }
    const existingUsername = await User.findOne({ where: { username } });
    if (existingUsername) {
      return res.status(409).json({ success: false, message: 'Username đã được sử dụng' });
    }

    const password_hash = await bcrypt.hash(password, 12);
    const user = await User.create({
      username,
      email,
      password_hash,
      display_name: display_name || username,
    });

    const { accessToken, refreshToken } = generateTokens(user.id);
    await user.update({ refresh_token: refreshToken });

    res.status(201).json({
      success: true,
      message: 'Đăng ký thành công',
      data: {
        accessToken,
        refreshToken,
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// POST /api/auth/login
async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email và password là bắt buộc' });
    }

    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Email hoặc password không đúng' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Email hoặc password không đúng' });
    }

    const { accessToken, refreshToken } = generateTokens(user.id);
    await user.update({ refresh_token: refreshToken });

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      data: {
        accessToken,
        refreshToken,
        user: formatUser(user),
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

// POST /api/auth/refresh
async function refresh(req, res) {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }

    const user = await User.findByPk(decoded.userId);
    if (!user || user.refresh_token !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Token không hợp lệ' });
    }

    const tokens = generateTokens(user.id);
    await user.update({ refresh_token: tokens.refreshToken });

    res.json({ success: true, data: tokens });
  } catch (error) {
    res.status(401).json({ success: false, message: 'Token hết hạn hoặc không hợp lệ' });
  }
}

// POST /api/auth/logout
async function logout(req, res) {
  try {
    await req.user.update({ refresh_token: null });
    res.json({ success: true, message: 'Đăng xuất thành công' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
}

function formatUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    display_name: user.display_name,
    avatar_url: user.avatar_url,
    level: user.level,
    exp: user.exp,
    exp_to_next: user.exp_to_next,
    hp: user.hp,
    max_hp: user.max_hp,
    streak_days: user.streak_days,
    total_tasks_completed: user.total_tasks_completed,
    pending_level_up: user.pending_level_up,
    active_buffs: user.active_buffs,
  };
}

module.exports = { register, login, refresh, logout, formatUser };
