const jwt = require('jsonwebtoken');
const UserModel = require('../models/userModel');

// ══════════════════════════════════════════════════════════════════
// AUTHENTICATE MIDDLEWARE — Bảo vệ routes cần đăng nhập
// Chạy TRƯỚC controller: xác thực JWT → gắn req.user
// ══════════════════════════════════════════════════════════════════

async function authenticate(req, res, next) {
  try {
    // Lấy token từ header: "Authorization: Bearer <token>"
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Không tìm thấy token xác thực',
      });
    }

    const token = authHeader.split(' ')[1];

    // Giải mã và xác thực token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Lấy thông tin user từ DB (đảm bảo user vẫn tồn tại)
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Người dùng không tồn tại',
      });
    }

    req.user = user; // đính kèm user vào request để controller dùng
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token đã hết hạn',
        code: 'TOKEN_EXPIRED',
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token không hợp lệ',
    });
  }
}

module.exports = authenticate;
