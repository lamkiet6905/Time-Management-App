const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// ══════════════════════════════════════════════════════════════════
// AUTH SERVICE — Business logic xác thực
// Pattern: Controller → Service → Model
// ══════════════════════════════════════════════════════════════════

const AuthService = {

  async register({ name, email, password }) {
    // 1. Kiểm tra email trùng
    const existingUser = await UserModel.findByEmail(email);
    if (existingUser) {
      throw new Error('Email này đã được đăng ký');
    }

    // 2. Hash password (10 salt rounds — cân bằng bảo mật/tốc độ)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Lưu vào DB
    const userId = await UserModel.create({ name, email, hashedPassword });

    // 4. Tạo tokens
    const tokens = generateTokens(userId);

    return { userId, name, email, ...tokens };
  },

  async login({ email, password }) {
    // 1. Tìm user
    const user = await UserModel.findByEmail(email);
    if (!user) {
      // Thông báo chung chung — tránh leak thông tin email tồn tại
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // 2. Kiểm tra password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      throw new Error('Email hoặc mật khẩu không đúng');
    }

    // 3. Tạo tokens
    const tokens = generateTokens(user.id);

    return {
      userId: user.id,
      name: user.name,
      email: user.email,
      ...tokens,
    };
  },

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
      const user = await UserModel.findById(decoded.userId);
      if (!user) throw new Error('User không tồn tại');

      const tokens = generateTokens(user.id);
      return tokens;
    } catch (err) {
      throw new Error('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  },
};

// ── Helper: Tạo cặp Access + Refresh token ─────────────────
function generateTokens(userId) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES }
  );

  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES }
  );

  return { accessToken, refreshToken };
}

module.exports = AuthService;
