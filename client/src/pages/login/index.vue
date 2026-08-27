<template>
  <view class="container">
    <view class="logo">🐔🦆</view>
    <view class="app-name">禽类市场</view>
    <view class="app-desc">鸡鸭禽在线交易平台</view>

    <view class="card form-card">
      <view class="tabs">
        <view class="tab" :class="{ active: mode === 'login' }" @click="mode = 'login'">登录</view>
        <view class="tab" :class="{ active: mode === 'register' }" @click="mode = 'register'">注册</view>
      </view>

      <!-- 登录 -->
      <template v-if="mode === 'login'">
        <view class="field">
          <text class="label">用户名</text>
          <input class="input" v-model="form.username" placeholder="请输入用户名" />
        </view>
        <view class="field">
          <text class="label">密码</text>
          <input class="input" v-model="form.password" password placeholder="请输入密码" />
        </view>
        <button class="primary-btn submit" :loading="loading" @click="login">登 录</button>
        <view class="tip">演示账号：user / 123456（用户端）&nbsp;&nbsp; merchant / 123456（商户端）</view>
      </template>

      <!-- 注册 -->
      <template v-else>
        <view class="field">
          <text class="label">用户名</text>
          <input class="input" v-model="form.username" placeholder="3-20个字符" />
        </view>
        <view class="field">
          <text class="label">密码</text>
          <input class="input" v-model="form.password" password placeholder="不少于6位" />
        </view>
        <view class="field">
          <text class="label">确认密码</text>
          <input class="input" v-model="form.confirm" password placeholder="再次输入密码" />
        </view>
        <view class="field">
          <text class="label">昵称</text>
          <input class="input" v-model="form.nickname" placeholder="请输入昵称/商户名称" />
        </view>
        <view class="field">
          <text class="label">手机号</text>
          <input class="input" v-model="form.phone" type="number" placeholder="请输入手机号" />
        </view>
        <view class="field">
          <text class="label">角色</text>
          <picker :range="roleNames" @change="onRoleChange">
            <view class="picker-value">{{ roleNames[roleIndex] }}</view>
          </picker>
        </view>
        <button class="primary-btn submit" :loading="loading" @click="register">注 册</button>
      </template>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { post } from '@/utils/request'
import { setAuth } from '@/utils/auth'

const mode = ref('login')
const loading = ref(false)
const roleNames = ['用户端', '商户端']
const roleValues = ['user', 'merchant']
const roleIndex = ref(0)

const form = reactive({
  username: '',
  password: '',
  confirm: '',
  nickname: '',
  phone: ''
})

function onRoleChange(e) {
  roleIndex.value = Number(e.detail.value)
}

function afterLogin(token, user) {
  setAuth(token, user)
  uni.showToast({ title: '登录成功', icon: 'success' })
  if (user.role === 'merchant') {
    setTimeout(() => uni.redirectTo({ url: '/pages/merchant/index' }), 600)
  } else {
    setTimeout(() => uni.switchTab({ url: '/pages/index/index' }), 600)
  }
}

async function login() {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const data = await post('/auth/login', { username: form.username, password: form.password })
    afterLogin(data.token, data.user)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}

async function register() {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  if (form.password !== form.confirm) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const data = await post('/auth/register', {
      username: form.username,
      password: form.password,
      nickname: form.nickname,
      phone: form.phone,
      role: roleValues[roleIndex.value]
    })
    uni.showToast({ title: '注册成功', icon: 'success' })
    afterLogin(data.token, data.user)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.logo {
  text-align: center;
  font-size: 100rpx;
  margin-top: 80rpx;
}

.app-name {
  text-align: center;
  font-size: 40rpx;
  font-weight: 700;
  margin-top: 12rpx;
}

.app-desc {
  text-align: center;
  color: #999;
  font-size: 24rpx;
  margin: 10rpx 0 40rpx;
}

.form-card {
  .tabs {
    display: flex;
    margin-bottom: 32rpx;

    .tab {
      flex: 1;
      text-align: center;
      font-size: 32rpx;
      padding-bottom: 16rpx;
      color: #999;
      border-bottom: 4rpx solid transparent;

      &.active {
        color: #ff6b2c;
        font-weight: 600;
        border-bottom-color: #ff6b2c;
      }
    }
  }

  .field {
    display: flex;
    align-items: center;
    padding: 24rpx 0;
    border-bottom: 1rpx solid #f5f5f5;

    .label {
      width: 150rpx;
      color: #666;
      font-size: 28rpx;
    }

    .input {
      flex: 1;
      font-size: 28rpx;
    }

    .picker-value {
      color: #333;
      font-size: 28rpx;
    }
  }

  .submit {
    margin-top: 40rpx;
  }

  .tip {
    margin-top: 24rpx;
    font-size: 22rpx;
    color: #bbb;
    text-align: center;
    line-height: 1.6;
  }
}
</style>
