<template>
  <view class="container">
    <!-- 时间段筛选 -->
    <view class="tabs">
      <view
        v-for="r in ranges"
        :key="r.value"
        class="tab"
        :class="{ active: currentRange === r.value }"
        @click="currentRange = r.value"
      >
        {{ r.label }}
      </view>
    </view>

    <view
      v-for="c in filteredList"
      :key="c.id"
      class="card consult-item"
      @click="goDetail(c.id)"
    >
      <view class="head">
        <text class="user">{{ c.user_name }}</text>
        <text class="status" :class="c.status === 'open' ? 'open' : 'closed'">
          {{ c.status === 'open' ? '进行中' : '已结束' }}
        </text>
      </view>
      <view class="product">商品：{{ c.product_title }}</view>
      <view class="last-msg">
        <text class="last-label">最新消息：</text>
        <image
          v-if="c.last_message_type === 'image' && c.last_message_image"
          class="last-img"
          :src="c.last_message_image"
          mode="aspectFill"
          @click.stop="previewImage(c)"
        />
        <text v-else class="last-text ellipsis">{{ c.last_message || '暂无消息' }}</text>
      </view>
      <view class="meta">
        <text>{{ c.message_count || 0 }} 条消息</text>
        <text class="time">{{ c.created_at }}</text>
      </view>
    </view>

    <EmptyState v-if="!loading && filteredList.length === 0" text="暂无用户咨询" />
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import EmptyState from '@/components/EmptyState.vue'

const list = ref([])
const loading = ref(true)

const ranges = [
  { label: '全部', value: '' },
  { label: '近一周', value: 7 },
  { label: '近一个月', value: 30 },
  { label: '近半年', value: 180 }
]
const currentRange = ref('')

const filteredList = computed(() => {
  if (!currentRange.value) return list.value
  const cutoff = Date.now() - Number(currentRange.value) * 24 * 3600 * 1000
  return list.value.filter((c) => {
    const t = new Date((c.created_at || '').replace(' ', 'T')).getTime()
    return t >= cutoff
  })
})

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

function previewImage(c) {
  if (c.last_message_image) uni.previewImage({ urls: [c.last_message_image] })
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
      padding: 4rpx 16rpx;
      border-radius: 8rpx;

      &.open {
        color: #ff6b2c;
        background: #fff3ec;
      }

      &.closed {
        color: #999;
        background: #f5f5f5;
      }
    }
  }

  .product {
    margin-top: 12rpx;
    font-size: 24rpx;
    color: #999;
  }

  .last-msg {
    display: flex;
    align-items: center;
    margin-top: 10rpx;
    font-size: 26rpx;
    color: #666;

    .last-label {
      color: #999;
      flex-shrink: 0;
      margin-right: 8rpx;
    }

    .last-text {
      flex: 1;
      min-width: 0;
    }

    .last-img {
      width: 72rpx;
      height: 72rpx;
      border-radius: 10rpx;
      background: #f0f0f0;
      flex-shrink: 0;
    }
  }

  .meta {
    display: flex;
    justify-content: space-between;
    margin-top: 14rpx;
    font-size: 22rpx;
    color: #bbb;
  }
}
</style>
