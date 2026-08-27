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

// ---------- 数据统计 ----------
const SOLD_SQL = "status IN ('paid','completed')";

async function statsOverview(merchantId, { date, month, year } = {}) {
  const base = 'FROM orders WHERE merchant_id = ? AND ' + SOLD_SQL;
  const build = (cond, extra) => {
    const sql = `SELECT COALESCE(SUM(total_price),0) AS amount, COALESCE(SUM(quantity),0) AS quantity, COUNT(*) AS orders ${base} AND ${cond}`;
    const params = extra === undefined || extra === '' || extra === null ? [merchantId] : [merchantId, extra];
    return { sql, params };
  };
  const todayQ = build(date ? 'DATE(created_at) = ?' : 'DATE(created_at) = CURDATE()', date);
  const monthQ = build(month ? "DATE_FORMAT(created_at,'%Y-%m') = ?" : "DATE_FORMAT(created_at,'%Y-%m') = DATE_FORMAT(CURDATE(),'%Y-%m')", month);
  const yearQ = build(year ? 'YEAR(created_at) = ?' : 'YEAR(created_at) = YEAR(CURDATE())', year);
  const [today] = await q(todayQ.sql, todayQ.params);
  const [monthRow] = await q(monthQ.sql, monthQ.params);
  const [yearRow] = await q(yearQ.sql, yearQ.params);
  return { today, month: monthRow, year: yearRow };
}

async function statsDaily(merchantId, month) {
  return q(
    `SELECT DATE(created_at) AS date, COALESCE(SUM(total_price),0) AS amount, COALESCE(SUM(quantity),0) AS quantity, COUNT(*) AS orders
     FROM orders
     WHERE merchant_id = ? AND ${SOLD_SQL} AND DATE_FORMAT(created_at,'%Y-%m') = ?
     GROUP BY DATE(created_at) ORDER BY date`,
    [merchantId, month]
  );
}

async function statsMonthly(merchantId, months) {
  const d = new Date();
  d.setMonth(d.getMonth() - (months - 1));
  d.setDate(1);
  const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  return q(
    `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COALESCE(SUM(total_price),0) AS amount, COALESCE(SUM(quantity),0) AS quantity, COUNT(*) AS orders
     FROM orders
     WHERE merchant_id = ? AND ${SOLD_SQL} AND created_at >= ?
     GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month`,
    [merchantId, start]
  );
}

async function statsCategory(merchantId, { month, date, year }) {
  let where;
  let params;
  if (date) {
    where = "o.merchant_id = ? AND " + SOLD_SQL + " AND DATE(o.created_at) = ?";
    params = [merchantId, date];
  } else if (year) {
    where = "o.merchant_id = ? AND " + SOLD_SQL + " AND YEAR(o.created_at) = ?";
    params = [merchantId, year];
  } else {
    where = "o.merchant_id = ? AND " + SOLD_SQL + " AND DATE_FORMAT(o.created_at,'%Y-%m') = ?";
    params = [merchantId, month];
  }
  return q(
    `SELECT p.category AS category, COALESCE(SUM(o.total_price),0) AS amount, COALESCE(SUM(o.quantity),0) AS quantity, COUNT(*) AS orders
     FROM orders o
     INNER JOIN products p ON p.id = o.product_id
     WHERE ${where}
     GROUP BY p.category ORDER BY amount DESC`,
    params
  );
}

// 某年每月售出（供日历年视图）
async function statsYearDetail(merchantId, year) {
  return q(
    `SELECT DATE_FORMAT(created_at,'%Y-%m') AS month, COALESCE(SUM(total_price),0) AS amount, COALESCE(SUM(quantity),0) AS quantity, COUNT(*) AS orders
     FROM orders
     WHERE merchant_id = ? AND ${SOLD_SQL} AND YEAR(created_at) = ?
     GROUP BY DATE_FORMAT(created_at,'%Y-%m') ORDER BY month`,
    [merchantId, year]
  );
}

// 近 N 年每年售出
async function statsYearly(merchantId, years) {
  const y = new Date().getFullYear();
  const startYear = y - (years - 1);
  return q(
    `SELECT YEAR(created_at) AS year, COALESCE(SUM(total_price),0) AS amount, COALESCE(SUM(quantity),0) AS quantity, COUNT(*) AS orders
     FROM orders
     WHERE merchant_id = ? AND ${SOLD_SQL} AND created_at >= ?
     GROUP BY YEAR(created_at) ORDER BY year`,
    [merchantId, `${startYear}-01-01`]
  );
}

module.exports = {
  init,
  statsOverview,
  statsDaily,
  statsMonthly,
  statsYearDetail,
  statsYearly,
  statsCategory,
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
