<template>
  <view class="page">
    <view class="product-bar" @click="goProduct">
      <text class="emoji">💬</text>
      <text class="name ellipsis">{{ item.product_title || '咨询详情' }}</text>
      <text class="status" :class="item.status === 'open' ? 'open' : 'closed'">
        {{ item.status === 'open' ? '进行中' : '已结束' }}
      </text>
    </view>
    <view class="chat-wrap">
      <ConsultChat v-if="id" :id="id" />
    </view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import ConsultChat from '@/components/ConsultChat.vue'

const id = ref(null)
const item = ref({})

function goProduct() {
  if (item.value.product_id) {
    uni.navigateTo({ url: '/pages/products/detail?id=' + item.value.product_id })
  }
}

onLoad(async (options) => {
  id.value = options.id
  const data = await get('/consultations/' + options.id)
  item.value = data || {}
})
</script>

<style lang="scss" scoped>
.page {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f6f6f6;
}

.product-bar {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 20rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .emoji {
    font-size: 40rpx;
    margin-right: 16rpx;
  }

  .name {
    flex: 1;
    font-size: 28rpx;
    font-weight: 600;
  }

  .status {
    font-size: 22rpx;
    padding: 4rpx 16rpx;
    border-radius: 8rpx;

    &.open {
      color: #ff6b2c;
      background: #fff3ec;
    }

    &.closed {
      color: #999;
      background: #f5f5f5;
    }
  }
}

.chat-wrap {
  flex: 1;
  overflow: hidden;
}
</style>
