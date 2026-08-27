<template>
  <view class="container">
    <view class="card">
      <view class="block-title">商品图片（可多张，第一张为封面）</view>
      <view class="img-grid">
        <view v-for="(img, i) in form.images" :key="i" class="img-item">
          <image class="img" :src="img" mode="aspectFill" @click="previewImage(i)" />
          <view class="img-del" @click="removeImage(i)">✕</view>
        </view>
        <view v-if="form.images.length < 9" class="img-add" @click="chooseImages">＋</view>
      </view>
      <view class="img-tip">最多 9 张，支持 jpg/png，单张不超过 5MB</view>
    </view>

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
import { uploadImages } from '@/utils/upload'

const categoryNames = ['鸡', '鸭', '鹅', '其他']
const id = ref(null)
const loading = ref(false)
const uploading = ref(false)

const form = reactive({
  title: '',
  category: '鸡',
  price: '',
  unit: '只',
  stock: '',
  description: '',
  images: []
})

const isEdit = computed(() => !!id.value)

function onCategoryChange(e) {
  form.category = categoryNames[Number(e.detail.value)]
}

async function chooseImages() {
  const remain = 9 - form.images.length
  if (remain <= 0) {
    uni.showToast({ title: '最多上传 9 张图片', icon: 'none' })
    return
  }
  uni.chooseImage({
    count: remain,
    sizeType: ['compressed'],
    success: async (res) => {
      uploading.value = true
      uni.showLoading({ title: '上传中...' })
      try {
        const urls = await uploadImages(res.tempFilePaths)
        form.images.push(...urls)
      } catch (e) {
        // 已提示
      } finally {
        uploading.value = false
        uni.hideLoading()
      }
    }
  })
}

function removeImage(i) {
  uni.showModal({
    title: '提示',
    content: '确定删除这张图片吗？',
    success: (res) => {
      if (res.confirm) form.images.splice(i, 1)
    }
  })
}

function previewImage(i) {
  uni.previewImage({ urls: form.images, current: form.images[i] })
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
    form.images = data.images && data.images.length ? data.images.slice() : data.image_url ? [data.image_url] : []
  }
}

async function save() {
  if (!form.title || form.price === '') {
    uni.showToast({ title: '请填写标题和单价', icon: 'none' })
    return
  }
  if (uploading.value) {
    uni.showToast({ title: '图片上传中，请稍候', icon: 'none' })
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
      description: form.description,
      images: form.images
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
.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

.img-grid {
  display: flex;
  flex-wrap: wrap;

  .img-item {
    position: relative;
    width: 180rpx;
    height: 180rpx;
    margin: 0 16rpx 16rpx 0;

    .img {
      width: 100%;
      height: 100%;
      border-radius: 12rpx;
      background: #f5f5f5;
    }

    .img-del {
      position: absolute;
      right: -12rpx;
      top: -12rpx;
      width: 40rpx;
      height: 40rpx;
      line-height: 40rpx;
      text-align: center;
      background: rgba(0, 0, 0, 0.6);
      color: #fff;
      border-radius: 50%;
      font-size: 22rpx;
    }
  }

  .img-add {
    width: 180rpx;
    height: 180rpx;
    border: 2rpx dashed #ddd;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 64rpx;
    color: #ccc;
    background: #fafafa;
  }
}

.img-tip {
  font-size: 22rpx;
  color: #bbb;
  margin-top: 4rpx;
}

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
