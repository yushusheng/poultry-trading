import { BASE_URL } from '@/config'
import { getToken } from './auth'

// 上传单张图片，返回图片 URL
function uploadOne(filePath) {
  return new Promise((resolve, reject) => {
    uni.uploadFile({
      url: BASE_URL + '/upload',
      filePath,
      name: 'images',
      header: { Authorization: 'Bearer ' + getToken() },
      success: (res) => {
        try {
          const body = JSON.parse(res.data)
          if (body.code === 0 && body.data && body.data.urls && body.data.urls[0]) {
            resolve(body.data.urls[0])
          } else {
            uni.showToast({ title: body.message || '上传失败', icon: 'none' })
            reject(body)
          }
        } catch (e) {
          reject(e)
        }
      },
      fail: (err) => {
        uni.showToast({ title: '上传失败，请检查网络', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 依次上传多张图片，返回 URL 数组
export async function uploadImages(filePaths) {
  const urls = []
  for (const p of filePaths) {
    urls.push(await uploadOne(p))
  }
  return urls
}
