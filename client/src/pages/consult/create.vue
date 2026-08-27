<template>
  <view class="container">
    <view class="card product-info" v-if="product.id" @click="goDetail">
      <text class="emoji">{{ emoji }}</text>
      <view class="info">
        <view class="title">{{ product.title }}</view>
        <view class="price">¥{{ formatPrice(product.price) }}/{{ product.unit }}</view>
      </view>
    </view>

    <view class="card">
      <view class="block-title">咨询内容</view>
      <textarea
        class="textarea"
        v-model="content"
        placeholder="请输入想咨询的问题，例如：是否支持宰杀、配送范围、价格优惠等"
        :maxlength="500"
      />
      <view class="count">{{ content.length }}/500</view>
    </view>

    <button class="primary-btn submit" :loading="loading" @click="submit">提交咨询</button>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get, post } from '@/utils/request'
import { categoryEmoji } from '@/config'

const productId = ref(null)
const product = ref({})
const content = ref('')
const loading = ref(false)
const emoji = computed(() => categoryEmoji(product.value.category))

function formatPrice(v) {
  return Number(v || 0).toFixed(2)
}

function goDetail() {
  uni.navigateTo({ url: '/pages/products/detail?id=' + productId.value })
}

async function submit() {
  if (!content.value.trim()) {
    uni.showToast({ title: '请输入咨询内容', icon: 'none' })
    return
  }
  loading.value = true
  try {
    await post('/consultations', { productId: Number(productId.value), content: content.value })
    uni.showToast({ title: '咨询已提交', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/consult/list' }), 800)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}

onLoad(async (options) => {
  productId.value = options.productId
  const data = await get('/products/' + options.productId)
  product.value = data || {}
})
</script>

<style lang="scss" scoped>
.product-info {
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

    .price {
      margin-top: 8rpx;
      color: #ff3b30;
    }
  }
}

.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.textarea {
  width: 100%;
  height: 240rpx;
  background: #f7f7f7;
  border-radius: 12rpx;
  padding: 20rpx;
  font-size: 28rpx;
  box-sizing: border-box;
}

.count {
  text-align: right;
  font-size: 22rpx;
  color: #bbb;
  margin-top: 8rpx;
}

.submit {
  margin-top: 32rpx;
}
</style>
