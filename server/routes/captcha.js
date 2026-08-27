const express = require('express');
const svgCaptcha = require('svg-captcha');
const crypto = require('crypto');

const router = express.Router();

// 验证码存储（内存）：id -> { text, expires }
// 生产环境多实例部署时建议改为 Redis/共享存储
const store = new Map();
const TTL = 5 * 60 * 1000;

// 定期清理过期验证码（unref 避免仅引用模块时阻塞进程退出）
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of store) {
    if (v.expires < now) store.delete(k);
  }
}, 60 * 1000).unref();

// 生成图形验证码
router.get('/', (req, res) => {
  const captcha = svgCaptcha.create({
    size: 4,
    ignoreChars: '0o1ilI',
    noise: 3,
    color: true,
    background: '#f2f2f2',
    fontSize: 46,
    width: 130,
    height: 48
  });
  const id = crypto.randomBytes(16).toString('hex');
  store.set(id, { text: captcha.text.toLowerCase(), expires: Date.now() + TTL });
  const image = 'data:image/svg+xml;base64,' + Buffer.from(captcha.data).toString('base64');
  res.json({ code: 0, message: 'ok', data: { id, image } });
});

// 校验验证码（一次性使用，校验即销毁）
function verifyCaptcha(id, code) {
  if (!id || !code) return false;
  const item = store.get(id);
  if (!item) return false;
  store.delete(id);
  if (item.expires < Date.now()) return false;
  return item.text === String(code).trim().toLowerCase();
}

module.exports = { router, verifyCaptcha, store };
