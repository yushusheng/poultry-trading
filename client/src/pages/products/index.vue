<template>
  <view class="container">
    <!-- 搜索与分类 -->
    <view class="filter-bar card">
      <input
        class="search-input"
        v-model="keyword"
        placeholder="搜索商品"
        confirm-type="search"
        @confirm="applyFilter"
      />
      <view class="chips">
        <view
          v-for="c in categoryOptions"
          :key="c.value"
          class="chip"
          :class="{ active: category === c.value }"
          @click="selectCategory(c)"
        >
          {{ c.label }}
        </view>
      </view>
    </view>

    <ProductCard v-for="p in products" :key="p.id" :product="p" />
    <EmptyState v-if="!loading && products.length === 0" text="没有找到相关商品" />
  </view>
</template>

<script setup>
import { ref } from 'vue'
import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import { CATEGORIES } from '@/config'
import ProductCard from '@/components/ProductCard.vue'
import EmptyState from '@/components/EmptyState.vue'

const categoryOptions = CATEGORIES
const keyword = ref('')
const category = ref('')
const products = ref([])
const loading = ref(true)

async function loadProducts() {
  loading.value = true
  try {
    const data = await get('/products', { keyword: keyword.value, category: category.value })
    products.value = data || []
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
    uni.stopPullDownRefresh()
  }
}

function applyFilter() {
  loadProducts()
}

function selectCategory(c) {
  category.value = c.value
  loadProducts()
}

onLoad((options) => {
  if (options.keyword) keyword.value = decodeURIComponent(options.keyword)
  if (options.category) category.value = decodeURIComponent(options.category)
})

onShow(loadProducts)
onPullDownRefresh(loadProducts)
</script>

<style lang="scss" scoped>
.filter-bar {
  .search-input {
    background: #f5f5f5;
    border-radius: 36rpx;
    padding: 16rpx 28rpx;
    font-size: 26rpx;
  }

  .chips {
    display: flex;
    margin-top: 20rpx;

    .chip {
      padding: 8rpx 28rpx;
      margin-right: 16rpx;
      border-radius: 32rpx;
      background: #f5f5f5;
      font-size: 24rpx;
      color: #666;

      &.active {
        background: #ff6b2c;
        color: #fff;
      }
    }
  }
}
</style>
