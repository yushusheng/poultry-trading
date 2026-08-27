<template>
  <view class="chat">
    <scroll-view
      scroll-y
      class="msg-list"
      :scroll-into-view="scrollIntoView"
      :scroll-with-animation="true"
    >
      <view v-if="messages.length">
        <view
          v-for="m in messages"
          :key="m.id"
          :id="'msg-' + m.id"
          class="msg-row"
          :class="m.sender_role === myRole ? 'mine' : 'other'"
        >
          <view class="bubble">
            <view class="who">{{ senderName(m) }}</view>
            <image
              v-if="m.type === 'image' && m.image_url"
              class="msg-img"
              :src="m.image_url"
              mode="widthFix"
              @click="previewImage(m.image_url)"
            />
            <view
              v-if="m.type === 'image' ? (m.content && m.content !== '[图片]') : true"
              class="text"
            >{{ m.content }}</view>
            <view class="time">{{ m.created_at }}</view>
          </view>
        </view>
      </view>
      <view v-else class="empty">暂无消息</view>
      <view v-if="consultation.status === 'closed'" class="closed-tip">—— 咨询已结束 ——</view>
    </scroll-view>

    <!-- 富文本输入区 -->
    <view v-if="consultation.status === 'open'" class="input-bar">
      <editor
        id="consultEditor"
        class="editor"
        placeholder="输入消息…"
        @ready="onEditorReady"
      />
      <view class="toolbar">
        <view class="toolbar-left">
          <view class="img-btn" @click="insertImage">📷 图片</view>
        </view>
        <view class="toolbar-right">
          <view class="close-btn" @click="close">结束咨询</view>
          <view class="send-btn" :class="{ disabled: sending || uploading }" @click="send">发送</view>
        </view>
      </view>
    </view>
    <view v-else class="closed-bar">咨询已结束，可继续查看记录</view>
  </view>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { get, post } from '@/utils/request'
import { getUser } from '@/utils/auth'
import { uploadImages } from '@/utils/upload'

const props = defineProps({
  id: { type: [Number, String], required: true }
})

// 组件作用域：选择器查询必须限定到组件内才能找到 <editor>
// 兼容 uni-app Vue3 对 .in() 的不同取法，收集多个候选作用域
const instance = getCurrentInstance()
const scopes = []
if (instance) {
  if (instance.proxy) scopes.push(instance.proxy)
  scopes.push(instance)
  if (instance.proxy && instance.proxy.$scope) scopes.push(instance.proxy.$scope)
}

const consultation = ref({})
const messages = ref([])
const sending = ref(false)
const uploading = ref(false)
const scrollIntoView = ref('')

// 本地临时路径 -> 服务器 URL 映射（上传完成后记录）
const localToServer = {}
const localPaths = []

const myRole = computed(() => {
  const u = getUser()
  return u ? u.role : 'user'
})

function senderName(m) {
  if (m.sender_role === 'merchant') return consultation.value.merchant_name || '商家'
  return consultation.value.user_name || '用户'
}

async function load() {
  const d = await get('/consultations/' + props.id)
  consultation.value = d || {}
  messages.value = (d && d.messages) || []
  scrollBottom()
}

function scrollBottom() {
  const last = messages.value[messages.value.length - 1]
  if (last) {
    setTimeout(() => {
      scrollIntoView.value = 'msg-' + last.id
    }, 150)
  }
}

// ---------- 富文本编辑器 ----------
// 通过 selectorQuery 获取真正的 EditorContext（uni-app 官方方式）
// 注意：组件内查询必须 .in(作用域)，否则查不到组件内部的 editor
function queryEditorCtx(retries = 3) {
  return new Promise((resolve) => {
    const tryScope = (index) => {
      if (index >= scopes.length) {
        if (retries <= 0) return resolve(null)
        return setTimeout(() => queryEditorCtx(retries - 1).then(resolve), 100)
      }
      let query = uni.createSelectorQuery()
      if (scopes[index]) query = query.in(scopes[index])
      query
        .select('#consultEditor')
        .context((res) => {
          const ctx = (res && res.context) || null
          if (ctx) resolve(ctx)
          else tryScope(index + 1)
        })
        .exec()
    }
    tryScope(0)
  })
}

// 编辑器就绪（记录用；实际使用每次动态查询，避免上下文丢失）
function onEditorReady() {
  // noop：统一走 queryEditorCtx
}

// 插入图片到编辑区（可多张，内联展示）
// 先用本地临时路径插入（真机立即可见，不依赖网络加载），后台再上传并记录映射
function insertImage() {
  if (uploading.value || sending.value) return
  uni.chooseImage({
    count: 9,
    sizeType: ['compressed'],
    success: async (res) => {
      const paths = res.tempFilePaths || []
      if (!paths.length) return
      const ctx = await queryEditorCtx()
      if (!ctx) {
        uni.showToast({ title: '编辑器尚未就绪，请稍后重试', icon: 'none' })
        return
      }
      paths.forEach((p) => ctx.insertImage({ src: p, width: '80%' }))
      paths.forEach((p) => localPaths.push(p))

      uploading.value = true
      uni.showLoading({ title: '上传中...' })
      try {
        const urls = await uploadImages(paths)
        paths.forEach((p, i) => { localToServer[p] = urls[i] })
      } catch (e) {
        // 已提示（图片保留本地显示，发送时会提示重新上传）
      } finally {
        uploading.value = false
        uni.hideLoading()
      }
    }
  })
}

