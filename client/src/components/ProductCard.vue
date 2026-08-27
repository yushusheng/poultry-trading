<template>
  <view class="product-card" @click="goDetail">
    <view class="thumb">
      <image v-if="product.image_url" class="thumb-img" :src="product.image_url" mode="aspectFill" />
      <view v-else class="thumb-placeholder">{{ categoryEmoji(product.category) }}</view>
      <text class="tag" v-if="product.category">{{ product.category }}</text>
    </view>
    <view class="info">
      <text class="title ellipsis">{{ product.title }}</text>
      <text class="desc ellipsis">{{ product.description || '暂无描述' }}</text>
      <view class="bottom">
        <view>
          <text class="price">¥{{ formatPrice(product.price) }}</text>
          <text class="unit">/{{ product.unit }}</text>
        </view>
        <text class="stock">库存 {{ product.stock }}</text>
      </view>
      <text class="merchant">商家：{{ product.merchant_name || '平台商户' }}</text>
    </view>
  </view>
</template>

<script setup>
import { categoryEmoji } from '@/config'

const props = defineProps({
  product: { type: Object, required: true }
})

function formatPrice(v) {
  return Number(v || 0).toFixed(2)
}

function goDetail() {
  uni.navigateTo({ url: '/pages/products/detail?id=' + props.product.id })
}
</script>

<style lang="scss" scoped>
.product-card {
  display: flex;
  background: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 20rpx;
  overflow: hidden;

  .thumb {
    position: relative;
    width: 180rpx;
    height: 180rpx;
    border-radius: 12rpx;
    overflow: hidden;
    flex-shrink: 0;

    .thumb-img {
      width: 100%;
      height: 100%;
    }

    .thumb-placeholder {
      width: 100%;
      height: 100%;
      background: #fde8d9;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 72rpx;
    }

    .tag {
      position: absolute;
      left: 0;
      top: 0;
      background: rgba(255, 107, 44, 0.9);
      color: #fff;
      font-size: 20rpx;
      padding: 4rpx 12rpx;
      border-bottom-right-radius: 12rpx;
    }
  }

  .info {
    flex: 1;
    margin-left: 20rpx;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    min-width: 0;

    .title {
      font-size: 30rpx;
      font-weight: 600;
    }

    .desc {
      font-size: 24rpx;
      color: #999;
      margin: 8rpx 0;
    }

    .bottom {
      display: flex;
      align-items: baseline;
      justify-content: space-between;

      .price {
        font-size: 34rpx;
      }

      .unit {
        font-size: 22rpx;
        color: #999;
        margin-left: 4rpx;
      }

      .stock {
        font-size: 22rpx;
        color: #999;
      }
    }

    .merchant {
      font-size: 22rpx;
      color: #999;
    }
  }
}
</style>
