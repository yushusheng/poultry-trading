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

function now() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

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
  // 演示订单（跨最近几个月，覆盖多个分类与状态）
  const p = (n) => String(n).padStart(2, '0');
  const at = (daysAgo, hour = 10) => {
    const d = new Date();
    d.setDate(d.getDate() - daysAgo);
    return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(hour)}:${p((daysAgo * 7) % 60)}:00`;
  };
  const seedOrders = [
    { productId: 1, daysAgo: 0, qty: 2, status: 'paid' },
    { productId: 2, daysAgo: 0, qty: 3, status: 'completed' },
    { productId: 4, daysAgo: 1, qty: 1, status: 'completed' },
    { productId: 3, daysAgo: 3, qty: 1, status: 'paid' },
    { productId: 1, daysAgo: 6, qty: 5, status: 'completed' },
    { productId: 2, daysAgo: 12, qty: 4, status: 'completed' },
    { productId: 4, daysAgo: 20, qty: 2, status: 'paid' },
    { productId: 3, daysAgo: 35, qty: 2, status: 'completed' },
    { productId: 1, daysAgo: 55, qty: 6, status: 'paid' },
    { productId: 2, daysAgo: 90, qty: 5, status: 'completed' },
    { productId: 4, daysAgo: 130, qty: 3, status: 'completed' },
    { productId: 3, daysAgo: 160, qty: 1, status: 'paid' },
    { productId: 1, daysAgo: 0, qty: 1, status: 'pending' }
  ];
  seedOrders.forEach((o) => {
    const prod = products.find((x) => x.id === o.productId);
    orders.push({
      id: nextOrderId++,
      order_no: `DEMO${String(nextOrderId).padStart(8, '0')}`,
      product_id: o.productId,
      user_id: 2,
      merchant_id: 1,
      quantity: o.qty,
      total_price: Number((prod.price * o.qty).toFixed(2)),
      contact_name: '李四买家',
      contact_phone: '13900000002',
      address: '浙江省杭州市西湖区XX路1号',
      status: o.status,
      created_at: at(o.daysAgo),
      paid_at: o.status === 'pending' ? null : at(o.daysAgo)
    });
  });
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

// ---------- 数据统计 ----------
const SOLD_STATUS = ['paid', 'completed'];

function sumOrders(list) {
  return {
    amount: list.reduce((s, o) => s + Number(o.total_price), 0),
    quantity: list.reduce((s, o) => s + Number(o.quantity), 0),
    orders: list.length
  };
}

async function statsOverview(merchantId, { date, month, year } = {}) {
  const sold = orders.filter((o) => o.merchant_id === merchantId && SOLD_STATUS.includes(o.status));
  const todayStr = date || now().slice(0, 10);
  const monthStr = month || todayStr.slice(0, 7);
  const yearStr = year || todayStr.slice(0, 4);
  return {
    today: sumOrders(sold.filter((o) => o.created_at.slice(0, 10) === todayStr)),
    month: sumOrders(sold.filter((o) => o.created_at.slice(0, 7) === monthStr)),
    year: sumOrders(sold.filter((o) => o.created_at.slice(0, 4) === yearStr))
  };
}

async function statsDaily(merchantId, month) {
  const sold = orders.filter(
    (o) => o.merchant_id === merchantId && SOLD_STATUS.includes(o.status) && o.created_at.slice(0, 7) === month
  );
  const map = {};
  sold.forEach((o) => {
    const date = o.created_at.slice(0, 10);
    map[date] = map[date] || { quantity: 0, amount: 0, orders: 0 };
    map[date].quantity += Number(o.quantity);
    map[date].amount += Number(o.total_price);
    map[date].orders += 1;
  });
  return Object.keys(map).sort().map((date) => ({ date, ...map[date] }));
}

async function statsMonthly(merchantId, months) {
  const d = new Date();
  const start = new Date(d.getFullYear(), d.getMonth() - (months - 1), 1);
  const p = (n) => String(n).padStart(2, '0');
  const startLabel = `${start.getFullYear()}-${p(start.getMonth() + 1)}-01`;
  const sold = orders.filter(
    (o) => o.merchant_id === merchantId && SOLD_STATUS.includes(o.status) && o.created_at >= startLabel
  );
  const map = {};
  sold.forEach((o) => {
    const m = o.created_at.slice(0, 7);
    map[m] = map[m] || { quantity: 0, amount: 0, orders: 0 };
    map[m].quantity += Number(o.quantity);
    map[m].amount += Number(o.total_price);
    map[m].orders += 1;
  });
  return Object.keys(map).sort().map((month) => ({ month, ...map[month] }));
}

async function statsCategory(merchantId, { month, date, year }) {
  const sold = orders.filter((o) => o.merchant_id === merchantId && SOLD_STATUS.includes(o.status));
  const filtered = date
    ? sold.filter((o) => o.created_at.slice(0, 10) === date)
    : year
      ? sold.filter((o) => o.created_at.slice(0, 4) === year)
      : month
        ? sold.filter((o) => o.created_at.slice(0, 7) === month)
        : sold;
  const map = {};
  filtered.forEach((o) => {
    const p = products.find((x) => x.id === o.product_id);
    const cat = p ? p.category : '其他';
    map[cat] = map[cat] || { quantity: 0, amount: 0, orders: 0 };
    map[cat].quantity += Number(o.quantity);
    map[cat].amount += Number(o.total_price);
    map[cat].orders += 1;
  });
  return Object.keys(map)
    .map((category) => ({ category, ...map[category] }))
    .sort((a, b) => b.amount - a.amount);
}

async function statsYearDetail(merchantId, year) {
  const sold = orders.filter(
    (o) => o.merchant_id === merchantId && SOLD_STATUS.includes(o.status) && o.created_at.slice(0, 4) === year
  );
  const map = {};
  sold.forEach((o) => {
    const m = o.created_at.slice(0, 7);
    map[m] = map[m] || { quantity: 0, amount: 0, orders: 0 };
    map[m].quantity += Number(o.quantity);
    map[m].amount += Number(o.total_price);
    map[m].orders += 1;
  });
  return Object.keys(map).sort().map((month) => ({ month, ...map[month] }));
}

async function statsYearly(merchantId, years) {
  const y = new Date().getFullYear();
  const startLabel = `${y - (years - 1)}-01-01`;
  const sold = orders.filter(
    (o) => o.merchant_id === merchantId && SOLD_STATUS.includes(o.status) && o.created_at >= startLabel
  );
  const map = {};
  sold.forEach((o) => {
    const yr = o.created_at.slice(0, 4);
    map[yr] = map[yr] || { quantity: 0, amount: 0, orders: 0 };
    map[yr].quantity += Number(o.quantity);
    map[yr].amount += Number(o.total_price);
    map[yr].orders += 1;
  });
  return Object.keys(map).sort().map((year) => ({ year, ...map[year] }));
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
