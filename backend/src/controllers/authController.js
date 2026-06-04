const AuthService = require('../services/authService');

// ══════════════════════════════════════════════════════════════════
// AUTH CONTROLLER — Xử lý HTTP requests cho xác thực
// ══════════════════════════════════════════════════════════════════

const AuthController = {

  async register(req, res) {
    try {
      const { name, email, password } = req.body;

      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập đầy đủ họ tên, email và mật khẩu',
        });
      }
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Mật khẩu phải có ít nhất 6 ký tự',
        });
      }

      const data = await AuthService.register({ name, email, password });

      return res.status(201).json({
        success: true,
        message: 'Đăng ký thành công',
        data,
      });
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message,
      });
    }
  },

  async login(req, res) {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng nhập email và mật khẩu',
        });
      }

      const data = await AuthService.login({ email, password });

      return res.status(200).json({
        success: true,
        message: 'Đăng nhập thành công',
        data,
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }
  },

  // Refresh token
  async refresh(req, res) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          message: 'Thiếu refresh token',
        });
      }

      const data = await AuthService.refreshToken(refreshToken);
      return res.status(200).json({
        success: true,
        message: 'Refresh token thành công',
        data,
      });
    } catch (err) {
      return res.status(401).json({
        success: false,
        message: err.message,
      });
    }
  },

  // Kiểm tra token hiện tại
  async me(req, res) {
    return res.status(200).json({
      success: true,
      data: req.user,
    });
  },

  // Lưu FCM Token từ điện thoại
  async saveFcmToken(req, res) {
    try {
      const userId = req.user.id;
      const { fcmToken } = req.body;
      
      if (!fcmToken) {
        return res.status(400).json({ success: false, message: 'Thiếu fcmToken' });
      }

      const UserModel = require('../models/userModel');
      await UserModel.updateFcmToken(userId, fcmToken);

      return res.status(200).json({
        success: true,
        message: 'Lưu Push Token thành công',
      });
    } catch (err) {
      return res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = AuthController;
