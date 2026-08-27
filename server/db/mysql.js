/**
 * MySQL 实现
 * 需要先执行 sql/init.sql 初始化数据库与表结构。
 */
const mysql = require('mysql2/promise');
const config = require('../config');

let pool = null;

async function init() {
  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    user: config.db.user,
    password: config.db.password,
    database: config.db.database,
    waitForConnections: true,
    connectionLimit: 10,
    charset: 'utf8mb4'
  });
  await pool.query('SELECT 1');
}

async function q(sql, params) {
  const [rows] = await pool.query(sql, params || []);
  return rows;
}

// ---------- 用户 ----------
async function findUserByUsername(username) {
  const rows = await q('SELECT * FROM users WHERE username = ? LIMIT 1', [username]);
  return rows[0] || null;
}

async function findUserById(id) {
  const rows = await q('SELECT id, username, nickname, phone, role, created_at FROM users WHERE id = ? LIMIT 1', [id]);
  return rows[0] || null;
}

async function createUser({ username, password, nickname, phone, role }) {
  const r = await q(
    'INSERT INTO users (username, password, nickname, phone, role) VALUES (?, ?, ?, ?, ?)',
    [username, password, nickname, phone, role]
  );
  return findUserById(r.insertId);
}

// ---------- 商品 ----------
async function listProducts({ keyword = '', category = '', merchantId = null } = {}) {
  let sql = `
    SELECT p.*, u.nickname AS merchant_name
    FROM products p
    LEFT JOIN users u ON u.id = p.merchant_id
    WHERE p.status = 'on'
  `;
  const params = [];
  if (merchantId) { sql += ' AND p.merchant_id = ?'; params.push(merchantId); }
  if (category) { sql += ' AND p.category = ?'; params.push(category); }
  if (keyword) { sql += ' AND p.title LIKE ?'; params.push(`%${keyword}%`); }
  sql += ' ORDER BY p.created_at DESC';
  return q(sql, params);
}

async function listMerchantProducts(merchantId) {
  const sql = `
    SELECT p.*, u.nickname AS merchant_name
    FROM products p
    LEFT JOIN users u ON u.id = p.merchant_id
    WHERE p.merchant_id = ?
    ORDER BY p.created_at DESC
  `;
  return q(sql, [merchantId]);
}

async function getProduct(id) {
  const rows = await q(
    `SELECT p.*, u.nickname AS merchant_name, u.phone AS merchant_phone
     FROM products p
     LEFT JOIN users u ON u.id = p.merchant_id
     WHERE p.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function createProduct({ merchantId, title, category, description, price, unit, stock, imageUrl, status }) {
  const r = await q(
    `INSERT INTO products (merchant_id, title, category, description, price, unit, stock, image_url, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [merchantId, title, category, description, price, unit, stock, imageUrl, status]
  );
  return getProduct(r.insertId);
}

async function updateProduct(id, data) {
  const fields = [];
  const params = [];
  const map = {
    title: 'title', category: 'category', description: 'description', price: 'price',
    unit: 'unit', stock: 'stock', imageUrl: 'image_url', status: 'status'
  };
  Object.keys(data).forEach((k) => {
    if (map[k] && data[k] !== undefined) {
      fields.push(`${map[k]} = ?`);
      params.push(data[k]);
    }
  });
  if (!fields.length) return getProduct(id);
  params.push(id);
  await q(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, params);
  return getProduct(id);
}

async function deleteProduct(id) {
  await q('DELETE FROM products WHERE id = ?', [id]);
}

// ---------- 咨询 ----------
async function createConsultation({ productId, userId, merchantId, content }) {
  const r = await q(
    'INSERT INTO consultations (product_id, user_id, merchant_id, content) VALUES (?, ?, ?, ?)',
    [productId, userId, merchantId, content]
  );
  return getConsultation(r.insertId);
}

async function listConsultationsByUser(userId) {
  return q(
    `SELECT c.*, p.title AS product_title, p.image_url AS product_image, p.category AS product_category,
            u.nickname AS merchant_name
     FROM consultations c
     LEFT JOIN products p ON p.id = c.product_id
     LEFT JOIN users u ON u.id = c.merchant_id
     WHERE c.user_id = ?
     ORDER BY c.created_at DESC`,
    [userId]
  );
}

async function listConsultationsByMerchant(merchantId) {
  return q(
    `SELECT c.*, p.title AS product_title, p.image_url AS product_image, p.category AS product_category,
            u.nickname AS user_name
     FROM consultations c
     LEFT JOIN products p ON p.id = c.product_id
     LEFT JOIN users u ON u.id = c.user_id
     WHERE c.merchant_id = ?
     ORDER BY c.created_at DESC`,
    [merchantId]
  );
}

async function getConsultation(id) {
  const rows = await q(
    `SELECT c.*, p.title AS product_title, p.image_url AS product_image, p.price AS product_price, p.category AS product_category,
            u.nickname AS user_name, m.nickname AS merchant_name
     FROM consultations c
     LEFT JOIN products p ON p.id = c.product_id
     LEFT JOIN users u ON u.id = c.user_id
     LEFT JOIN users m ON m.id = c.merchant_id
     WHERE c.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function replyConsultation(id, reply) {
  await q('UPDATE consultations SET reply = ?, reply_at = NOW() WHERE id = ?', [reply, id]);
  return getConsultation(id);
}

// ---------- 订单 ----------
async function createOrder({ orderNo, productId, userId, merchantId, quantity, totalPrice, contactName, contactPhone, address }) {
  const r = await q(
    `INSERT INTO orders (order_no, product_id, user_id, merchant_id, quantity, total_price, contact_name, contact_phone, address)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [orderNo, productId, userId, merchantId, quantity, totalPrice, contactName, contactPhone, address]
  );
  return getOrder(r.insertId);
}

async function listOrdersByUser(userId) {
  return q(
    `SELECT o.*, p.title AS product_title, p.image_url AS product_image, p.unit AS product_unit, p.category AS product_category
     FROM orders o
     LEFT JOIN products p ON p.id = o.product_id
     WHERE o.user_id = ?
     ORDER BY o.created_at DESC`,
    [userId]
  );
}

async function listOrdersByMerchant(merchantId) {
  return q(
    `SELECT o.*, p.title AS product_title, p.image_url AS product_image, p.unit AS product_unit, p.category AS product_category,
            u.nickname AS user_name
     FROM orders o
     LEFT JOIN products p ON p.id = o.product_id
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.merchant_id = ?
     ORDER BY o.created_at DESC`,
    [merchantId]
  );
}

async function getOrder(id) {
  const rows = await q(
    `SELECT o.*, p.title AS product_title, p.image_url AS product_image, p.unit AS product_unit, p.category AS product_category,
            u.nickname AS user_name
     FROM orders o
     LEFT JOIN products p ON p.id = o.product_id
     LEFT JOIN users u ON u.id = o.user_id
     WHERE o.id = ? LIMIT 1`,
    [id]
  );
  return rows[0] || null;
}

async function updateOrderStatus(id, status) {
  if (status === 'paid') {
    await q('UPDATE orders SET status = ?, paid_at = NOW() WHERE id = ?', [status, id]);
  } else {
    await q('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  }
  return getOrder(id);
}

module.exports = {
  init,
  findUserByUsername,
  findUserById,
  createUser,
  listProducts,
  listMerchantProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  createConsultation,
  listConsultationsByUser,
  listConsultationsByMerchant,
  getConsultation,
  replyConsultation,
  createOrder,
  listOrdersByUser,
  listOrdersByMerchant,
  getOrder,
  updateOrderStatus
};
