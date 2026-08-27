<template>
  <view class="container">
    <view
      v-for="c in list"
      :key="c.id"
      class="card consult-item"
      @click="goDetail(c.id)"
    >
      <view class="head">
        <text class="product-title">{{ c.product_title }}</text>
        <text class="status" :class="c.reply ? 'replied' : ''">{{ c.reply ? '已回复' : '待回复' }}</text>
      </view>
      <view class="content">Q：{{ c.content }}</view>
      <view v-if="c.reply" class="reply">A：{{ c.reply }}</view>
      <view class="time">{{ c.created_at }}</view>
    </view>
    <EmptyState v-if="!loading && list.length === 0" text="暂无咨询记录" action-text="去逛逛" @action="goHome" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import EmptyState from '@/components/EmptyState.vue'

const list = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const data = await get('/consultations/mine')
    list.value = data || []
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}

function goDetail(id) {
  uni.navigateTo({ url: '/pages/consult/detail?id=' + id })
}

function goHome() {
  uni.switchTab({ url: '/pages/index/index' })
}

onShow(load)
</script>

<style lang="scss" scoped>
.consult-item {
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
      color: #ff6b2c;
      background: #fff3ec;
      padding: 4rpx 16rpx;
      border-radius: 8rpx;

      &.replied {
        color: #07c160;
        background: #e8f8ef;
      }
    }
  }

  .content {
    margin-top: 16rpx;
    font-size: 26rpx;
    color: #333;
    line-height: 1.6;
  }

  .reply {
    margin-top: 12rpx;
    font-size: 26rpx;
    color: #07c160;
    background: #f0faf4;
    border-radius: 10rpx;
    padding: 16rpx;
    line-height: 1.6;
  }

  .time {
    margin-top: 16rpx;
    font-size: 22rpx;
    color: #bbb;
  }
}
</style>
