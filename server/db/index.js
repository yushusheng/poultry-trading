/**
 * 数据库适配层
 * 支持两种模式：
 *  - mysql （默认）：连接 MySQL，正式环境使用
 *  - memory：内置内存数据，免安装 MySQL 即可快速演示/开发
 * 启动时会自动测试 MySQL 连接，失败则回退到内存模式。
 */
const config = require('../config');

let impl = null;

async function init() {
  if (config.dbMode === 'memory') {
    impl = require('./memory');
    await impl.init();
    console.log('[db] 已启用内存模式（DB_MODE=memory），数据重启后丢失，仅用于演示');
    return;
  }
  try {
    impl = require('./mysql');
    await impl.init();
    console.log(`[db] MySQL 连接成功: ${config.db.host}:${config.db.port}/${config.db.database}`);
  } catch (e) {
    console.warn('[db] MySQL 连接失败，自动切换到内存模式（演示用）。原因: ' + e.message);
    console.warn('[db] 如需使用 MySQL，请先执行 sql/init.sql 初始化数据库，并检查 config.js 配置。');
    impl = require('./memory');
    await impl.init();
  }
}

function use() {
  if (!impl) throw new Error('数据库尚未初始化，请先调用 db.init()');
  return impl;
}

module.exports = {
  init,
  // 用户
  findUserByUsername: (...a) => use().findUserByUsername(...a),
  findUserById: (...a) => use().findUserById(...a),
  createUser: (...a) => use().createUser(...a),
  // 商品
  listProducts: (...a) => use().listProducts(...a),
  listMerchantProducts: (...a) => use().listMerchantProducts(...a),
  getProduct: (...a) => use().getProduct(...a),
  createProduct: (...a) => use().createProduct(...a),
  updateProduct: (...a) => use().updateProduct(...a),
  deleteProduct: (...a) => use().deleteProduct(...a),
  // 咨询
  createConsultation: (...a) => use().createConsultation(...a),
  listConsultationsByUser: (...a) => use().listConsultationsByUser(...a),
  listConsultationsByMerchant: (...a) => use().listConsultationsByMerchant(...a),
  getConsultation: (...a) => use().getConsultation(...a),
  replyConsultation: (...a) => use().replyConsultation(...a),
  // 订单
  createOrder: (...a) => use().createOrder(...a),
  listOrdersByUser: (...a) => use().listOrdersByUser(...a),
  listOrdersByMerchant: (...a) => use().listOrdersByMerchant(...a),
  getOrder: (...a) => use().getOrder(...a),
  updateOrderStatus: (...a) => use().updateOrderStatus(...a)
};
