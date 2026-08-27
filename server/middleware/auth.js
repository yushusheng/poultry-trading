const jwt = require('jsonwebtoken');
const config = require('../config');

// 校验登录态
function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  if (!token) return res.status(401).json({ code: 401, message: '请先登录' });
  try {
    req.user = jwt.verify(token, config.jwtSecret);
    next();
  } catch (e) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

// 校验角色
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ code: 401, message: '请先登录' });
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ code: 403, message: '无权限执行该操作' });
    }
    next();
  };
}

module.exports = { auth, requireRole };
