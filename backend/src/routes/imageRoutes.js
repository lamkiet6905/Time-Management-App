const express = require('express');
const multer = require('multer');
const authenticate = require('../middleware/authenticate');
const ImageController = require('../controllers/imageController');

const router = express.Router();

// Cấu hình Multer (lưu trong memory — không ghi file tạm)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Tối đa 10MB
  fileFilter: (req, file, cb) => {
    // Chỉ cho phép ảnh
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file ảnh (jpg, png, webp)'));
    }
  },
});

// ── Routes ──────────────────────────────────────────────────
// POST /images/generate-sprites — Upload ảnh và sinh 3 sprite
router.post(
  '/generate-sprites',
  authenticate,
  upload.single('avatar'),
  ImageController.generateSprites
);

// GET /images/status — Kiểm tra trạng thái sprite
router.get('/status', authenticate, ImageController.getStatus);

// GET /images/avatar — Lấy ảnh avatar pixel art
router.get('/avatar', authenticate, ImageController.getAvatar);

module.exports = router;
