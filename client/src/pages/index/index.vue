<template>
  <view class="container">
    <!-- 顶部搜索 -->
    <view class="search-bar card">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索鸡、鸭、鹅、鸡蛋..."
        confirm-type="search"
        @confirm="goSearch"
      />
      <text class="search-btn" @click="goSearch">搜索</text>
    </view>

    <!-- 分类入口 -->
    <view class="card category-bar">
      <view
        v-for="(c, i) in categories"
        :key="i"
        class="category-item"
        @click="goCategory(c)"
      >
        <view class="category-icon">{{ c.icon }}</view>
        <text>{{ c.label }}</text>
      </view>
    </view>

    <!-- 热销商品 -->
    <view class="section-title">
      <text class="title">🔥 热门商品</text>
      <text class="more" @click="goAll">查看全部 ></text>
    </view>
    <ProductCard v-for="p in products" :key="p.id" :product="p" />
    <EmptyState v-if="!loading && products.length === 0" text="暂无商品" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const categories = [
  { label: '土鸡', value: '鸡', icon: '🐔' },
  { label: '麻鸭', value: '鸭', icon: '🦆' },
  { label: '大鹅', value: '鹅', icon: '🪿' },
  { label: '鸡蛋', value: '其他', icon: '🥚' }
]

const keyword = ref('')
const products = ref([])
const loading = ref(true)

async function loadProducts() {
  loading.value = true
  try {
    const data = await get('/products')
    products.value = (data || []).slice(0, 6)
  } catch (e) {
    // 已由 request 提示
  } finally {
    loading.value = false
  }
}

// 注意：pages/products/index 是 tabBar 页面，navigateTo 无法打开 tabBar 页面，
// 因此使用 reLaunch 携带查询参数跳转（switchTab 不能传参）
function goSearch() {
  uni.reLaunch({ url: '/pages/products/index?keyword=' + encodeURIComponent(keyword.value) })
}

function goCategory(c) {
  uni.reLaunch({ url: '/pages/products/index?category=' + encodeURIComponent(c.value) })
}

function goAll() {
  uni.switchTab({ url: '/pages/products/index' })
}

onShow(loadProducts)
</script>

<style lang="scss" scoped>
.search-bar {
  display: flex;
  align-items: center;

  .search-input {
    flex: 1;
    background: #f5f5f5;
    border-radius: 36rpx;
    padding: 16rpx 28rpx;
    font-size: 26rpx;
  }

  .search-btn {
    margin-left: 20rpx;
    color: #ff6b2c;
    font-size: 28rpx;
    font-weight: 600;
  }
}

.category-bar {
  display: flex;
  justify-content: space-around;

  .category-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    font-size: 24rpx;
    color: #666;

    .category-icon {
      width: 96rpx;
      height: 96rpx;
      border-radius: 50%;
      background: #fff3ec;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 48rpx;
      margin-bottom: 10rpx;
    }
  }
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 28rpx 4rpx 20rpx;

  .title {
    font-size: 32rpx;
    font-weight: 700;
  }

  .more {
    font-size: 24rpx;
    color: #999;
  }
}
</style>
