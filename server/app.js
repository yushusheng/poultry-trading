const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('./config');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
  res.json({ code: 0, message: '鸡鸭禽买卖系统 API 运行中', data: { docs: '/api' } });
});

app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/consultations', require('./routes/consultations'));
app.use('/api/orders', require('./routes/orders'));

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 统一错误处理
app.use((err, req, res, next) => {
  console.error('[error]', err.message);
  res.status(500).json({ code: 500, message: '服务器内部错误：' + err.message });
});

(async () => {
  try {
    await db.init();
    app.listen(config.port, () => {
      console.log(`[server] 服务已启动: http://127.0.0.1:${config.port}`);
    });
  } catch (e) {
    console.error('[server] 启动失败:', e.message);
    process.exit(1);
  }
})();
