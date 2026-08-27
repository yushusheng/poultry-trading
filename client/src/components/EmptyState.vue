<template>
  <view class="empty">
    <text class="icon">🛒</text>
    <text class="text">{{ text }}</text>
    <button v-if="actionText" class="ghost-btn action" @click="$emit('action')">{{ actionText }}</button>
  </view>
</template>

<script setup>
defineProps({
  text: { type: String, default: '暂无数据' },
  actionText: { type: String, default: '' }
})
defineEmits(['action'])
</script>

<style lang="scss" scoped>
.empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 120rpx 0;

  .icon {
    font-size: 100rpx;
  }

  .text {
    margin-top: 24rpx;
    color: #999;
    font-size: 28rpx;
  }

  .action {
    margin-top: 32rpx;
    width: 240rpx;
  }
}
</style>
