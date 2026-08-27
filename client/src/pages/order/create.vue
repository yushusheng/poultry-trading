<template>
  <view class="container" v-if="product.id">
    <view class="card product-row">
      <view class="emoji">{{ emoji }}</view>
      <view class="info">
        <view class="title">{{ product.title }}</view>
        <view class="price">¥{{ formatPrice(product.price) }}/{{ product.unit }}</view>
        <view class="stock">库存 {{ product.stock }}</view>
      </view>
      <view class="stepper">
        <view class="step-btn" @click="changeQty(-1)">-</view>
        <view class="qty">{{ quantity }}</view>
        <view class="step-btn" @click="changeQty(1)">+</view>
      </view>
    </view>

    <view class="card">
      <view class="block-title">收货信息</view>
      <view class="field">
        <text class="label">收货人</text>
        <input class="input" v-model="form.contactName" placeholder="请输入姓名" />
      </view>
      <view class="field">
        <text class="label">联系电话</text>
        <input class="input" v-model="form.contactPhone" type="number" placeholder="请输入手机号" />
      </view>
      <view class="field">
        <text class="label">收货地址</text>
        <input class="input" v-model="form.address" placeholder="请输入详细地址" />
      </view>
    </view>

    <view class="card total-row">
      <text>共 {{ quantity }} 件</text>
      <view>
        <text>合计：</text>
        <text class="price">¥{{ totalPrice }}</text>
      </view>
    </view>

    <button class="primary-btn submit" :loading="loading" @click="submit">提交订单</button>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get, post } from '@/utils/request'
import { categoryEmoji } from '@/config'

const productId = ref(null)
const product = ref({})
const quantity = ref(1)
const loading = ref(false)
const form = reactive({ contactName: '', contactPhone: '', address: '' })

const emoji = computed(() => categoryEmoji(product.value.category))
const totalPrice = computed(() => (Number(product.value.price || 0) * quantity.value).toFixed(2))

function formatPrice(v) {
  return Number(v || 0).toFixed(2)
}

function changeQty(delta) {
  const next = quantity.value + delta
  if (next < 1) return
  if (next > Number(product.value.stock)) {
    uni.showToast({ title: '超出库存', icon: 'none' })
    return
  }
  quantity.value = next
}

async function submit() {
  if (!form.contactName || !form.contactPhone || !form.address) {
    uni.showToast({ title: '请填写完整的收货信息', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const order = await post('/orders', {
      productId: Number(productId.value),
      quantity: quantity.value,
      ...form
    })
    uni.showToast({ title: '订单创建成功', icon: 'success' })
    setTimeout(() => uni.redirectTo({ url: '/pages/order/detail?id=' + order.id }), 800)
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
.product-row {
  display: flex;
  align-items: center;

  .emoji {
    font-size: 72rpx;
    margin-right: 20rpx;
  }

  .info {
    flex: 1;

    .title {
      font-size: 30rpx;
      font-weight: 600;
    }

    .price {
      margin-top: 8rpx;
      color: #ff3b30;
    }

    .stock {
      font-size: 22rpx;
      color: #999;
    }
  }

  .stepper {
    display: flex;
    align-items: center;

    .step-btn {
      width: 56rpx;
      height: 56rpx;
      line-height: 56rpx;
      text-align: center;
      background: #f5f5f5;
      border-radius: 8rpx;
      font-size: 32rpx;
    }

    .qty {
      min-width: 72rpx;
      text-align: center;
      font-size: 30rpx;
      font-weight: 600;
    }
  }
}

.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 12rpx;
}

.field {
  display: flex;
  align-items: center;
  padding: 22rpx 0;
  border-bottom: 1rpx solid #f5f5f5;

  .label {
    width: 150rpx;
    color: #666;
    font-size: 28rpx;
  }

  .input {
    flex: 1;
    font-size: 28rpx;
  }
}

.total-row {
  display: flex;
  justify-content: space-between;
  font-size: 28rpx;

  .price {
    font-size: 34rpx;
  }
}

.submit {
  margin-top: 32rpx;
}
</style>
