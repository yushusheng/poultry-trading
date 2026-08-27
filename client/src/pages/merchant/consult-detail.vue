<template>
  <view class="container" v-if="item.id">
    <view class="card">
      <view class="block-title">用户咨询</view>
      <view class="row"><text class="label">用户</text><text>{{ item.user_name }}</text></view>
      <view class="row"><text class="label">商品</text><text>{{ item.product_title }}</text></view>
      <view class="row"><text class="label">时间</text><text>{{ item.created_at }}</text></view>
      <view class="content-box">{{ item.content }}</view>
    </view>

    <view class="card" v-if="item.reply">
      <view class="block-title">我的回复</view>
      <view class="content-box replied">{{ item.reply }}</view>
      <view class="reply-time">{{ item.reply_at }}</view>
    </view>

    <view class="card" v-else>
      <view class="block-title">回复用户</view>
      <textarea class="textarea" v-model="reply" placeholder="请输入回复内容" :maxlength="500" />
      <button class="primary-btn reply-btn" :loading="loading" @click="submit">提交回复</button>
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get, post } from '@/utils/request'

const item = ref({})
const reply = ref('')
const loading = ref(false)

async function submit() {
  if (!reply.value.trim()) {
    uni.showToast({ title: '请输入回复内容', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await post('/consultations/' + item.value.id + '/reply', { reply: reply.value })
    uni.showToast({ title: '回复成功', icon: 'success' })
    item.value = await get('/consultations/' + item.value.id)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}

onLoad(async (options) => {
  const data = await get('/consultations/' + options.id)
  item.value = data || {}
})
</script>

<style lang="scss" scoped>
.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.row {
  display: flex;
  padding: 12rpx 0;
  font-size: 26rpx;

  .label {
    width: 120rpx;
    color: #999;
  }
}

.content-box {
  margin-top: 16rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  line-height: 1.6;

  &.replied {
    background: #e8f8ef;
    color: #07c160;
  }
}

.reply-time {
  margin-top: 12rpx;
  text-align: right;
  font-size: 22rpx;
  color: #bbb;
}

.textarea {
  width: 100%;
  height: 220rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.reply-btn {
  margin-top: 24rpx;
}
</style>
