<template>
  <view class="page">
    <view class="hero">
      <swiper
        v-if="images.length"
        class="hero-swiper"
        indicator-dots
        indicator-color="rgba(255,255,255,0.5)"
        indicator-active-color="#ffffff"
        circular
        autoplay
      >
        <swiper-item v-for="(img, i) in images" :key="i">
          <image class="hero-img" :src="img" mode="aspectFill" @click="previewImage(i)" />
        </swiper-item>
      </swiper>
      <view v-else class="hero-placeholder">{{ emoji }}</view>
      <view class="hero-info">
        <view class="hero-title">{{ product.title }}</view>
        <view class="hero-price">
          <text class="price">¥{{ formatPrice(product.price) }}</text>
          <text class="unit">/{{ product.unit }}</text>
        </view>
        <view class="hero-meta">
          <text class="tag">{{ product.category }}</text>
          <text class="stock">库存 {{ product.stock }}</text>
          <text class="merchant">商家：{{ product.merchant_name }}</text>
        </view>
      </view>
    </view>

    <view class="card">
      <view class="block-title">商品详情</view>
      <text class="desc">{{ product.description || '暂无描述' }}</text>
    </view>

    <view class="card merchant-card" @click="callMerchant">
      <view>
        <view class="block-title">商家信息</view>
        <text class="merchant-name">{{ product.merchant_name }}</text>
      </view>
      <text v-if="!isMerchant" class="call-btn">📞 联系商家</text>
    </view>

    <!-- 商户端登录时不展示咨询/购买操作 -->
    <view v-if="!isMerchant" class="footer">
      <view class="footer-btn consult" @click="goConsult">💬 在线咨询</view>
      <view class="footer-btn buy" @click="goBuy">立即购买</view>
    </view>
    <view v-else class="merchant-tip">商户端登录，仅供查看商品信息</view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get } from '@/utils/request'
import { categoryEmoji } from '@/config'
import { isLoggedIn, getUser } from '@/utils/auth'

const isMerchant = computed(() => {
  const u = getUser()
  return !!(u && u.role === 'merchant')
})

const product = ref({})
const id = ref(null)
const emoji = computed(() => categoryEmoji(product.value.category))
const images = computed(() => {
  const imgs = product.value.images || []
  if (imgs.length) return imgs
  return product.value.image_url ? [product.value.image_url] : []
})

function previewImage(current) {
  if (!images.value.length) return
  uni.previewImage({ urls: images.value, current: images.value[current] })
}

function formatPrice(v) {
  return Number(v || 0).toFixed(2)
}

function requireLogin(cb) {
  if (!isLoggedIn()) {
    uni.showToast({ title: '请先登录', icon: 'none' })
    setTimeout(() => uni.navigateTo({ url: '/pages/login/index' }), 600)
    return
  }
  cb()
}

function goConsult() {
  requireLogin(() => uni.navigateTo({ url: '/pages/consult/create?productId=' + id.value }))
}

function goBuy() {
  requireLogin(() => uni.navigateTo({ url: '/pages/order/create?productId=' + id.value }))
}

function callMerchant() {
  if (product.value.merchant_phone) {
    uni.makePhoneCall({ phoneNumber: product.value.merchant_phone })
  }
}

onLoad(async (options) => {
  id.value = options.id
  const data = await get('/products/' + options.id)
  product.value = data || {}
})
</script>

<style lang="scss" scoped>
.page {
  padding-bottom: 140rpx;
}

.hero {
  background: #fff;
  padding-bottom: 24rpx;

  .hero-swiper {
    width: 100%;
    height: 420rpx;
  }

  .hero-img {
    width: 100%;
    height: 420rpx;
  }

  .hero-placeholder {
    width: 100%;
    height: 420rpx;
    background: #fde8d9;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 160rpx;
  }

  .hero-info {
    padding: 24rpx;

    .hero-title {
      font-size: 34rpx;
      font-weight: 700;
    }

    .hero-price {
      margin-top: 16rpx;

      .price {
        font-size: 44rpx;
      }

      .unit {
        font-size: 24rpx;
        color: #999;
        margin-left: 6rpx;
      }
    }

    .hero-meta {
      display: flex;
      align-items: center;
      margin-top: 16rpx;
      font-size: 24rpx;
      color: #999;

      .tag {
        background: #fff3ec;
        color: #ff6b2c;
        border-radius: 8rpx;
        padding: 4rpx 14rpx;
        margin-right: 16rpx;
      }

      .merchant {
        margin-left: 16rpx;
      }
    }
  }
}

.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.desc {
  font-size: 26rpx;
  color: #666;
  line-height: 1.7;
}

.merchant-card {
  display: flex;
  justify-content: space-between;
  align-items: center;

  .merchant-name {
    color: #666;
  }

  .call-btn {
    color: #ff6b2c;
    font-size: 26rpx;
  }
}

.merchant-tip {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  text-align: center;
  background: #fff;
  color: #999;
  font-size: 24rpx;
  padding: 28rpx 0;
  padding-bottom: calc(28rpx + env(safe-area-inset-bottom));
  border-top: 1rpx solid #f5f5f5;
}

.footer {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  background: #fff;
  padding: 16rpx 24rpx;
  padding-bottom: calc(16rpx + env(safe-area-inset-bottom));

  .footer-btn {
    flex: 1;
    text-align: center;
    font-size: 30rpx;
    padding: 22rpx 0;
    border-radius: 44rpx;

    &.consult {
      background: #fff3ec;
      color: #ff6b2c;
      margin-right: 20rpx;
    }

    &.buy {
      background: #ff6b2c;
      color: #fff;
    }
  }
}
</style>
