const { getMessaging } = require('../config/firebase');
const { pool } = require('../config/db');

// ══════════════════════════════════════════════════════════════════
// NOTIFICATION SERVICE — Bắn thông báo đẩy (Push Notifications)
// ══════════════════════════════════════════════════════════════════

const NotificationService = {
  
  // Gửi thông báo đến 1 user cụ thể
  async sendToUser(userId, title, body, data = {}) {
    try {
      // 1. Lấy fcm_token của user
      const [rows] = await pool.execute('SELECT fcm_token FROM users WHERE id = ?', [userId]);
      if (rows.length === 0 || !rows[0].fcm_token) {
        // User chưa đăng nhập trên mobile hoặc chưa cấp quyền push notification
        return false;
      }
      
      const token = rows[0].fcm_token;
      
      // 2. Gửi thông báo qua Firebase Admin
      const messaging = getMessaging();
      const message = {
        token,
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK', // standard Expo/Firebase click action
        },
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'liferpg-default',
          },
        },
        apns: {
          payload: {
            aps: {
              sound: 'default',
              contentAvailable: true,
            },
          },
        },
      };

      await messaging.send(message);
      return true;
    } catch (err) {
      console.error(`❌ Lỗi gửi thông báo cho user ${userId}:`, err.message);
      return false;
    }
  },
};

module.exports = NotificationService;
