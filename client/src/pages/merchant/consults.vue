<template>
  <view class="container">
    <view
      v-for="c in list"
      :key="c.id"
      class="card consult-item"
      @click="goDetail(c.id)"
    >
      <view class="head">
        <text class="user">{{ c.user_name }}</text>
        <text class="status" :class="c.reply ? 'replied' : ''">{{ c.reply ? '已回复' : '待回复' }}</text>
      </view>
      <view class="product">商品：{{ c.product_title }}</view>
      <view class="content">{{ c.content }}</view>
      <view class="time">{{ c.created_at }}</view>
    </view>

    <EmptyState v-if="!loading && list.length === 0" text="暂无用户咨询" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import EmptyState from '@/components/EmptyState.vue'

const list = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const data = await get('/consultations/merchant')
    list.value = data || []
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function goDetail(id) {
  uni.navigateTo({ url: '/pages/merchant/consult-detail?id=' + id })
}

onShow(load)
onPullDownRefresh(load)
</script>

<style lang="scss" scoped>
.consult-item {
  .head {
    display: flex;
    justify-content: space-between;
    align-items: center;

    .user {
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

  .product {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #999;
  }

  .content {
    margin-top: 8rpx;
    font-size: 26rpx;
    line-height: 1.6;
  }

  .time {
    margin-top: 12rpx;
    font-size: 22rpx;
    color: #bbb;
  }
}
</style>
