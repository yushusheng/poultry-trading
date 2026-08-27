/**
 * 内存模式实现（演示/开发用）
 * 与 mysql.js 提供相同的方法签名，数据重启后丢失。
 * 内置一组演示数据：demo商户（merchant/123456）、demo用户（user/123456）。
 */
const bcrypt = require('bcryptjs');

let users = [];
let products = [];
let consultations = [];
let orders = [];

let nextUserId = 1;
let nextProductId = 1;
let nextConsultationId = 1;
let nextOrderId = 1;

const now = () => new Date().toISOString().replace('T', ' ').slice(0, 19);

function clone(obj) {
  return obj ? { ...obj } : obj;
}

function safeUser(u) {
  if (!u) return null;
  const { password, ...rest } = u;
  return clone(rest);
}

async function init() {
  const hash = bcrypt.hashSync('123456', 10);
  users = [
    { id: nextUserId++, username: 'merchant', password: hash, nickname: '张三禽业', phone: '13800000001', role: 'merchant', created_at: now() },
    { id: nextUserId++, username: 'user', password: hash, nickname: '李四买家', phone: '13900000002', role: 'user', created_at: now() }
  ];
  products = [
    { id: nextProductId++, merchant_id: 1, title: '农家散养土鸡', category: '鸡', description: '散养土鸡，肉质紧实，营养丰富，约2.5-3斤/只。', price: 68, unit: '只', stock: 200, image_url: '', status: 'on', created_at: now() },
    { id: nextProductId++, merchant_id: 1, title: '麻鸭', category: '鸭', description: '稻田麻鸭，口感鲜美，约3-3.5斤/只。', price: 45, unit: '只', stock: 150, image_url: '', status: 'on', created_at: now() },
    { id: nextProductId++, merchant_id: 1, title: '大白鹅', category: '鹅', description: '大白鹅，适合煲汤，约5斤/只。', price: 120, unit: '只', stock: 80, image_url: '', status: 'on', created_at: now() },
    { id: nextProductId++, merchant_id: 1, title: '土鸡蛋', category: '其他', description: '新鲜土鸡蛋，30枚/箱。', price: 35, unit: '箱', stock: 500, image_url: '', status: 'on', created_at: now() }
  ];
}

// ---------- 用户 ----------
async function findUserByUsername(username) {
  return users.find((u) => u.username === username) || null;
}

async function findUserById(id) {
  return safeUser(users.find((u) => u.id === Number(id)));
}

async function createUser({ username, password, nickname, phone, role }) {
  const user = { id: nextUserId++, username, password, nickname, phone, role, created_at: now() };
  users.push(user);
  return safeUser(user);
}

// ---------- 商品 ----------
async function listProducts({ keyword = '', category = '', merchantId = null } = {}) {
  return products
    .filter((p) => p.status === 'on')
    .filter((p) => !merchantId || p.merchant_id === merchantId)
    .filter((p) => !category || p.category === category)
    .filter((p) => !keyword || p.title.includes(keyword))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => {
      const m = users.find((u) => u.id === p.merchant_id);
      return { ...clone(p), merchant_name: m ? m.nickname : '' };
    });
}

