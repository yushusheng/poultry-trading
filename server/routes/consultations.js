const express = require('express');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

// 用户：发起咨询
router.post('/', auth, requireRole('user'), async (req, res, next) => {
  try {
    const { productId, content } = req.body || {};
    if (!productId || !content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '商品和咨询内容不能为空' });
    }
    const product = await db.getProduct(productId);
    if (!product) return res.status(404).json({ code: 404, message: '商品不存在' });
    const consultation = await db.createConsultation({
      productId,
      userId: req.user.id,
      merchantId: product.merchant_id,
      content: content.trim()
    });
    res.json({ code: 0, message: '咨询已提交', data: consultation });
  } catch (e) {
    next(e);
  }
});

// 用户：我的咨询列表
router.get('/mine', auth, requireRole('user'), async (req, res, next) => {
  try {
    const list = await db.listConsultationsByUser(req.user.id);
    res.json({ code: 0, message: 'ok', data: list });
  } catch (e) {
    next(e);
  }
});

// 商户：收到的咨询列表
router.get('/merchant', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const list = await db.listConsultationsByMerchant(req.user.id);
    res.json({ code: 0, message: 'ok', data: list });
  } catch (e) {
    next(e);
  }
});

// 咨询详情（发起用户或对应商户可查看）
router.get('/:id', auth, async (req, res, next) => {
  try {
    const c = await db.getConsultation(req.params.id);
    if (!c) return res.status(404).json({ code: 404, message: '咨询不存在' });
    if (c.user_id !== req.user.id && c.merchant_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '无权限查看该咨询' });
    }
    res.json({ code: 0, message: 'ok', data: c });
  } catch (e) {
    next(e);
  }
});

// 商户：回复咨询
router.post('/:id/reply', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const { reply } = req.body || {};
    if (!reply || !reply.trim()) {
      return res.status(400).json({ code: 400, message: '回复内容不能为空' });
    }
    const c = await db.getConsultation(req.params.id);
    if (!c) return res.status(404).json({ code: 404, message: '咨询不存在' });
    if (c.merchant_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能回复发给自己的咨询' });
    }
    const updated = await db.replyConsultation(req.params.id, reply.trim());
    res.json({ code: 0, message: '回复成功', data: updated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
