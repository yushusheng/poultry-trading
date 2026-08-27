const express = require('express');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

function genOrderNo() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
  return `${ts}${String(Math.floor(Math.random() * 9000) + 1000)}`;
}

// 用户：创建订单
router.post('/', auth, requireRole('user'), async (req, res, next) => {
  try {
    const { productId, quantity, contactName, contactPhone, address } = req.body || {};
    if (!productId || !quantity || !contactName || !contactPhone || !address) {
      return res.status(400).json({ code: 400, message: '请填写完整的收货信息' });
    }
    const product = await db.getProduct(productId);
    if (!product) return res.status(404).json({ code: 404, message: '商品不存在' });
    const qty = Number(quantity);
    if (!Number.isInteger(qty) || qty < 1) {
      return res.status(400).json({ code: 400, message: '购买数量不合法' });
    }
    if (qty > Number(product.stock)) {
      return res.status(400).json({ code: 400, message: '库存不足' });
    }
    const order = await db.createOrder({
      orderNo: genOrderNo(),
      productId,
      userId: req.user.id,
      merchantId: product.merchant_id,
      quantity: qty,
      totalPrice: (Number(product.price) * qty).toFixed(2),
      contactName,
      contactPhone,
      address
    });
    res.json({ code: 0, message: '订单创建成功', data: order });
  } catch (e) {
    next(e);
  }
});

// 用户：我的订单
router.get('/mine', auth, requireRole('user'), async (req, res, next) => {
  try {
    const list = await db.listOrdersByUser(req.user.id);
    res.json({ code: 0, message: 'ok', data: list });
  } catch (e) {
    next(e);
  }
});

// 商户：交易记录
router.get('/merchant', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const list = await db.listOrdersByMerchant(req.user.id);
    res.json({ code: 0, message: 'ok', data: list });
  } catch (e) {
    next(e);
  }
});

// 订单详情（下单用户或对应商户可查看）
router.get('/:id', auth, async (req, res, next) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
    if (order.user_id !== req.user.id && order.merchant_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限查看该订单' });
    }
    res.json({ code: 0, message: 'ok', data: order });
  } catch (e) {
    next(e);
  }
});

// 用户：模拟支付（演示用）
// 正式环境应替换为微信支付 wx.requestPayment 下单/回调流程
router.post('/:id/pay', auth, requireRole('user'), async (req, res, next) => {
  try {
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
    if (order.user_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能支付自己的订单' });
    }
    if (order.status !== 'pending') {
      return res.status(400).json({ code: 400, message: '当前订单状态不可支付' });
    }
    const updated = await db.updateOrderStatus(order.id, 'paid');
    res.json({ code: 0, message: '支付成功', data: updated });
  } catch (e) {
    next(e);
  }
});

// 更新订单状态：商户确认完成 / 用户取消待支付订单
router.put('/:id/status', auth, async (req, res, next) => {
  try {
    const { status } = req.body || {};
    const order = await db.getOrder(req.params.id);
    if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });

    const isUser = order.user_id === req.user.id;
    const isMerchant = order.merchant_id === req.user.id;
    if (!isUser && !isMerchant) {
      return res.status(403).json({ code: 403, message: '无权限操作该订单' });
    }

    if (status === 'cancelled') {
      if (!isUser || order.status !== 'pending') {
        return res.status(400).json({ code: 400, message: '仅用户可取消待支付的订单' });
      }
    } else if (status === 'completed') {
      if (!isMerchant || order.status !== 'paid') {
        return res.status(400).json({ code: 400, message: '仅商户可确认已支付订单完成' });
      }
    } else {
      return res.status(400).json({ code: 400, message: '不支持的状态变更' });
    }

    const updated = await db.updateOrderStatus(order.id, status);
    res.json({ code: 0, message: '操作成功', data: updated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
