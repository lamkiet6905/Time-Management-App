const admin = require('firebase-admin');
const path = require('path');
require('dotenv').config();

// ── Firebase Admin SDK ──────────────────────────────────────────
// Dùng cho: Firebase Storage (lưu ảnh sprite) + FCM (Push Notification)
// Cần file serviceAccountKey.json từ Firebase Console

let firebaseInitialized = false;

function initFirebase() {
  if (firebaseInitialized) return;

  try {
    const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT || './firebase-service-account.json');
    const serviceAccount = require(serviceAccountPath);

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });

    firebaseInitialized = true;
    console.log('🔥 Firebase Admin SDK đã khởi tạo!');
  } catch (err) {
    console.warn('⚠️  Firebase chưa được cấu hình:', err.message);
    console.warn('   → Tính năng upload ảnh và push notification sẽ không hoạt động.');
    console.warn('   → Tạo file firebase-service-account.json từ Firebase Console.');
  }
}

// Lấy Firebase Storage bucket
function getStorageBucket() {
  if (!firebaseInitialized) {
    throw new Error('Firebase chưa được khởi tạo. Gọi initFirebase() trước.');
  }
  return admin.storage().bucket();
}

// Lấy Firebase Messaging instance (cho Push Notification)
function getMessaging() {
  if (!firebaseInitialized) {
    throw new Error('Firebase chưa được khởi tạo. Gọi initFirebase() trước.');
  }
  return admin.messaging();
}

module.exports = { initFirebase, getStorageBucket, getMessaging, admin };
