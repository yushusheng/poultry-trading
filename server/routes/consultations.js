const express = require('express');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

function isParticipant(consultation, user) {
  return consultation.user_id === user.id || consultation.merchant_id === user.id;
}

// 用户：发起咨询（同时写入第一条消息）
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

// 咨询详情（参与双方可查看，含消息记录）
router.get('/:id', auth, async (req, res, next) => {
  try {
    const c = await db.getConsultation(req.params.id);
    if (!c) return res.status(404).json({ code: 404, message: '咨询不存在' });
    if (!isParticipant(c, req.user)) {
      return res.status(403).json({ code: 403, message: '无权限查看该咨询' });
    }
    res.json({ code: 0, message: 'ok', data: c });
  } catch (e) {
    next(e);
  }
});

// 双方：发送消息（咨询进行中才能发送）
router.post('/:id/messages', auth, async (req, res, next) => {
  try {
    const { content, type, imageUrl } = req.body || {};
    const msgType = type === 'image' ? 'image' : 'text';
    if (msgType === 'image') {
      if (!imageUrl) {
        return res.status(400).json({ code: 400, message: '请先上传图片' });
      }
    } else if (!content || !content.trim()) {
      return res.status(400).json({ code: 400, message: '消息内容不能为空' });
    }
    const c = await db.getConsultation(req.params.id);
    if (!c) return res.status(404).json({ code: 404, message: '咨询不存在' });
    if (!isParticipant(c, req.user)) {
      return res.status(403).json({ code: 403, message: '无权限在该咨询中发言' });
    }
    if (c.status !== 'open') {
      return res.status(400).json({ code: 400, message: '咨询已结束，无法继续发送消息' });
    }
    const senderRole = c.merchant_id === req.user.id ? 'merchant' : 'user';
    const updated = await db.sendMessage({
      consultationId: c.id,
      senderId: req.user.id,
      senderRole,
      content: msgType === 'image' ? (content ? content.trim() : '') : content.trim(),
      type: msgType,
      imageUrl: imageUrl || ''
    });
    res.json({ code: 0, message: '发送成功', data: updated });
  } catch (e) {
    next(e);
  }
});

// 双方：结束咨询
router.post('/:id/close', auth, async (req, res, next) => {
  try {
    const c = await db.getConsultation(req.params.id);
    if (!c) return res.status(404).json({ code: 404, message: '咨询不存在' });
    if (!isParticipant(c, req.user)) {
      return res.status(403).json({ code: 403, message: '无权限操作该咨询' });
    }
    if (c.status !== 'open') {
      return res.status(400).json({ code: 400, message: '咨询已结束' });
    }
    const updated = await db.closeConsultation(c.id);
    res.json({ code: 0, message: '咨询已结束', data: updated });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