async function listMerchantProducts(merchantId) {
  return products
    .filter((p) => p.merchant_id === merchantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((p) => {
      const m = users.find((u) => u.id === p.merchant_id);
      return { ...clone(p), merchant_name: m ? m.nickname : '' };
    });
}

async function getProduct(id) {
  const p = products.find((x) => x.id === Number(id));
  if (!p) return null;
  const m = users.find((u) => u.id === p.merchant_id);
  return { ...clone(p), merchant_name: m ? m.nickname : '', merchant_phone: m ? m.phone : '' };
}

async function createProduct({ merchantId, title, category, description, price, unit, stock, imageUrl, status }) {
  const p = {
    id: nextProductId++,
    merchant_id: merchantId,
    title,
    category,
    description: description || '',
    price: Number(price),
    unit: unit || '只',
    stock: Number(stock || 0),
    image_url: imageUrl || '',
    status: status || 'on',
    created_at: now()
  };
  products.push(p);
  return getProduct(p.id);
}

async function updateProduct(id, data) {
  const p = products.find((x) => x.id === Number(id));
  if (!p) return null;
  const map = { title: 'title', category: 'category', description: 'description', price: 'price', unit: 'unit', stock: 'stock', imageUrl: 'image_url', status: 'status' };
  Object.keys(data).forEach((k) => {
    if (map[k] && data[k] !== undefined) p[map[k]] = data[k];
  });
  return getProduct(p.id);
}

async function deleteProduct(id) {
  products = products.filter((x) => x.id !== Number(id));
  consultations = consultations.filter((c) => c.product_id !== Number(id));
}

// ---------- 咨询 ----------
async function createConsultation({ productId, userId, merchantId, content }) {
  const c = {
    id: nextConsultationId++,
    product_id: productId,
    user_id: userId,
    merchant_id: merchantId,
    content,
    reply: null,
    reply_at: null,
    created_at: now()
  };
  consultations.push(c);
  return getConsultation(c.id);
}

async function listConsultationsByUser(userId) {
  return consultations
    .filter((c) => c.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((c) => {
      const p = products.find((x) => x.id === c.product_id);
      const m = users.find((u) => u.id === c.merchant_id);
      return {
        ...clone(c),
        product_title: p ? p.title : '',
        product_image: p ? p.image_url : '',
        product_category: p ? p.category : '',
        merchant_name: m ? m.nickname : ''
      };
    });
}

async function listConsultationsByMerchant(merchantId) {
  return consultations
    .filter((c) => c.merchant_id === merchantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((c) => {
      const p = products.find((x) => x.id === c.product_id);
      const u = users.find((x) => x.id === c.user_id);
      return {
        ...clone(c),
        product_title: p ? p.title : '',
        product_image: p ? p.image_url : '',
        product_category: p ? p.category : '',
        user_name: u ? u.nickname : ''
      };
    });
}

async function getConsultation(id) {
  const c = consultations.find((x) => x.id === Number(id));
  if (!c) return null;
  const p = products.find((x) => x.id === c.product_id);
  const u = users.find((x) => x.id === c.user_id);
  const m = users.find((x) => x.id === c.merchant_id);
  return {
    ...clone(c),
    product_title: p ? p.title : '',
    product_image: p ? p.image_url : '',
    product_price: p ? p.price : 0,
    product_category: p ? p.category : '',
    user_name: u ? u.nickname : '',
    merchant_name: m ? m.nickname : ''
  };
}

async function replyConsultation(id, reply) {
  const c = consultations.find((x) => x.id === Number(id));
  if (!c) return null;
  c.reply = reply;
  c.reply_at = now();
  return getConsultation(c.id);
}

// ---------- 订单 ----------
async function createOrder({ orderNo, productId, userId, merchantId, quantity, totalPrice, contactName, contactPhone, address }) {
  const o = {
    id: nextOrderId++,
    order_no: orderNo,
    product_id: productId,
    user_id: userId,
    merchant_id: merchantId,
    quantity,
    total_price: Number(totalPrice),
    contact_name: contactName,
    contact_phone: contactPhone,
    address,
    status: 'pending',
    created_at: now(),
    paid_at: null
  };
  orders.push(o);
  return getOrder(o.id);
}

async function listOrdersByUser(userId) {
  return orders
    .filter((o) => o.user_id === userId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((o) => {
      const p = products.find((x) => x.id === o.product_id);
      return { ...clone(o), product_title: p ? p.title : '', product_image: p ? p.image_url : '', product_unit: p ? p.unit : '', product_category: p ? p.category : '' };
    });
}

async function listOrdersByMerchant(merchantId) {
  return orders
    .filter((o) => o.merchant_id === merchantId)
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
    .map((o) => {
      const p = products.find((x) => x.id === o.product_id);
      const u = users.find((x) => x.id === o.user_id);
      return { ...clone(o), product_title: p ? p.title : '', product_image: p ? p.image_url : '', product_unit: p ? p.unit : '', product_category: p ? p.category : '', user_name: u ? u.nickname : '' };
    });
}

async function getOrder(id) {
  const o = orders.find((x) => x.id === Number(id));
  if (!o) return null;
  const p = products.find((x) => x.id === o.product_id);
  const u = users.find((x) => x.id === o.user_id);
  return { ...clone(o), product_title: p ? p.title : '', product_image: p ? p.image_url : '', product_unit: p ? p.unit : '', product_category: p ? p.category : '', user_name: u ? u.nickname : '' };
}

async function updateOrderStatus(id, status) {
  const o = orders.find((x) => x.id === Number(id));
  if (!o) return null;
  o.status = status;
  if (status === 'paid') o.paid_at = now();
  return getOrder(o.id);
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
