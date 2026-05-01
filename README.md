# LifeRPG - Quản lý thời gian biểu tích hợp AI và Game

## 👥 Thành viên thực hiện
+ Lâm Tuấn Kiệt-0209868
+ Luyện Đức Chiến-0204968

## 🌟 Giới thiệu
LifeRPG không chỉ là một ứng dụng quản lý thời gian thông thường mà còn là một trò chơi nhập vai thực thụ. Dự án được phát triển nhằm giải quyết sự trì hoãn và nhàm chán của các ứng dụng to-do list truyền thống, giúp người dùng duy trì kỷ luật thông qua các cơ chế thưởng/phạt hấp dẫn

### Mục tiêu dự án
- Tối ưu nhập liệu: sử dụng AI để đơn giản hóa việc tạo công việc
- Duy trì kỷ luật: biến nỗ lực cá nhân thành các chỉ số trong game để tạo động lực
- Đa nền tảng: hoạt động ổn định trên cả android và ios

### Tính năng cốt lõi
1. Nhóm Chức năng Thông minh 
- Nhập liệu tự nhiên: Tự động bóc tách tên công việc và thời gian từ câu lệnh ngôn ngữ tự nhiên của người dùng.
- Trọng tài AI: Phân tích nội dung công việc để gán nhãn cấp độ kỷ luật (Thường nhật hoặc Kỷ luật cao).

2. Nhóm Game hóa
- Hệ thống Status: Hiển thị Level, thanh EXP (Kinh nghiệm) và HP (Máu) của người dùng.
- Cơ chế Thưởng/Phạt: Cộng EXP khi hoàn thành nhiệm vụ và trừ HP khi bỏ lỡ công việc.
- Hệ thống Danh hiệu: Tặng huy hiệu dựa trên các tiêu chí đạt được để ghi nhận nỗ lực.

3. Quản lý Thời gian
- Quản lý Task: Giao diện thêm/sửa/xóa và danh sách công việc trực quan.
- Lịch biểu: Hiển thị tổng quan kế hoạch theo ngày và tháng.
- Thông báo: Nhắc nhở thông minh khi đến hạn công việc.

### Công nghệ sử dụng
- Frontend: React Native + Expo
- Backend: Node.js. Database: MySQL(server) & SQLite
- AI: Google Gemini API hoặc các mô hình NLP hiện đại
- Bảo mật: JWT để xác thực và mã hóa mật khẩu người dùng

### Yêu cầu hệ thống
- Hiệu năng: API phản hồi < 2 giây, ứng dụng đạt tốc độ 60 FPS.
- Khả dụng: Hoạt động tốt ngay cả khi không có kết nối mạng (Offline).
- Giao diện: Phong cách Game độc đáo, thao tác nhập liệu tối ưu không quá 3 bước.

---

## 📋 Yêu Cầu Cài Đặt
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
