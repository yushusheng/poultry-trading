const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = (path.extname(file.originalname || '') || '.jpg').toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 9 },
  fileFilter: (req, file, cb) => {
    if (/^image\//.test(file.mimetype)) cb(null, true);
    else cb(new Error('只允许上传图片文件'));
  }
});

// 上传商品图片（商户），字段名 images，最多 9 张
router.post('/', auth, requireRole('merchant'), upload.array('images', 9), (req, res, next) => {
  try {
    const files = req.files || [];
    if (!files.length) return res.status(400).json({ code: 400, message: '请选择图片' });
    const protocol = req.protocol || 'http';
    const host = req.get('host') || '127.0.0.1:3000';
    const urls = files.map((f) => `${protocol}://${host}/uploads/${f.filename}`);
    res.json({ code: 0, message: '上传成功', data: { urls } });
  } catch (e) {
    next(e);
  }
});

// multer 错误（文件过大/类型不符/数量超限）统一返回 400
router.use((err, req, res, next) => {
  res.status(400).json({ code: 400, message: err.message || '图片上传失败' });
});

module.exports = router;
