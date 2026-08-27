const express = require('express');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const CATEGORIES = ['鸡', '鸭', '鹅', '其他'];

// 商品列表（公开，可搜索/按分类筛选）
router.get('/', async (req, res, next) => {
  try {
    const { keyword = '', category = '' } = req.query || {};
    const list = await db.listProducts({ keyword, category });
    res.json({ code: 0, message: 'ok', data: list });
  } catch (e) {
    next(e);
  }
});

// 商品详情（公开）
router.get('/:id', async (req, res, next) => {
  try {
    const product = await db.getProduct(req.params.id);
    if (!product) return res.status(404).json({ code: 404, message: '商品不存在' });
    res.json({ code: 0, message: 'ok', data: product });
  } catch (e) {
    next(e);
  }
});

// 商户：我的商品列表
router.get('/merchant/mine', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const list = await db.listMerchantProducts(req.user.id);
    res.json({ code: 0, message: 'ok', data: list });
  } catch (e) {
    next(e);
  }
});

// 商户：发布商品
router.post('/', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const { title, category, description, price, unit, stock, imageUrl, status } = req.body || {};
    if (!title || !category || price === undefined) {
      return res.status(400).json({ code: 400, message: '标题、分类、价格为必填项' });
    }
    if (!CATEGORIES.includes(category)) {
      return res.status(400).json({ code: 400, message: '分类不合法' });
    }
    const product = await db.createProduct({
      merchantId: req.user.id,
      title,
      category,
      description: description || '',
      price,
      unit: unit || '只',
      stock: Number(stock || 0),
      imageUrl: imageUrl || '',
      status: status || 'on'
    });
    res.json({ code: 0, message: '发布成功', data: product });
  } catch (e) {
    next(e);
  }
});

// 商户：更新商品（仅本人）
router.put('/:id', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const product = await db.getProduct(req.params.id);
    if (!product) return res.status(404).json({ code: 404, message: '商品不存在' });
    if (product.merchant_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能操作自己的商品' });
    }
    const updated = await db.updateProduct(req.params.id, req.body || {});
    res.json({ code: 0, message: '保存成功', data: updated });
  } catch (e) {
    next(e);
  }
});

// 商户：删除商品（仅本人）
router.delete('/:id', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const product = await db.getProduct(req.params.id);
    if (!product) return res.status(404).json({ code: 404, message: '商品不存在' });
    if (product.merchant_id !== req.user.id) {
      return res.status(403).json({ code: 403, message: '只能操作自己的商品' });
    }
    await db.deleteProduct(req.params.id);
    res.json({ code: 0, message: '删除成功', data: null });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
