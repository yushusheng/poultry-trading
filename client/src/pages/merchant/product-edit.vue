<template>
  <view class="container">
    <view class="card">
      <view class="field">
        <text class="label">商品标题</text>
        <input class="input" v-model="form.title" placeholder="请输入商品名称" />
      </view>
      <view class="field">
        <text class="label">分类</text>
        <picker :range="categoryNames" @change="onCategoryChange">
          <view class="picker-value">{{ form.category }}</view>
        </picker>
      </view>
      <view class="field">
        <text class="label">单价</text>
        <input class="input" v-model="form.price" type="digit" placeholder="请输入单价" />
      </view>
      <view class="field">
        <text class="label">单位</text>
        <input class="input" v-model="form.unit" placeholder="如：只 / 斤 / 箱" />
      </view>
      <view class="field">
        <text class="label">库存</text>
        <input class="input" v-model="form.stock" type="number" placeholder="请输入库存数量" />
      </view>
    </view>

    <view class="card">
      <view class="block-title">商品描述</view>
      <textarea class="textarea" v-model="form.description" placeholder="介绍商品产地、重量、品质等信息" :maxlength="500" />
    </view>

    <button class="primary-btn submit" :loading="loading" @click="save">
      {{ isEdit ? '保存修改' : '发布商品' }}
    </button>
  </view>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { get, post, put } from '@/utils/request'

const categoryNames = ['鸡', '鸭', '鹅', '其他']
const id = ref(null)
const loading = ref(false)

const form = reactive({
  title: '',
  category: '鸡',
  price: '',
  unit: '只',
  stock: '',
  description: ''
})

const isEdit = computed(() => !!id.value)

function onCategoryChange(e) {
  form.category = categoryNames[Number(e.detail.value)]
}

async function loadProduct() {
  const data = await get('/products/' + id.value)
  if (data) {
    form.title = data.title
    form.category = data.category
    form.price = String(data.price)
    form.unit = data.unit
    form.stock = String(data.stock)
    form.description = data.description || ''
  }
}

async function save() {
  if (!form.title || form.price === '') {
    uni.showToast({ title: '请填写标题和单价', icon: 'none' })
    return
  }
  loading.value = true
  try {
    const payload = {
      title: form.title,
      category: form.category,
      price: Number(form.price),
      unit: form.unit || '只',
      stock: Number(form.stock || 0),
      description: form.description
    }
    if (isEdit.value) {
      await put('/products/' + id.value, payload)
    } else {
      await post('/products', payload)
    }
    uni.showToast({ title: '保存成功', icon: 'success' })
    setTimeout(() => uni.navigateBack(), 800)
  } catch (e) {
    // 已提示
  } finally {
    loading.value = false
  }
}

onLoad((options) => {
  if (options.id) {
    id.value = options.id
    uni.setNavigationBarTitle({ title: '编辑商品' })
    loadProduct()
  }
})
</script>

<style lang="scss" scoped>
.field {
  display: flex;
  align-items: center;
  padding: 24rpx 0;
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

  .picker-value {
    color: #333;
    font-size: 28rpx;
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

.submit {
  margin-top: 32rpx;
}
</style>
