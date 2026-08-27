<script>
export default {
  onLaunch() {
    console.log('禽类市场小程序启动')
  }
}
</script>

<style lang="scss">
/* 全局样式 */
page {
  background-color: #f6f6f6;
  color: #333;
  font-size: 28rpx;
}

.container {
  padding: 24rpx;
}

.card {
  background: #fff;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 24rpx;
}

.primary-btn {
  background: #ff6b2c;
  color: #fff;
  border-radius: 44rpx;
  font-size: 30rpx;
  line-height: 2.4;
  &::after {
    border: none;
  }
}

.ghost-btn {
  background: #fff;
  color: #ff6b2c;
  border: 1rpx solid #ff6b2c;
  border-radius: 44rpx;
  font-size: 28rpx;
  line-height: 2.3;
  &::after {
    border: none;
  }
}

.price {
  color: #ff3b30;
  font-weight: 600;
}

.ellipsis {
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
}
</style>
