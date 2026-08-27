import { BASE_URL } from '@/config'
import { getToken, clearAuth } from './auth'

function request({ url, method = 'GET', data = {}, showError = true }) {
  return new Promise((resolve, reject) => {
    const token = getToken()
    uni.request({
      url: BASE_URL + url,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {})
      },
      success: (res) => {
        const body = res.data || {}
        if (res.statusCode === 200 && body.code === 0) {
          resolve(body.data)
          return
        }
        if (res.statusCode === 401) {
          clearAuth()
          if (showError) uni.showToast({ title: '请先登录', icon: 'none' })
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/index' })
          }, 600)
          reject(body)
          return
        }
        if (showError) uni.showToast({ title: body.message || '请求失败', icon: 'none' })
        reject(body)
      },
      fail: (err) => {
        if (showError) {
          uni.showToast({ title: '网络异常，请确认后端服务已启动', icon: 'none' })
        }
        reject(err)
      }
    })
  })
}

export function get(url, data = {}, options = {}) {
  return request({ url, method: 'GET', data, ...options })
}

export function post(url, data = {}, options = {}) {
  return request({ url, method: 'POST', data, ...options })
}

export function put(url, data = {}, options = {}) {
  return request({ url, method: 'PUT', data, ...options })
}

export function del(url, data = {}, options = {}) {
  return request({ url, method: 'DELETE', data, ...options })
}
