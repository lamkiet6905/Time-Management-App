-- LifeRPG Database Setup Script
-- Chạy script này trong MySQL Workbench

-- Tạo database
CREATE DATABASE IF NOT EXISTS liferpg
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE liferpg;

-- Kiểm tra database đã tạo
SHOW DATABASES LIKE 'liferpg';

-- Thông báo hoàn thành
SELECT 'Database liferpg đã được tạo thành công!' AS message;
