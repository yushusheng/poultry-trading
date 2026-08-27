<template>
  <view class="container">
    <!-- 用户信息 -->
    <view class="user-card card">
      <template v-if="user">
        <view class="avatar">{{ (user.nickname || user.username || '?').slice(0, 1) }}</view>
        <view class="user-info">
          <view class="name">{{ user.nickname || user.username }}</view>
          <view class="role-tag" :class="user.role === 'merchant' ? 'merchant' : ''">
            {{ user.role === 'merchant' ? '商户端' : '用户端' }}
          </view>
        </view>
      </template>
      <template v-else>
        <view class="avatar">?</view>
        <view class="user-info">
          <view class="name">未登录</view>
          <view class="role-tag">登录后享受完整功能</view>
        </view>
        <view class="login-btn" @click="goLogin">登录/注册</view>
      </template>
    </view>

    <!-- 用户端菜单 -->
    <view class="card menu" v-if="user && user.role === 'user'">
      <view class="menu-item" @click="go('/pages/order/list')">
        <text class="icon">🧾</text><text>我的订单</text><text class="arrow">></text>
      </view>
      <view class="menu-item" @click="go('/pages/consult/list')">
        <text class="icon">💬</text><text>我的咨询</text><text class="arrow">></text>
      </view>
    </view>

    <!-- 商户端菜单 -->
    <view class="card menu" v-if="user && user.role === 'merchant'">
      <view class="menu-item" @click="go('/pages/merchant/index')">
        <text class="icon">🏪</text><text>商户中心</text><text class="arrow">></text>
      </view>
    </view>

    <button v-if="user" class="ghost-btn logout" @click="logout">退出登录</button>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUser, clearAuth } from '@/utils/auth'

const user = ref(null)

function goLogin() {
  uni.navigateTo({ url: '/pages/login/index' })
}

function go(url) {
  uni.navigateTo({ url })
}

function logout() {
  clearAuth()
  user.value = null
  uni.showToast({ title: '已退出登录', icon: 'none' })
}

onShow(() => {
  user.value = getUser()
})
</script>

<style lang="scss" scoped>
.user-card {
  display: flex;
  align-items: center;

  .avatar {
    width: 108rpx;
    height: 108rpx;
    border-radius: 50%;
    background: #ff6b2c;
    color: #fff;
    font-size: 44rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .user-info {
    flex: 1;
    margin-left: 24rpx;

    .name {
      font-size: 34rpx;
      font-weight: 600;
    }

    .role-tag {
      display: inline-block;
      margin-top: 8rpx;
      font-size: 22rpx;
      color: #ff6b2c;
      background: #fff3ec;
      border-radius: 8rpx;
      padding: 4rpx 14rpx;

      &.merchant {
        color: #8b5cf6;
        background: #f3e8ff;
      }
    }
  }

  .login-btn {
    color: #ff6b2c;
    font-size: 28rpx;
    font-weight: 600;
  }
}

.menu {
  padding: 0 24rpx;

  .menu-item {
    display: flex;
    align-items: center;
    padding: 30rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    &:last-child {
      border-bottom: none;
    }

    .icon {
      font-size: 36rpx;
      margin-right: 20rpx;
    }

    .arrow {
      margin-left: auto;
      color: #ccc;
    }
  }
}

.logout {
  margin-top: 40rpx;
}
</style>
