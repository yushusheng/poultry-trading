<template>
  <view class="page">
    <view class="info-bar">
      <view class="row">
        <text class="label">咨询用户</text>
        <text>{{ item.user_name }}</text>
      </view>
      <view class="row" @click="goProduct">
        <text class="label">相关商品</text>
        <text class="product">{{ item.product_title }}</text>
      </view>
      <view class="row">
        <text class="label">状态</text>
        <text class="status" :class="item.status === 'open' ? 'open' : 'closed'">
          {{ item.status === 'open' ? '进行中' : '已结束' }}
        </text>
      </view>
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

.info-bar {
  background: #fff;
  padding: 16rpx 24rpx;
  border-bottom: 1rpx solid #f0f0f0;

  .row {
    display: flex;
    padding: 8rpx 0;
    font-size: 26rpx;

    .label {
      width: 150rpx;
      color: #999;
    }

    .product {
      color: #ff6b2c;
    }

    .status {
      font-size: 22rpx;
      padding: 2rpx 16rpx;
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
}

.chat-wrap {
  flex: 1;
  overflow: hidden;
}
</style>
