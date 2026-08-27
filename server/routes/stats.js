const express = require('express');
const db = require('../db');
const { auth, requireRole } = require('../middleware/auth');

const router = express.Router();

const pad = (n) => String(n).padStart(2, '0');
const num = (v) => Number(v || 0);

function currentMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
}

function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

const isValidYear = (y) => /^\d{4}$/.test(y);
const isValidMonth = (m) => /^\d{4}-\d{2}$/.test(m) && Number(m.slice(5, 7)) >= 1 && Number(m.slice(5, 7)) <= 12;
const isValidDate = (d) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d)) return false;
  const [y, m, day] = d.split('-').map(Number);
  return m >= 1 && m <= 12 && day >= 1 && day <= daysInMonth(y, m);
};

// 工作台概览：今日 / 本月 / 累计
router.get('/overview', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const { date, month, year } = req.query;
    if (date && !isValidDate(date)) {
      return res.status(400).json({ code: 400, message: '日期格式不正确' });
    }
    if (month && !isValidMonth(month)) {
      return res.status(400).json({ code: 400, message: '月份格式不正确' });
    }
    if (year && !isValidYear(year)) {
      return res.status(400).json({ code: 400, message: '年份格式不正确' });
    }
    const data = await db.statsOverview(req.user.id, { date: date || '', month: month || '', year: year || '' });
    ['today', 'month', 'year'].forEach((k) => {
      data[k] = {
        amount: num(data[k].amount),
        quantity: num(data[k].quantity),
        orders: num(data[k].orders)
      };
    });
    res.json({ code: 0, message: 'ok', data });
  } catch (e) {
    next(e);
  }
});

// 某月每日售出（无销量日期补 0）
router.get('/daily', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const month = req.query.month || currentMonth();
    if (!isValidMonth(month)) {
      return res.status(400).json({ code: 400, message: '月份格式不正确' });
    }
    const [y, m] = month.split('-').map(Number);
    const rows = await db.statsDaily(req.user.id, month);
    const map = {};
    rows.forEach((r) => {
      map[r.date.slice(0, 10)] = { quantity: num(r.quantity), amount: num(r.amount), orders: num(r.orders) };
    });
    const days = [];
    const total = daysInMonth(y, m);
    for (let d = 1; d <= total; d++) {
      const date = `${month}-${pad(d)}`;
      const row = map[date] || { quantity: 0, amount: 0, orders: 0 };
      days.push({ date, day: d, ...row });
    }
    res.json({ code: 0, message: 'ok', data: { month, days } });
  } catch (e) {
    next(e);
  }
});

// 某年每月售出 或 近 N 个月每月售出
router.get('/monthly', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const { year, months } = req.query;
    if (year) {
      if (!isValidYear(year)) {
        return res.status(400).json({ code: 400, message: '年份格式不正确' });
      }
      const rows = await db.statsYearDetail(req.user.id, year);
      const map = {};
      rows.forEach((r) => {
        map[r.month] = { quantity: num(r.quantity), amount: num(r.amount), orders: num(r.orders) };
      });
      const list = [];
      for (let m = 1; m <= 12; m++) {
        const label = `${year}-${pad(m)}`;
        const row = map[label] || { quantity: 0, amount: 0, orders: 0 };
        list.push({ month: label, label: `${m}月`, ...row });
      }
      return res.json({ code: 0, message: 'ok', data: { year, months: list } });
    }
    const monthNum = Number(months || 6);
    if (!Number.isInteger(monthNum) || monthNum < 1 || monthNum > 12) {
      return res.status(400).json({ code: 400, message: 'months 参数不合法' });
    }
    const monthCount = monthNum;
    const rows = await db.statsMonthly(req.user.id, monthCount);
    const map = {};
    rows.forEach((r) => {
      map[r.month] = { quantity: num(r.quantity), amount: num(r.amount), orders: num(r.orders) };
    });
    const list = [];
    const d = new Date();
    for (let i = monthCount - 1; i >= 0; i--) {
      const t = new Date(d.getFullYear(), d.getMonth() - i, 1);
      const label = `${t.getFullYear()}-${pad(t.getMonth() + 1)}`;
      const row = map[label] || { quantity: 0, amount: 0, orders: 0 };
      list.push({ month: label, label: `${t.getMonth() + 1}月`, ...row });
    }
    res.json({ code: 0, message: 'ok', data: { months: list } });
  } catch (e) {
    next(e);
  }
});

// 近 N 年每年售出
router.get('/yearly', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const yearsNum = Number(req.query.years || 6);
    if (!Number.isInteger(yearsNum) || yearsNum < 1 || yearsNum > 10) {
      return res.status(400).json({ code: 400, message: 'years 参数不合法' });
    }
    const years = yearsNum;
    const rows = await db.statsYearly(req.user.id, years);
    const map = {};
    rows.forEach((r) => {
      map[String(r.year)] = { quantity: num(r.quantity), amount: num(r.amount), orders: num(r.orders) };
    });
    const cur = new Date().getFullYear();
    const list = [];
    for (let i = years - 1; i >= 0; i--) {
      const y = cur - i;
      const row = map[String(y)] || { quantity: 0, amount: 0, orders: 0 };
      list.push({ year: y, label: `${y}年`, ...row });
    }
    res.json({ code: 0, message: 'ok', data: { years: list } });
  } catch (e) {
    next(e);
  }
});

// 分类售出金额统计：date=某日 或 month=某月 或 year=某年
router.get('/category', auth, requireRole('merchant'), async (req, res, next) => {
  try {
    const { month, date, year } = req.query;
    const useMonth = month || (date || year ? '' : currentMonth());
    if (useMonth && !isValidMonth(useMonth)) {
      return res.status(400).json({ code: 400, message: '月份格式不正确' });
    }
    if (date && !isValidDate(date)) {
      return res.status(400).json({ code: 400, message: '日期格式不正确' });
    }
    if (year && !isValidYear(year)) {
      return res.status(400).json({ code: 400, message: '年份格式不正确' });
    }
    const rows = await db.statsCategory(req.user.id, { month: useMonth, date: date || '', year: year || '' });
    const categories = rows.map((r) => ({
      category: r.category,
      quantity: num(r.quantity),
      amount: num(r.amount),
      orders: num(r.orders)
    }));
    res.json({ code: 0, message: 'ok', data: { month: useMonth, date: date || '', year: year || '', categories } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
