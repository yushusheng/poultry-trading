<template>
  <view class="container">
    <view v-for="p in products" :key="p.id" class="card product-row">
      <view class="thumb">{{ categoryEmoji(p.category) }}</view>
      <view class="info" @click="goEdit(p.id)">
        <view class="title">{{ p.title }}</view>
        <view class="price">¥{{ Number(p.price).toFixed(2) }}/{{ p.unit }}</view>
        <view class="meta">库存 {{ p.stock }} · {{ p.category }}</view>
      </view>
      <view class="actions">
        <view class="status" :class="p.status === 'on' ? 'on' : 'off'" @click="toggleStatus(p)">
          {{ p.status === 'on' ? '已上架' : '已下架' }}
        </view>
        <view class="btn-row">
          <view class="mini-btn edit" @click="goEdit(p.id)">编辑</view>
          <view class="mini-btn del" @click="remove(p)">删除</view>
        </view>
      </view>
    </view>

    <EmptyState v-if="!loading && products.length === 0" text="还没有发布商品" action-text="去发布" @action="goCreate" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get, put, del } from '@/utils/request'
import { categoryEmoji } from '@/config'
import EmptyState from '@/components/EmptyState.vue'

const products = ref([])
const loading = ref(true)

async function load() {
  loading.value = true
  try {
    const data = await get('/products/merchant/mine')
    products.value = data || []
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function goEdit(id) {
  uni.navigateTo({ url: '/pages/merchant/product-edit?id=' + id })
}

function goCreate() {
  uni.navigateTo({ url: '/pages/merchant/product-edit' })
}

async function toggleStatus(p) {
  await put('/products/' + p.id, { status: p.status === 'on' ? 'off' : 'on' })
  uni.showToast({ title: '操作成功', icon: 'success' })
  load()
}

function remove(p) {
  uni.showModal({
    title: '提示',
    content: '确定删除商品「' + p.title + '」吗？',
    success: async (res) => {
      if (res.confirm) {
        await del('/products/' + p.id)
        uni.showToast({ title: '已删除', icon: 'none' })
        load()
      }
    }
  })
}

onShow(load)
onPullDownRefresh(load)
</script>

<style lang="scss" scoped>
.product-row {
  display: flex;
  align-items: center;

  .thumb {
    width: 120rpx;
    height: 120rpx;
    border-radius: 12rpx;
    background: #fde8d9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 60rpx;
    flex-shrink: 0;
  }

  .info {
    flex: 1;
    margin-left: 20rpx;
    min-width: 0;

    .title {
      font-size: 30rpx;
      font-weight: 600;
    }

    .price {
      margin-top: 8rpx;
      color: #ff3b30;
    }

    .meta {
      font-size: 22rpx;
      color: #999;
      margin-top: 6rpx;
    }
  }

  .actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;

    .status {
      font-size: 22rpx;
      padding: 4rpx 16rpx;
      border-radius: 8rpx;
      margin-bottom: 16rpx;

      &.on {
        color: #07c160;
        background: #e8f8ef;
      }

      &.off {
        color: #999;
        background: #f5f5f5;
      }
    }

    .btn-row {
      display: flex;

      .mini-btn {
        font-size: 22rpx;
        padding: 6rpx 20rpx;
        border-radius: 8rpx;
        margin-left: 12rpx;

        &.edit {
          color: #1677ff;
          background: #e8f1ff;
        }

        &.del {
          color: #ff3b30;
          background: #ffecec;
        }
      }
    }
  }
}
</style>