function getEditorHtml() {
  return new Promise(async (resolve) => {
    const ctx = await queryEditorCtx()
    if (!ctx) return resolve('')
    ctx.getContents({
      success: (res) => resolve((res && res.html) || ''),
      fail: () => resolve('')
    })
  })
}

// 解析编辑器 HTML 为有序片段：文字 / 图片
function parseEditorHtml(html) {
  const parts = []
  const imgRe = /<img[^>]*src=["']([^"']+)["'][^>]*>/gi
  const pushText = (t) => {
    const clean = t
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#39;/g, "'")
      .replace(/&quot;/g, '"')
      .replace(/\n{3,}/g, '\n\n')
      .trim()
    if (clean) parts.push({ type: 'text', content: clean })
  }
  let lastIndex = 0
  let m
  while ((m = imgRe.exec(html))) {
    pushText(html.slice(lastIndex, m.index))
    parts.push({ type: 'image', url: m[1] })
    lastIndex = imgRe.lastIndex
  }
  pushText(html.slice(lastIndex))
  return parts
}

async function send() {
  if (sending.value || uploading.value) return
  const html = await getEditorHtml()
  const parts = parseEditorHtml(html)
  // 把本地临时路径替换为服务器 URL；上传未完成/失败则提示重试
  for (const part of parts) {
    if (part.type === 'image') {
      if (localToServer[part.url]) {
        part.url = localToServer[part.url]
      } else if (localPaths.indexOf(part.url) > -1) {
        uni.showToast({ title: '图片上传中或失败，请稍后重试', icon: 'none' })
        return
      }
    }
  }
  const hasContent = parts.some((p) => p.type === 'text' || p.type === 'image')
  if (!hasContent) {
    uni.showToast({ title: '请输入消息或选择图片', icon: 'none' })
    return
  }
  sending.value = true
  try {
    // 按编辑顺序发送：图片消息 + 文字消息
    for (const part of parts) {
      if (part.type === 'image') {
        await post('/consultations/' + props.id + '/messages', { type: 'image', imageUrl: part.url })
      } else {
        await post('/consultations/' + props.id + '/messages', { content: part.content })
      }
    }
    const ctx = await queryEditorCtx()
    if (ctx) ctx.clear()
    // 清空本地路径映射
    localPaths.length = 0
    Object.keys(localToServer).forEach((k) => delete localToServer[k])
    await load()
  } catch (e) {
    // 已提示
  } finally {
    sending.value = false
  }
}

// ---------- 结束咨询 ----------
function close() {
  uni.showModal({
    title: '提示',
    content: '确定结束该咨询吗？结束后双方将无法继续发送消息。',
    success: async (res) => {
      if (res.confirm) {
        try {
          const d = await post('/consultations/' + props.id + '/close')
          consultation.value = d || {}
        } catch (e) {
          // 已提示
        }
      }
    }
  })
}

function previewImage(url) {
  uni.previewImage({ urls: [url] })
}

onMounted(load)
</script>

<style lang="scss" scoped>
.chat {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.msg-list {
  flex: 1;
  overflow: hidden;
  padding: 20rpx 24rpx;
  box-sizing: border-box;
  height: 0;
}

.msg-row {
  display: flex;
  margin-bottom: 24rpx;

  &.mine {
    justify-content: flex-end;
  }

  .bubble {
    max-width: 80%;
    padding: 20rpx;
    border-radius: 16rpx;
    background: #fff;

    .who {
      font-size: 22rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .text {
      font-size: 28rpx;
      line-height: 1.6;
      word-break: break-all;
    }

    .msg-img {
      display: block;
      max-width: 320rpx;
      border-radius: 10rpx;
      background: #f0f0f0;
    }

    .time {
      margin-top: 10rpx;
      font-size: 20rpx;
      color: #ccc;
    }
  }

  &.mine .bubble {
    background: #fff3ec;
  }

  &.other .bubble {
    background: #fff;
  }
}

.empty {
  text-align: center;
  color: #bbb;
  font-size: 26rpx;
  padding: 60rpx 0;
}

.closed-tip {
  text-align: center;
  color: #bbb;
  font-size: 24rpx;
  padding: 20rpx 0 40rpx;
}

/* 富文本输入区 */
.input-bar {
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;

  .editor {
    width: 100%;
    min-height: 96rpx;
    max-height: 320rpx;
    background: #f5f5f5;
    border-radius: 12rpx;
    padding: 16rpx 20rpx;
    font-size: 28rpx;
    line-height: 1.6;
    box-sizing: border-box;
  }

  .toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;

    .toolbar-left {
      .img-btn {
        display: flex;
        align-items: center;
        color: #666;
        font-size: 24rpx;
        background: #f5f5f5;
        padding: 10rpx 22rpx;
        border-radius: 28rpx;
      }
    }

    .toolbar-right {
      display: flex;
      align-items: center;

      .close-btn {
        color: #999;
        font-size: 24rpx;
        padding: 12rpx 24rpx;
        border: 1rpx solid #ddd;
        border-radius: 32rpx;
        margin-right: 20rpx;
      }

      .send-btn {
        background: #ff6b2c;
        color: #fff;
        font-size: 26rpx;
        padding: 12rpx 44rpx;
        border-radius: 32rpx;

        &.disabled {
          opacity: 0.6;
        }
      }
    }
  }
}

.closed-bar {
  background: #fff;
  text-align: center;
  color: #999;
  font-size: 24rpx;
  padding: 24rpx 0;
  padding-bottom: calc(24rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f0f0f0;
}
</style>
