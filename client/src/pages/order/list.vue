<template>
  <view class="container">
    <view class="tabs">
      <view
        v-for="t in tabs"
        :key="t.value"
        class="tab"
        :class="{ active: currentTab === t.value }"
        @click="switchTab(t.value)"
      >
        {{ t.label }}
      </view>
    </view>

    <view v-for="o in orders" :key="o.id" class="card order-card" @click="goDetail(o.id)">
      <view class="head">
        <text class="product-title">{{ o.product_title }}</text>
        <text class="status" :class="'s-' + o.status">{{ statusText(o.status) }}</text>
      </view>
      <view class="info-row">
        <text>数量：{{ o.quantity }} 件</text>
        <text>订单号：{{ o.order_no }}</text>
      </view>
      <view class="info-row">
        <text>收货人：{{ o.contact_name }} {{ o.contact_phone }}</text>
      </view>
      <view class="foot">
        <text class="price">¥{{ Number(o.total_price).toFixed(2) }}</text>
        <view class="actions">
          <view v-if="o.status === 'pending'" class="act-btn ghost" @click.stop="cancel(o)">取消订单</view>
          <view v-if="o.status === 'pending'" class="act-btn solid" @click.stop="pay(o)">去支付</view>
        </view>
      </view>
    </view>

    <EmptyState v-if="!loading && orders.length === 0" text="暂无订单" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get, post, put } from '@/utils/request'
import { ORDER_STATUS } from '@/config'
import EmptyState from '@/components/EmptyState.vue'

const tabs = [
  { label: '全部', value: '' },
  { label: '待支付', value: 'pending' },
  { label: '已支付', value: 'paid' },
  { label: '已完成', value: 'completed' },
  { label: '已取消', value: 'cancelled' }
]

const currentTab = ref('')
const orders = ref([])
const loading = ref(true)

function statusText(s) {
  return ORDER_STATUS[s] || s
}

async function load() {
  loading.value = true
  try {
    const data = await get('/orders/mine')
    orders.value = (data || []).filter((o) => !currentTab.value || o.status === currentTab.value)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}

function switchTab(v) {
  currentTab.value = v
  load()
}

function goDetail(id) {
  uni.navigateTo({ url: '/pages/order/detail?id=' + id })
}

async function pay(o) {
  try {
    await post('/orders/' + o.id + '/pay')
    uni.showToast({ title: '支付成功', icon: 'success' })
    load()
  } catch (e) {
    // 已提示
  }
}

async function cancel(o) {
  try {
    await put('/orders/' + o.id + '/status', { status: 'cancelled' })
    uni.showToast({ title: '已取消', icon: 'none' })
    load()
  } catch (e) {
    // 已提示
  }
}

onShow(load)
</script>

<style lang="scss" scoped>
.tabs {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 12rpx;
  margin-bottom: 24rpx;

  .tab {
    flex: 1;
    text-align: center;
    font-size: 26rpx;
    padding: 12rpx 0;
    color: #666;

    &.active {
      background: #ff6b2c;
      color: #fff;
      border-radius: 12rpx;
    }
  }
}

.order-card {
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .product-title {
      font-size: 30rpx;
      font-weight: 600;
    }

    .status {
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 8rpx;

      &.s-pending {
        color: #ff6b2c;
        background: #fff3ec;
      }

      &.s-paid {
        color: #1677ff;
        background: #e8f1ff;
      }

      &.s-completed {
        color: #07c160;
        background: #e8f8ef;
      }

      &.s-cancelled {
        color: #999;
        background: #f5f5f5;
      }
    }
  }

  .info-row {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #999;
  }

  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20rpx;

    .actions {
      display: flex;

      .act-btn {
        font-size: 24rpx;
        padding: 8rpx 28rpx;
        border-radius: 32rpx;
        margin-left: 16rpx;

        &.ghost {
          color: #666;
          border: 1rpx solid #ddd;
        }

        &.solid {
          background: #ff6b2c;
          color: #fff;
        }
      }
    }
  }
}
</style>
