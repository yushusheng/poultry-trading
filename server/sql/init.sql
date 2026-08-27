-- =============================================
-- 鸡鸭禽买卖系统 - MySQL 初始化脚本
-- 使用方法: mysql -u root -p < sql/init.sql
-- =============================================

CREATE DATABASE IF NOT EXISTS poultry_market
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE poultry_market;

DROP TABLE IF EXISTS orders;
DROP TABLE IF EXISTS consultations;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS users;

-- 用户表（用户端/商户端）
CREATE TABLE users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE COMMENT '登录用户名',
  password VARCHAR(255) NOT NULL COMMENT 'bcrypt 加密后的密码',
  nickname VARCHAR(50) NOT NULL DEFAULT '' COMMENT '昵称/商户名称',
  phone VARCHAR(20) NOT NULL DEFAULT '' COMMENT '联系电话',
  role ENUM('user', 'merchant') NOT NULL DEFAULT 'user' COMMENT '角色：user用户端 merchant商户端',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB COMMENT='用户表';

-- 商品表
CREATE TABLE products (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  merchant_id INT UNSIGNED NOT NULL COMMENT '发布商户id',
  title VARCHAR(100) NOT NULL COMMENT '商品标题',
  category VARCHAR(20) NOT NULL DEFAULT '鸡' COMMENT '分类：鸡/鸭/鹅/其他',
  description TEXT COMMENT '商品描述',
  price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '单价',
  unit VARCHAR(20) NOT NULL DEFAULT '只' COMMENT '计价单位',
  stock INT NOT NULL DEFAULT 0 COMMENT '库存',
  image_url VARCHAR(255) NOT NULL DEFAULT '' COMMENT '封面图地址',
  images TEXT COMMENT '多图地址 JSON 数组',
  status ENUM('on', 'off') NOT NULL DEFAULT 'on' COMMENT '上架状态',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_merchant (merchant_id),
  KEY idx_category (category)
) ENGINE=InnoDB COMMENT='商品表';

-- 咨询表
CREATE TABLE consultations (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  product_id INT UNSIGNED NOT NULL COMMENT '关联商品',
  user_id INT UNSIGNED NOT NULL COMMENT '咨询用户',
  merchant_id INT UNSIGNED NOT NULL COMMENT '被咨询商户',
  content VARCHAR(500) NOT NULL COMMENT '咨询内容',
  reply VARCHAR(500) DEFAULT NULL COMMENT '商户回复',
  reply_at DATETIME DEFAULT NULL COMMENT '回复时间',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_product (product_id),
  KEY idx_user (user_id),
  KEY idx_merchant (merchant_id)
) ENGINE=InnoDB COMMENT='咨询表';

-- 订单表（交易记录）
CREATE TABLE orders (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  order_no VARCHAR(32) NOT NULL UNIQUE COMMENT '订单号',
  product_id INT UNSIGNED NOT NULL COMMENT '商品id',
  user_id INT UNSIGNED NOT NULL COMMENT '买家id',
  merchant_id INT UNSIGNED NOT NULL COMMENT '商户id',
  quantity INT NOT NULL DEFAULT 1 COMMENT '购买数量',
  total_price DECIMAL(10,2) NOT NULL DEFAULT 0 COMMENT '总价',
  contact_name VARCHAR(50) NOT NULL DEFAULT '' COMMENT '收货人',
  contact_phone VARCHAR(20) NOT NULL DEFAULT '' COMMENT '联系电话',
  address VARCHAR(255) NOT NULL DEFAULT '' COMMENT '收货地址',
  status ENUM('pending', 'paid', 'completed', 'cancelled') NOT NULL DEFAULT 'pending' COMMENT '状态：待支付/已支付/已完成/已取消',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at DATETIME DEFAULT NULL COMMENT '支付时间',
  KEY idx_user (user_id),
  KEY idx_merchant (merchant_id),
  KEY idx_product (product_id)
) ENGINE=InnoDB COMMENT='订单表';

