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

    <view v-for="o in orders" :key="o.id" class="card order-card">
      <view class="head">
        <text class="product-title">{{ o.product_title }}</text>
        <text class="status" :class="'s-' + o.status">{{ statusText(o.status) }}</text>
      </view>
      <view class="info-row"><text class="label">买家</text><text>{{ o.user_name }}</text></view>
      <view class="info-row"><text class="label">数量</text><text>{{ o.quantity }} 件</text></view>
      <view class="info-row"><text class="label">收货</text><text>{{ o.contact_name }} {{ o.contact_phone }} · {{ o.address }}</text></view>
      <view class="info-row"><text class="label">订单号</text><text>{{ o.order_no }}</text></view>
      <view class="info-row"><text class="label">下单时间</text><text>{{ o.created_at }}</text></view>
      <view class="foot">
        <text class="price">¥{{ Number(o.total_price).toFixed(2) }}</text>
        <view v-if="o.status === 'paid'" class="act-btn" @click="complete(o)">确认完成</view>
      </view>
    </view>

    <EmptyState v-if="!loading && orders.length === 0" text="暂无交易记录" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get, put } from '@/utils/request'
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
    const data = await get('/orders/merchant')
    orders.value = (data || []).filter((o) => !currentTab.value || o.status === currentTab.value)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function switchTab(v) {
  currentTab.value = v
  load()
}

async function complete(o) {
  try {
    await put('/orders/' + o.id + '/status', { status: 'completed' })
    uni.showToast({ title: '已确认完成', icon: 'success' })
    load()
  } catch (e) {
    // 已提示
  }
}

onShow(load)
onPullDownRefresh(load)
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
    margin-bottom: 12rpx;

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
    display: flex;
    padding: 8rpx 0;
    font-size: 24rpx;
    color: #333;

    .label {
      width: 130rpx;
      color: #999;
      flex-shrink: 0;
    }
  }

  .foot {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16rpx;

    .act-btn {
      background: #ff6b2c;
      color: #fff;
      font-size: 24rpx;
      padding: 8rpx 28rpx;
      border-radius: 32rpx;
    }
  }
}
</style>
