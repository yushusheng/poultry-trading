<template>
  <view class="container">
    <view class="card header">
      <view class="avatar">{{ (user.nickname || user.username || '?').slice(0, 1) }}</view>
      <view class="info">
        <view class="name">{{ user.nickname || user.username }}</view>
        <view class="role">商户端</view>
      </view>
    </view>

    <view class="grid">
      <view class="grid-item card" @click="go('/pages/merchant/products')">
        <text class="icon">📦</text>
        <text>商品管理</text>
      </view>
      <view class="grid-item card" @click="go('/pages/merchant/product-edit')">
        <text class="icon">➕</text>
        <text>发布商品</text>
      </view>
      <view class="grid-item card" @click="go('/pages/merchant/consults')">
        <text class="icon">💬</text>
        <text>咨询管理</text>
      </view>
      <view class="grid-item card" @click="go('/pages/merchant/orders')">
        <text class="icon">🧾</text>
        <text>交易记录</text>
      </view>
      <view class="grid-item card" @click="go('/pages/merchant/stats')">
        <text class="icon">📈</text>
        <text>数据统计</text>
      </view>
    </view>

    <button class="ghost-btn switch" @click="switchToUser">切换用户端</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUser } from '@/utils/auth'

const user = ref({})

function go(url) {
  uni.navigateTo({ url })
}

function switchToUser() {
  uni.switchTab({ url: '/pages/index/index' })
}

onShow(() => {
  user.value = getUser() || {}
})
</script>

<style lang="scss" scoped>
.header {
  display: flex;
  align-items: center;

  .avatar {
    width: 108rpx;
    height: 108rpx;
    border-radius: 50%;
    background: #8b5cf6;
    color: #fff;
    font-size: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .info {
    margin-left: 24rpx;

    .name {
      font-size: 34rpx;
      font-weight: 600;
    }

    .role {
      margin-top: 8rpx;
      display: inline-block;
      font-size: 22rpx;
      color: #8b5cf6;
      background: #f3e8ff;
      border-radius: 8rpx;
      padding: 4rpx 14rpx;
    }
  }
}

.grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;

  .grid-item {
    width: 48%;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 44rpx 0;
    box-sizing: border-box;
    font-size: 28rpx;

    .icon {
      font-size: 64rpx;
      margin-bottom: 16rpx;
    }
  }
}

.switch {
  margin-top: 40rpx;
}
</style>
