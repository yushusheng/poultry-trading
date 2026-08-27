# 鸡鸭禽买卖系统小程序

基于 **Vue3 + uni-app**（前端）与 **Node.js + Express + MySQL**（后端）的鸡鸭禽在线交易微信小程序。
支持用户端与商户端双角色：商户发布商品、回复咨询、查看交易记录；用户浏览商品、在线咨询、下单支付。

## 功能模块

| 模块 | 说明 |
| --- | --- |
| 登录 / 注册 | 支持用户端与商户端两种角色 |
| 商品管理（商户） | 发布、编辑、上下架、删除商品 |
| 商品浏览（用户） | 首页、列表搜索、分类筛选、详情 |
| 在线咨询 | 用户发起咨询，商户回复 |
| 在线支付 | 用户下单并支付（当前为模拟支付，可接入微信支付） |
| 交易记录 | 商户查看订单，确认完成；用户查看/取消订单 |

## 项目结构

```
├── client/                // 前端代码（Vue3 + uni-app）
│   ├── src/
│   │   ├── pages/         // 页面（用户端 + 商户端）
│   │   ├── components/    // 公共组件
│   │   ├── utils/         // 请求封装、登录态
│   │   ├── config.js      // 后端接口地址
│   │   ├── pages.json     // 页面路由与 tabBar
│   │   └── manifest.json  // 小程序配置（AppID）
│   └── package.json
├── server/                // 后端代码（Express + MySQL）
│   ├── routes/            // 接口路由
│   ├── db/                // 数据库层（mysql / memory 两种模式）
│   ├── sql/init.sql       // 数据库初始化脚本
│   ├── config.js          // 服务配置
│   └── app.js             // 入口
└── README.md
```

## 技术栈

- 后端：Node.js + Express + MySQL（mysql2）
- 前端：Vue3 + uni-app（Vite 构建，输出微信小程序）

## 快速开始

### 1. 启动后端

```bash
cd server
npm install
npm start
```

- 默认端口 `3000`，接口地址 `http://127.0.0.1:3000/api`
- 默认使用 MySQL；如本机未安装 MySQL，服务会自动切换到**内存模式**（演示数据，重启后丢失）。
- 若使用 MySQL，请先初始化数据库：

```bash
mysql -u root -p < server/sql/init.sql
```

数据库连接信息在 `server/config.js` 中配置（也支持 `DB_HOST` / `DB_USER` / `DB_PASSWORD` / `DB_NAME` 环境变量）。
生产环境请通过环境变量设置 `JWT_SECRET`。

### 2. 启动前端

```bash
cd client
npm install
npm run build:mp-weixin   # 或 npm run dev:mp-weixin（监听模式）
```

构建产物直接输出在 `client/dist` 根目录（已通过 `UNI_OUTPUT_DIR=dist` 配置），
因此导入微信开发者工具时直接选择 `client/dist` 即可，`app.json` 位于项目根目录。

### 3. 导入微信开发者工具

1. 打开微信开发者工具，选择「导入项目」
2. 目录选择 `client/dist`（app.json 在根目录，直接导入即可）
3. AppID 已在 `client/src/manifest.json` 中配置；如需更换，改完后重新构建
4. 在「详情 → 本地设置」中勾选「不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书」，便于本地调试
5. 后端接口地址在 `client/src/config.js` 中配置；真机预览时改为电脑的局域网 IP，例如 `http://192.168.1.100:3000/api`

## 演示账号

| 账号 | 密码 | 角色 |
| --- | --- | --- |
| user | 123456 | 用户端 |
| merchant | 123456 | 商户端 |

## 主要接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| POST | /api/auth/register | 注册 |
| POST | /api/auth/login | 登录 |
| GET | /api/auth/me | 当前用户信息 |
| GET | /api/products | 商品列表（支持 keyword / category） |
| GET | /api/products/:id | 商品详情 |
| GET | /api/products/merchant/mine | 商户自己的商品 |
| POST | /api/products | 商户发布商品 |
| PUT / DELETE | /api/products/:id | 商户更新/删除商品 |
| POST | /api/consultations | 用户发起咨询 |
| GET | /api/consultations/mine | 我的咨询 |
| GET | /api/consultations/merchant | 商户收到的咨询 |
| POST | /api/consultations/:id/reply | 商户回复 |
| POST | /api/orders | 用户下单 |
| GET | /api/orders/mine | 我的订单 |
| GET | /api/orders/merchant | 商户交易记录 |
| POST | /api/orders/:id/pay | 模拟支付 |
| PUT | /api/orders/:id/status | 取消订单 / 确认完成 |

## UI 页面

- 用户端：首页、商品列表、商品详情、在线咨询、我的咨询、确认订单、我的订单、我的
- 商户端：商户中心、商品管理、发布/编辑商品、咨询管理、咨询详情、交易记录

## 注意事项

1. 运行前请确保已安装 Node.js（建议 18+）。
2. MySQL 模式需先执行 `server/sql/init.sql` 初始化，并检查 `server/config.js` 的数据库配置。
3. 微信开发者工具调试时需关闭「合法域名校验」；上线前请将后端部署到 HTTPS 域名并在小程序后台配置 request 合法域名。
4. 当前支付为模拟支付；正式上线请接入微信支付（`wx.requestPayment` + 服务端下单/回调）。
5. 商品图片目前使用分类占位符；如需图片上传可基于 `/uploads` 静态目录扩展。

## 版权

本项目代码遵循 MIT 许可证。
