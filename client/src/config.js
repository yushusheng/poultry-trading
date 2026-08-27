/**
 * 后端接口基础地址
 * - 微信开发者工具中调试：请开启「详情 -> 本地设置 -> 不校验合法域名...」，即可访问 http://127.0.0.1:3000
 * - 真机预览：请改为电脑的局域网 IP，例如 http://192.168.1.100:3000/api
 */
export const BASE_URL = 'http://127.0.0.1:3000/api'

export const CATEGORIES = [
  { label: '全部', value: '' },
  { label: '鸡', value: '鸡' },
  { label: '鸭', value: '鸭' },
  { label: '鹅', value: '鹅' },
  { label: '其他', value: '其他' }
]

export const ORDER_STATUS = {
  pending: '待支付',
  paid: '已支付',
  completed: '已完成',
  cancelled: '已取消'
}

// 无图片时的分类占位表情
export function categoryEmoji(category) {
  const map = { 鸡: '🐔', 鸭: '🦆', 鹅: '🪿', 其他: '🥚' }
  return map[category] || '🐔'
}
