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

    <!-- 图形验证码弹窗 -->
    <view v-if="showCaptcha" class="mask" @click="cancelCaptcha">
      <view class="captcha-modal" @click.stop>
        <view class="modal-title">图形验证</view>
        <view class="modal-sub">请输入图中字符完成注册</view>
        <view class="captcha-row">
          <image class="captcha-img" :src="captchaImage" mode="widthFix" @click="loadCaptcha" />
          <view class="refresh" @click="loadCaptcha">换一张</view>
        </view>
        <input
          class="captcha-input"
          v-model="captchaCode"
          placeholder="请输入验证码"
          :maxlength="4"
          confirm-type="done"
          @confirm="confirmCaptcha"
        />
        <view class="modal-actions">
          <view class="btn cancel" @click="cancelCaptcha">取消</view>
          <view class="btn ok" :class="{ disabled: captchaConfirming }" @click="confirmCaptcha">确认</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { get, post } from '@/utils/request'
import { setAuth } from '@/utils/auth'

const mode = ref('login')
const loading = ref(false)
const showCaptcha = ref(false)
const captchaId = ref('')
const captchaImage = ref('')
const captchaCode = ref('')
const captchaConfirming = ref(false)
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

// 注册：先完成表单校验，再弹出图形验证码
async function register() {
  if (!form.username || !form.password) {
    uni.showToast({ title: '请输入用户名和密码', icon: 'none' })
    return
  }
  if (form.password !== form.confirm) {
    uni.showToast({ title: '两次输入的密码不一致', icon: 'none' })
    return
  }
  if (!/^1[3-9]\d{9}$/.test(form.phone)) {
    uni.showToast({ title: '请输入正确的手机号', icon: 'none' })
    return
  }
  showCaptcha.value = true
  loadCaptcha()
}

async function loadCaptcha() {
  try {
    const d = await get('/captcha')
    captchaId.value = d.id
    captchaImage.value = d.image
    captchaCode.value = ''
  } catch (e) {
    // 已提示
  }
}

function cancelCaptcha() {
  showCaptcha.value = false
  captchaCode.value = ''
}

async function confirmCaptcha() {
  if (!captchaCode.value.trim()) {
    uni.showToast({ title: '请输入验证码', icon: 'none' })
    return
  }
  if (captchaConfirming.value) return
  captchaConfirming.value = true
  try {
    const data = await post('/auth/register', {
      username: form.username,
      password: form.password,
      nickname: form.nickname,
      phone: form.phone,
      role: roleValues[roleIndex.value],
      captchaId: captchaId.value,
      captchaCode: captchaCode.value
    })
    showCaptcha.value = false
    uni.showToast({ title: '注册成功', icon: 'success' })
    afterLogin(data.token, data.user)
  } catch (e) {
    // 验证码错误/过期则刷新验证码，其他错误提示后由用户取消修改
    if (e && e.message && e.message.indexOf('验证码') > -1) {
      loadCaptcha()
    }
  } finally {
    captchaConfirming.value = false
  }
}
</script>

<style lang="scss" scoped>
.mask {
  position: fixed;
  left: 0;
  top: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}

.captcha-modal {
  width: 560rpx;
  background: #fff;
  border-radius: 20rpx;
  padding: 36rpx;

  .modal-title {
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
  }

  .modal-sub {
    text-align: center;
    font-size: 22rpx;
    color: #999;
    margin: 10rpx 0 24rpx;
  }

  .captcha-row {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20rpx;

    .captcha-img {
      width: 260rpx;
      height: 96rpx;
      border-radius: 10rpx;
      background: #f2f2f2;
      border: 1rpx solid #eee;
    }

    .refresh {
      margin-left: 20rpx;
      color: #ff6b2c;
      font-size: 24rpx;
    }
  }

  .captcha-input {
    background: #f5f5f5;
    border-radius: 10rpx;
    padding: 18rpx 24rpx;
    font-size: 30rpx;
    text-align: center;
    letter-spacing: 8rpx;
  }

  .modal-actions {
    display: flex;
    margin-top: 28rpx;

    .btn {
      flex: 1;
      text-align: center;
      padding: 20rpx 0;
      border-radius: 40rpx;
      font-size: 28rpx;

      &.cancel {
        background: #f5f5f5;
        color: #666;
        margin-right: 20rpx;
      }

      &.ok {
        background: #ff6b2c;
        color: #fff;

        &.disabled {
          opacity: 0.6;
        }
      }
    }
  }
}

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
