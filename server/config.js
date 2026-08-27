/**
 * 服务配置
 * 数据库默认使用 MySQL；若 DB_MODE=memory，则使用内置内存数据（仅用于演示/开发，无需安装 MySQL）。
 */
module.exports = {
  port: process.env.PORT || 3000,
  // 生产环境请通过环境变量 JWT_SECRET 覆盖
  jwtSecret: process.env.JWT_SECRET || 'poultry-market-dev-secret-please-change',
  jwtExpiresIn: '7d',
  // DB_MODE: mysql | memory
  dbMode: process.env.DB_MODE || 'mysql',
  db: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'poultry_market'
  }
};
