const ImageService = require('../services/imageService');
const fs = require('fs');

// ══════════════════════════════════════════════════════════════════
// IMAGE CONTROLLER — Xử lý upload ảnh & sinh avatar/sprite
//
// Luồng mới:
// POST /images/generate-sprites → Sinh avatar (sync) + sprites (async)
// GET  /images/status           → Kiểm tra trạng thái sprite
// GET  /images/avatar           → Lấy ảnh avatar pixel art
// ══════════════════════════════════════════════════════════════════

const ImageController = {
  // POST /images/generate-sprites
  // Body: multipart/form-data với field "avatar" (file ảnh chân dung)
  // Response: Avatar pixel art được trả về ngay, sprites chạy ngầm
  async generateSprites(req, res) {
    try {
      const userId = req.user.id;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'Vui lòng upload ảnh chân dung (field name: avatar)',
        });
      }

      const imageBuffer = req.file.buffer;
      console.log(`📸 User ${userId} upload ảnh: ${req.file.originalname} (${imageBuffer.length} bytes)`);

      // Sinh avatar (đồng bộ) + trigger sprites (bất đồng bộ)
      const result = await ImageService.processPortrait(userId, imageBuffer);

      res.json({
        success: true,
        message: 'Avatar pixel art đã sẵn sàng! Sprites đang được sinh ngầm...',
        data: result,
      });
    } catch (err) {
      console.error('❌ Lỗi generate:', err.message);
      res.status(500).json({
        success: false,
        message: err.message || 'Lỗi sinh ảnh',
      });
    }
  },

  // GET /images/status
  // Kiểm tra trạng thái sprite (avatar_pixel_url + sprite_status)
  async getStatus(req, res) {
    try {
      const userId = req.user.id;
      const status = await ImageService.getSpriteStatus(userId);

      if (!status) {
        return res.status(404).json({ success: false, message: 'User không tồn tại' });
      }

      res.json({
        success: true,
        data: status,
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },

  // GET /images/avatar
  // Serve ảnh avatar pixel art (dạng binary PNG)
  async getAvatar(req, res) {
    try {
      const userId = req.user.id;
      const status = await ImageService.getSpriteStatus(userId);

      if (!status || !status.avatar_pixel_url) {
        return res.status(404).json({ success: false, message: 'Chưa có avatar' });
      }

      // Resolve relative path → absolute path
      const path = require('path');
      let filePath = status.avatar_pixel_url;
      if (!path.isAbsolute(filePath)) {
        filePath = path.join(__dirname, '../../', filePath);
      }

      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ success: false, message: 'File avatar không tồn tại' });
      }

      res.setHeader('Content-Type', 'image/png');
      res.sendFile(path.resolve(filePath));
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  },
};

module.exports = ImageController;
