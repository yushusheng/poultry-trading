/**
 * 后端接口基础地址
 * - 微信开发者工具（模拟器）：127.0.0.1 即可
 * - 真机调试/真机预览：必须改为「电脑的局域网 IP」，手机与电脑需在同一 Wi-Fi
 *   · 查看电脑局域网 IP：macOS 终端执行 `ipconfig getifaddr en0`
 *   · 若换网络导致 IP 变化，需同步修改这里并重新构建
 */
export const BASE_URL = 'http://192.168.1.10:3000/api'

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
