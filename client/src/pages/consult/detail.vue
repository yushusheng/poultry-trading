<template>
  <view class="container" v-if="item.id">
    <view class="card product-bar" @click="goProduct">
      <text class="emoji">{{ emoji }}</text>
      <text class="name">{{ item.product_title }}</text>
    </view>

    <view class="card chat">
      <view class="bubble mine">
        <view class="who">我（{{ item.user_name }}）</view>
        <view class="text">{{ item.content }}</view>
      </view>
      <view v-if="item.reply" class="bubble merchant">
        <view class="who">商家（{{ item.merchant_name }}）</view>
        <view class="text">{{ item.reply }}</view>
      </view>
      <view v-else class="waiting">等待商家回复中...</view>
    </view>

    <view class="time">{{ item.created_at }}</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import { categoryEmoji } from '@/config'

const item = ref({})
const emoji = computed(() => categoryEmoji(item.value.product_category))

function goProduct() {
  uni.navigateTo({ url: '/pages/products/detail?id=' + item.value.product_id })
}

onLoad(async (options) => {
  const data = await get('/consultations/' + options.id)
  item.value = data || {}
})
</script>

<style lang="scss" scoped>
.product-bar {
  display: flex;
  align-items: center;

  .emoji {
    font-size: 56rpx;
    margin-right: 16rpx;
  }

  .name {
    font-size: 28rpx;
    font-weight: 600;
  }
}

.chat {
  .bubble {
    padding: 20rpx;
    border-radius: 12rpx;
    margin-bottom: 20rpx;

    .who {
      font-size: 22rpx;
      color: #999;
      margin-bottom: 8rpx;
    }

    .text {
      font-size: 28rpx;
      line-height: 1.6;
    }

    &.mine {
      background: #fff3ec;
    }

    &.merchant {
      background: #e8f8ef;
    }
  }

  .waiting {
    text-align: center;
    color: #bbb;
    font-size: 26rpx;
    padding: 40rpx 0;
  }
}

.time {
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
}
</style>