-- ============ 演示数据 ============
-- 密码均为 123456（bcrypt）
INSERT INTO users (username, password, nickname, phone, role) VALUES
('merchant', '$2a$10$rdjwg6JfOdsDb.awc3syuu1j9eRf0rxG15TW4ON4kqwSmc30cfNlu', '张三禽业', '13800000001', 'merchant'),
('user',     '$2a$10$rdjwg6JfOdsDb.awc3syuu1j9eRf0rxG15TW4ON4kqwSmc30cfNlu', '李四买家', '13900000002', 'user');

INSERT INTO products (merchant_id, title, category, description, price, unit, stock, image_url, status) VALUES
(1, '农家散养土鸡', '鸡', '散养土鸡，肉质紧实，营养丰富，约2.5-3斤/只。', 68.00, '只', 200, '', 'on'),
(1, '稻田麻鸭',   '鸭', '稻田麻鸭，口感鲜美，约3-3.5斤/只。', 45.00, '只', 150, '', 'on'),
(1, '大白鹅',     '鹅', '大白鹅，适合煲汤，约5斤/只。', 120.00, '只', 80, '', 'on'),
(1, '土鸡蛋',     '其他', '新鲜土鸡蛋，30枚/箱。', 35.00, '箱', 500, '', 'on');

-- 演示订单（跨最近几个月，覆盖多个分类与状态；仅 paid/completed 计入统计）
INSERT INTO orders (order_no, product_id, user_id, merchant_id, quantity, total_price, contact_name, contact_phone, address, status, created_at, paid_at) VALUES
('DEMO00000001', 1, 2, 1, 2, 136.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'paid',      DATE_SUB(NOW(), INTERVAL 0 DAY),  DATE_SUB(NOW(), INTERVAL 0 DAY)),
('DEMO00000002', 2, 2, 1, 3, 135.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 0 DAY),  DATE_SUB(NOW(), INTERVAL 0 DAY)),
('DEMO00000003', 4, 2, 1, 1, 35.00,  '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 1 DAY),  DATE_SUB(NOW(), INTERVAL 1 DAY)),
('DEMO00000004', 3, 2, 1, 1, 120.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'paid',      DATE_SUB(NOW(), INTERVAL 3 DAY),  DATE_SUB(NOW(), INTERVAL 3 DAY)),
('DEMO00000005', 1, 2, 1, 5, 340.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 6 DAY),  DATE_SUB(NOW(), INTERVAL 6 DAY)),
('DEMO00000006', 2, 2, 1, 4, 180.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 12 DAY), DATE_SUB(NOW(), INTERVAL 12 DAY)),
('DEMO00000007', 4, 2, 1, 2, 70.00,  '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'paid',      DATE_SUB(NOW(), INTERVAL 20 DAY), DATE_SUB(NOW(), INTERVAL 20 DAY)),
('DEMO00000008', 3, 2, 1, 2, 240.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 35 DAY), DATE_SUB(NOW(), INTERVAL 35 DAY)),
('DEMO00000009', 1, 2, 1, 6, 408.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'paid',      DATE_SUB(NOW(), INTERVAL 55 DAY), DATE_SUB(NOW(), INTERVAL 55 DAY)),
('DEMO00000010', 2, 2, 1, 5, 225.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 90 DAY), DATE_SUB(NOW(), INTERVAL 90 DAY)),
('DEMO00000011', 4, 2, 1, 3, 105.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'completed', DATE_SUB(NOW(), INTERVAL 130 DAY), DATE_SUB(NOW(), INTERVAL 130 DAY)),
('DEMO00000012', 3, 2, 1, 1, 120.00, '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'paid',      DATE_SUB(NOW(), INTERVAL 160 DAY), DATE_SUB(NOW(), INTERVAL 160 DAY)),
('DEMO00000013', 1, 2, 1, 1, 68.00,  '李四买家', '13900000002', '浙江省杭州市西湖区XX路1号', 'pending',   DATE_SUB(NOW(), INTERVAL 0 DAY),  NULL);
