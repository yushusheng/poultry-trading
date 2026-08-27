<template>
  <view class="container" v-if="order.id">
    <view class="card status-card">
      <view class="status-icon" :class="'s-' + order.status">{{ statusIcon(order.status) }}</view>
      <view class="status-text">{{ statusText(order.status) }}</view>
    </view>

    <view class="card">
      <view class="block-title">商品信息</view>
      <view class="product-row">
        <view class="emoji">{{ emoji }}</view>
        <view class="info">
          <view class="title">{{ order.product_title }}</view>
          <view class="sub">数量：{{ order.quantity }} 件</view>
          <view class="price">¥{{ Number(order.total_price).toFixed(2) }}</view>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="block-title">订单信息</view>
      <view class="info-row"><text class="label">订单号</text><text>{{ order.order_no }}</text></view>
      <view class="info-row"><text class="label">下单时间</text><text>{{ order.created_at }}</text></view>
      <view class="info-row" v-if="order.paid_at"><text class="label">支付时间</text><text>{{ order.paid_at }}</text></view>
      <view class="info-row"><text class="label">收货人</text><text>{{ order.contact_name }} {{ order.contact_phone }}</text></view>
      <view class="info-row"><text class="label">收货地址</text><text>{{ order.address }}</text></view>
    </view>

    <view class="actions" v-if="order.status === 'pending'">
      <button class="ghost-btn cancel-btn" @click="cancel">取消订单</button>
      <button class="primary-btn pay-btn" @click="pay">立即支付 ¥{{ Number(order.total_price).toFixed(2) }}</button>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get, post, put } from '@/utils/request'
import { ORDER_STATUS, categoryEmoji } from '@/config'

const order = ref({})
const emoji = computed(() => categoryEmoji(order.value.product_category))

function statusText(s) {
  return ORDER_STATUS[s] || s
}

function statusIcon(s) {
  const map = { pending: '⏳', paid: '✅', completed: '🎉', cancelled: '❌' }
  return map[s] || '📦'
}

async function pay() {
  try {
    await post('/orders/' + order.value.id + '/pay')
    uni.showToast({ title: '支付成功', icon: 'success' })
    order.value = await get('/orders/' + order.value.id)
  } catch (e) {
    // 已提示
  }
}

function cancel() {
  uni.showModal({
    title: '提示',
    content: '确定取消该订单吗？取消后订单将不可恢复。',
    confirmText: '确定取消',
    confirmColor: '#ff3b30',
    success: async (res) => {
      if (!res.confirm) return
      try {
        await put('/orders/' + order.value.id + '/status', { status: 'cancelled' })
        uni.showToast({ title: '已取消', icon: 'none' })
        order.value = await get('/orders/' + order.value.id)
      } catch (e) {
        // 已提示
      }
    }
  })
}

onLoad(async (options) => {
  const data = await get('/orders/' + options.id)
  order.value = data || {}
})
</script>

<style lang="scss" scoped>
.status-card {
  text-align: center;
  padding: 48rpx 0;

  .status-icon {
    font-size: 80rpx;
  }

  .status-text {
    margin-top: 12rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: #ff6b2c;

    &.s-completed {
      color: #07c160;
    }
  }
}

.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.product-row {
  display: flex;
  align-items: center;

  .emoji {
    font-size: 72rpx;
    margin-right: 20rpx;
  }

  .info {
    .title {
      font-size: 30rpx;
      font-weight: 600;
    }

    .sub {
      font-size: 24rpx;
      color: #999;
      margin-top: 8rpx;
    }

    .price {
      margin-top: 8rpx;
      color: #ff3b30;
      font-size: 32rpx;
    }
  }
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 16rpx 0;
  font-size: 26rpx;
  color: #333;

  .label {
    color: #999;
  }
}

.actions {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin-top: 40rpx;

  .cancel-btn,
  .pay-btn {
    height: 76rpx;
    line-height: 76rpx;
    padding: 0;
    margin: 0;
    box-sizing: border-box;
    font-size: 28rpx;
  }

  .cancel-btn {
    width: 200rpx;
    flex-shrink: 0;
  }

  .pay-btn {
    flex: 1;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
}
</style>
