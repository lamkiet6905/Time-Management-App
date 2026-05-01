# LifeRPG – Hướng Dẫn Cài Đặt & Chạy

## 📋 Yêu Cầu
- Node.js 18+
- MySQL (MySQL Workbench)
- Expo Go app trên điện thoại (hoặc Android Emulator)

---

## 🔧 Bước 1: Thiết Lập Database MySQL

1. Mở **MySQL Workbench**
2. Kết nối vào MySQL server (root)
3. Mở file `database/init.sql`
4. Chạy script để tạo database `liferpg`

---

## 🔧 Bước 2: Cấu Hình Backend

Mở file `backend/.env` và điền thông tin:

```env
DB_PASSWORD=your_mysql_password   # Mật khẩu MySQL root của bạn
GEMINI_API_KEY=your_key_here      # Lấy tại: https://aistudio.google.com/app/apikey
```

---

## 🚀 Bước 3: Khởi Động Backend

```bash
cd backend
npm run dev
```

Server sẽ chạy tại: **http://localhost:3000**

Sau khi server khởi động lần đầu, chạy seed data:

```bash
npm run seed
```

---

## 📱 Bước 4: Cấu Hình Frontend

Mở file `frontend/constants/theme.ts`:

```typescript
// Nếu dùng Android Emulator:
export const API_BASE_URL = 'http://10.0.2.2:3000/api';

// Nếu dùng thiết bị thật (thay IP bằng IP máy tính của bạn):
export const API_BASE_URL = 'http://192.168.x.x:3000/api';
```

Để biết IP của máy tính: chạy `ipconfig` trong CMD, tìm dòng **IPv4 Address**

---

## 🚀 Bước 5: Khởi Động Frontend

```bash
cd frontend
npm start
```

- Quét QR code bằng **Expo Go** app trên điện thoại
- Hoặc nhấn `a` để chạy Android Emulator

---

## 🤖 Cấu Hình Gemini AI (Tùy chọn)

1. Truy cập: https://aistudio.google.com/app/apikey
2. Đăng nhập bằng tài khoản Google
3. Tạo API key mới (miễn phí)
4. Dán vào `backend/.env`: `GEMINI_API_KEY=your_key`
5. Restart backend

> **Lưu ý:** Nếu chưa có key, AI input vẫn hoạt động nhưng sẽ tạo task cơ bản không có phân tích ngữ cảnh.

---

## 📁 Cấu Trúc Dự Án

```
LifeRPG/
├── backend/          # Node.js + Express API
│   ├── src/
│   │   ├── models/   # Sequelize models
│   │   ├── routes/   # API routes
│   │   ├── controllers/
│   │   ├── services/ # AI, RPG, Achievement engines
│   │   └── utils/    # Cron jobs, seed
│   └── .env          # ← Cần điền password và API key
│
├── frontend/         # React Native + Expo
│   ├── app/          # Expo Router screens
│   ├── components/   # Reusable UI components
│   ├── stores/       # Zustand state
│   ├── services/     # API, SQLite, offline sync
│   └── constants/    # Theme, colors, API URL
│
└── database/
    └── init.sql      # ← Chạy trong MySQL Workbench
```

---

## 🎮 Hệ Thống RPG

| Độ Khó | EXP | HP Penalty |
|--------|-----|-----------|
| Easy ⭐ | 20 | -5 HP |
| Normal ⚔️ | 50 | -10 HP |
| Hard 🔥 | 100 | -20 HP |
| Epic 💎 | 200 | -35 HP |

- **Level up** = Chọn 1 trong 3 buff
- **Streak** = Bonus EXP (3 ngày: +10%, 7 ngày: +25%, 30 ngày: +50%)
- **HP = 0** = Mất 1 level
