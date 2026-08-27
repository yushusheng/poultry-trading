const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('../config');
const db = require('../db');
const { auth } = require('../middleware/auth');
const { verifyCaptcha } = require('./captcha');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, username: user.username, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// 注册
router.post('/register', async (req, res, next) => {
  try {
    const { username, password, nickname, phone, role, captchaId, captchaCode } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    if (username.length < 3 || username.length > 20) {
      return res.status(400).json({ code: 400, message: '用户名长度需为 3-20 个字符' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, message: '密码长度不能少于 6 位' });
    }
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({ code: 400, message: '请输入正确的手机号' });
    }
    if (!verifyCaptcha(captchaId, captchaCode)) {
      return res.status(400).json({ code: 400, message: '图形验证码错误或已过期' });
    }
    const r = role === 'merchant' ? 'merchant' : 'user';
    const exists = await db.findUserByUsername(username);
    if (exists) {
      return res.status(400).json({ code: 400, message: '用户名已存在' });
    }
    const user = await db.createUser({
      username,
      password: bcrypt.hashSync(password, 10),
      nickname: nickname || username,
      phone: phone || '',
      role: r
    });
    res.json({ code: 0, message: '注册成功', data: { token: signToken(user), user } });
  } catch (e) {
    next(e);
  }
});

// 登录
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ code: 400, message: '用户名和密码不能为空' });
    }
    const user = await db.findUserByUsername(username);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(400).json({ code: 400, message: '用户名或密码错误' });
    }
    const { password: _p, ...safe } = user;
    res.json({ code: 0, message: '登录成功', data: { token: signToken(user), user: safe } });
  } catch (e) {
    next(e);
  }
});

// 当前登录用户信息
router.get('/me', auth, async (req, res, next) => {
  try {
    const user = await db.findUserById(req.user.id);
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });
    res.json({ code: 0, message: 'ok', data: user });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
