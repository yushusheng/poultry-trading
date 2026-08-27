<template>
  <view class="container">
    <!-- 日历卡片 -->
    <view class="card">
      <view class="cal-head">
        <view class="nav" @click="changeCal(-1)">‹</view>
        <view class="cal-title">{{ calTitle }}</view>
        <view class="nav" @click="changeCal(1)">›</view>
      </view>
      <view class="cal-toolbar">
        <view class="seg cal-seg">
          <view class="seg-item" :class="{ active: calView === 'month' }" @click="switchCalView('month')">月</view>
          <view class="seg-item" :class="{ active: calView === 'year' }" @click="switchCalView('year')">年</view>
        </view>
        <view class="today-btn" @click="goToday">今日</view>
      </view>

      <!-- 月视图 -->
      <template v-if="calView === 'month'">
        <view class="week-row">
          <view v-for="w in weekNames" :key="w" class="week">{{ w }}</view>
        </view>
        <view class="days-grid">
          <view
            v-for="(cell, i) in calCells"
            :key="cell.empty ? 'e' + i : cell.date"
            class="day-cell"
            :class="{
              empty: cell.empty,
              today: cell.date === todayStr,
              selected: cell.date === selectedDate,
              hasSales: salesMap[cell.date] > 0
            }"
            @click="selectDay(cell)"
          >
            <text class="day-num">{{ cell.empty ? '' : cell.day }}</text>
            <view v-if="!cell.empty && salesMap[cell.date] > 0" class="dot"></view>
          </view>
        </view>
      </template>

      <!-- 年视图 -->
      <template v-else>
        <view class="year-grid">
          <view
            v-for="(mc, i) in yearCells"
            :key="i"
            class="year-cell"
            :class="{ current: mc.isCurrent }"
            @click="selectYearCell(mc.month)"
          >
            <text class="year-month">{{ mc.label }}</text>
            <text v-if="mc.amount > 0" class="year-amount">¥{{ fmtMoney(mc.amount) }}</text>
            <text v-else class="year-amount empty">-</text>
          </view>
        </view>
        <view class="chart-sub">点击月份查看该月每日数据</view>
      </template>
    </view>

    <!-- 经营工作台 -->
    <view class="card">
      <view class="block-title">📊 经营工作台</view>
      <view class="wb-grid">
        <view class="wb-item">
          <text class="wb-label">{{ dayLabel }}</text>
          <text class="wb-value price">¥{{ fmtMoney(overview.today.amount) }}</text>
        </view>
        <view class="wb-item">
          <text class="wb-label">{{ dayQtyLabel }}</text>
          <text class="wb-value">{{ overview.today.quantity }} 件</text>
        </view>
        <view class="wb-item">
          <text class="wb-label">{{ monthLabel }}</text>
          <text class="wb-value price">¥{{ fmtMoney(overview.month.amount) }}</text>
        </view>
        <view class="wb-item">
          <text class="wb-label">{{ monthQtyLabel }}</text>
          <text class="wb-value">{{ overview.month.quantity }} 件</text>
        </view>
        <view class="wb-item">
          <text class="wb-label">{{ yearLabel }}</text>
          <text class="wb-value price">¥{{ fmtMoney(overview.year.amount) }}</text>
        </view>
        <view class="wb-item">
          <text class="wb-label">{{ yearQtyLabel }}</text>
          <text class="wb-value">{{ overview.year.quantity }} 件</text>
        </view>
      </view>
    </view>

    <!-- 售出货物统计（按月/按日/按年） -->
    <view class="card">
      <view class="block-title">📈 售出货物统计</view>
      <view class="seg">
        <view class="seg-item" :class="{ active: saleMode === 'month' }" @click="switchSaleMode('month')">按月</view>
        <view class="seg-item" :class="{ active: saleMode === 'day' }" @click="switchSaleMode('day')">按日</view>
        <view class="seg-item" :class="{ active: saleMode === 'year' }" @click="switchSaleMode('year')">按年</view>
      </view>
      <view class="chart-tip">{{ saleTip }}</view>
      <canvas type="2d" id="barChart" class="chart-canvas" style="width:100%;height:260px;"></canvas>
      <view v-if="saleMode === 'day'" class="chart-sub">
        {{ selectedDate ? '当前选中：' + selectedDate : '点击日历选择日期' }}
      </view>
      <view v-else-if="saleMode === 'month'" class="chart-sub">
        {{ viewYear }}年{{ viewMonth }}月 每日数据见「按日」
      </view>
      <view v-else class="chart-sub">
        日历切到「年」视图可查看各月销售额
      </view>
    </view>

    <!-- 分类售出金额统计（按月/按日/按年） -->
    <view class="card">
      <view class="block-title">💰 分类售出金额统计</view>
      <view class="seg">
        <view class="seg-item" :class="{ active: catMode === 'month' }" @click="switchCatMode('month')">按月</view>
        <view class="seg-item" :class="{ active: catMode === 'day' }" @click="switchCatMode('day')">按日</view>
        <view class="seg-item" :class="{ active: catMode === 'year' }" @click="switchCatMode('year')">按年</view>
      </view>
      <view class="chart-tip">{{ catTip }}</view>
      <canvas type="2d" id="pieChart" class="chart-canvas" style="width:100%;height:220px;"></canvas>
      <view class="legend">
        <view v-for="(c, i) in currentCats" :key="c.category" class="legend-item">
          <view class="legend-color" :style="{ background: colors[i % colors.length] }"></view>
          <text class="legend-name">{{ c.category }}</text>
          <text class="legend-qty">{{ c.quantity }} 件</text>
          <text class="legend-amount price">¥{{ fmtMoney(c.amount) }}</text>
          <text class="legend-pct">{{ pct(c) }}%</text>
        </view>
        <view v-if="currentCats.length === 0" class="legend-empty">暂无数据</view>
      </view>
    </view>
  </view>
</template>

<script setup>
import { ref, computed } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { get } from '@/utils/request'

const weekNames = ['日', '一', '二', '三', '四', '五', '六']
const colors = ['#ff6b2c', '#ffb35c', '#07c160', '#1677ff', '#8b5cf6', '#f759ab']

const pad = (n) => String(n).padStart(2, '0')
const today = new Date()
const todayStr = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`

const viewYear = ref(today.getFullYear())
const viewMonth = ref(today.getMonth() + 1)
const selectedDate = ref(todayStr)
const calView = ref('month') // month | year

const saleMode = ref('day') // day | month | year
const catMode = ref('day') // day | month | year

const emptyStat = () => ({ amount: 0, quantity: 0, orders: 0 })
const overview = ref({ today: emptyStat(), month: emptyStat(), year: emptyStat() })
const dailyData = ref([]) // [{date, day, quantity, amount, orders}]
const monthlyData = ref([]) // [{month, label, quantity, amount, orders}]
const yearlyData = ref([]) // [{year, label, quantity, amount, orders}]
const yearMonths = ref([]) // 选中年份 12 个月 [{month, label, quantity, amount, orders}]
const catMonth = ref([])
const catDay = ref([])
const catYear = ref([])

// ---------- 日历 ----------
const calTitle = computed(() =>
  calView.value === 'year' ? `${viewYear.value}年` : `${viewYear.value}年${viewMonth.value}月`
)

const calCells = computed(() => {
  const cells = []
  const first = new Date(viewYear.value, viewMonth.value - 1, 1)
  const offset = first.getDay()
  const total = new Date(viewYear.value, viewMonth.value, 0).getDate()
  for (let i = 0; i < offset; i++) cells.push({ empty: true, key: 'e' + i })
  for (let d = 1; d <= total; d++) {
    cells.push({ empty: false, day: d, date: `${viewYear.value}-${pad(viewMonth.value)}-${pad(d)}` })
  }
  while (cells.length % 7 !== 0) cells.push({ empty: true, key: 't' + cells.length })
  return cells
})

const yearCells = computed(() => {
  const cells = []
  for (let m = 1; m <= 12; m++) {
    const label = `${viewYear.value}-${pad(m)}`
    const data = yearMonths.value.find((x) => x.month === label)
    cells.push({
      month: m,
      label: `${m}月`,
      amount: data ? Number(data.amount) : 0,
      isCurrent: viewYear.value === today.getFullYear() && m === today.getMonth() + 1
    })
  }
  return cells
})

const salesMap = computed(() => {
  const map = {}
  dailyData.value.forEach((d) => { if (d.quantity > 0) map[d.date] = d.quantity })
  return map
})

const currentCats = computed(() => {
  if (catMode.value === 'day') return catDay.value
  if (catMode.value === 'year') return catYear.value
  return catMonth.value
})

const saleTip = computed(() => {
  if (saleMode.value === 'year') return '近 6 年售出数量（件）'
  if (saleMode.value === 'month') return '近 6 个月售出数量（件）'
  return `${viewYear.value}年${viewMonth.value}月每日售出数量（件）`
})

const catTip = computed(() => {
  if (catMode.value === 'year') return `${viewYear.value}年分类售出金额`
  if (catMode.value === 'day') return selectedDate.value ? `${selectedDate.value} 分类售出金额` : '请点击日历选择日期'
  return `${viewYear.value}年${viewMonth.value}月分类售出金额`
})

const isCurrentMonth = computed(
  () => viewYear.value === today.getFullYear() && viewMonth.value === today.getMonth() + 1
)
const isCurrentYear = computed(() => viewYear.value === today.getFullYear())

const dayLabel = computed(() =>
  selectedDate.value && selectedDate.value !== todayStr ? `${selectedDate.value} 销售额` : '今日销售额'
)
const dayQtyLabel = computed(() =>
  selectedDate.value && selectedDate.value !== todayStr ? `${selectedDate.value} 售出` : '今日售出'
)
const monthLabel = computed(() =>
  isCurrentMonth.value ? '本月销售额' : `${viewYear.value}年${viewMonth.value}月销售额`
)
const monthQtyLabel = computed(() =>
  isCurrentMonth.value ? '本月售出' : `${viewYear.value}年${viewMonth.value}月售出`
)
const yearLabel = computed(() => (isCurrentYear.value ? '今年销售额' : `${viewYear.value}年销售额`))
const yearQtyLabel = computed(() => (isCurrentYear.value ? '今年售出' : `${viewYear.value}年售出`))

function fmtMoney(v) {
  return Number(v || 0).toFixed(2)
}

function pct(c) {
  const total = currentCats.value.reduce((s, x) => s + Number(x.amount), 0)
  if (!total) return '0.0'
  return ((Number(c.amount) / total) * 100).toFixed(1)
}

// ---------- 数据加载 ----------
async function loadOverview() {
  const params = { month: `${viewYear.value}-${pad(viewMonth.value)}`, year: String(viewYear.value) }
  if (selectedDate.value) params.date = selectedDate.value
  const d = await get('/stats/overview', params)
  overview.value = d || { today: emptyStat(), month: emptyStat(), year: emptyStat() }
}

async function loadDaily(month) {
  const d = await get('/stats/daily', { month })
  dailyData.value = (d && d.days) || []
}

async function loadMonthly() {
  const d = await get('/stats/monthly', { months: 6 })
  monthlyData.value = (d && d.months) || []
}

async function loadYearly() {
  const d = await get('/stats/yearly', { years: 6 })
  yearlyData.value = (d && d.years) || []
}

async function loadYearDetail(year) {
  const d = await get('/stats/monthly', { year })
  yearMonths.value = (d && d.months) || []
}

async function loadCatMonth(month) {
  const d = await get('/stats/category', { month })
  catMonth.value = (d && d.categories) || []
}

async function loadCatDay(date) {
  const d = await get('/stats/category', { date })
  catDay.value = (d && d.categories) || []
}

async function loadCatYear(year) {
  const d = await get('/stats/category', { year })
  catYear.value = (d && d.categories) || []
}

async function refreshYearData() {
  await Promise.all([loadYearDetail(String(viewYear.value)), loadCatYear(String(viewYear.value))])
}

async function loadAll() {
  const month = `${viewYear.value}-${pad(viewMonth.value)}`
  await Promise.all([
    loadOverview(),
    loadDaily(month),
    loadMonthly(),
    loadCatMonth(month),
    loadYearly(),
    loadYearDetail(String(viewYear.value)),
    loadCatYear(String(viewYear.value)),
    selectedDate.value ? loadCatDay(selectedDate.value) : Promise.resolve()
  ])
  redrawCharts()
}

// ---------- 日历交互 ----------
function changeCal(delta) {
  if (calView.value === 'year') {
    viewYear.value += delta
    Promise.all([refreshYearData(), loadOverview()]).then(redrawCharts)
    return
  }
  changeMonth(delta)
}

function changeMonth(delta) {
  let y = viewYear.value
  let m = viewMonth.value + delta
  if (m < 1) { m = 12; y-- }
  if (m > 12) { m = 1; y++ }
  const yearChanged = y !== viewYear.value
  viewYear.value = y
  viewMonth.value = m
  if (!selectedDate.value || selectedDate.value.slice(0, 7) !== `${y}-${pad(m)}`) {
    selectedDate.value = ''
    catDay.value = []
  }
  const month = `${y}-${pad(m)}`
  const tasks = [loadDaily(month), loadCatMonth(month), loadOverview()]
  if (yearChanged) tasks.push(refreshYearData())
  Promise.all(tasks).then(redrawCharts)
}

function goToday() {
  calView.value = 'month'
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth() + 1
  selectedDate.value = todayStr
  catMode.value = 'day'
  loadAll()
}

function switchCalView(view) {
  calView.value = view
  if (view === 'year' && yearMonths.value.length === 0) {
    refreshYearData()
  }
}

function selectYearCell(month) {
  calView.value = 'month'
  viewMonth.value = month
  selectedDate.value = ''
  catDay.value = []
  const m = `${viewYear.value}-${pad(month)}`
  Promise.all([loadDaily(m), loadCatMonth(m)]).then(redrawCharts)
}

function selectDay(cell) {
  if (cell.empty) return
  selectedDate.value = cell.date
  catMode.value = 'day'
  Promise.all([loadCatDay(cell.date), loadOverview()]).then(redrawCharts)
}

function switchSaleMode(mode) {
  saleMode.value = mode
  redrawCharts()
}

function switchCatMode(mode) {
  catMode.value = mode
  redrawCharts()
}

// ---------- Canvas 图表 ----------
function getCanvas(id) {
  return new Promise((resolve) => {
    uni.createSelectorQuery()
      .select('#' + id)
      .fields({ node: true, size: true })
      .exec((res) => {
        const r = res && res[0]
        if (!r || !r.node) return resolve(null)
        const info = uni.getWindowInfo ? uni.getWindowInfo() : uni.getSystemInfoSync()
        const dpr = info.pixelRatio || 2
        r.node.width = r.width * dpr
        r.node.height = r.height * dpr
        const ctx = r.node.getContext('2d')
        ctx.scale(dpr, dpr)
        resolve({ ctx, width: r.width, height: r.height })
      })
  })
}

function niceCeil(v) {
  if (v <= 5) return 5
  const pow = Math.pow(10, Math.floor(Math.log10(v)))
  const d = v / pow
  const nd = d <= 1 ? 1 : d <= 2 ? 2 : d <= 5 ? 5 : 10
  return nd * pow
}

function fmtNum(v) {
  return v >= 10000 ? (v / 10000).toFixed(1) + 'w' : String(v)
}

function roundRectPath(ctx, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2)
  ctx.beginPath()
  ctx.moveTo(x + r, y)
  ctx.arcTo(x + w, y, x + w, y + h, r)
  ctx.arcTo(x + w, y + h, x, y + h, r)
  ctx.arcTo(x, y + h, x, y, r)
  ctx.arcTo(x, y, x + w, y, r)
  ctx.closePath()
}

function drawBars(cv, items, { highlightIndex = -1, valueLabel = false, xEvery = 1 } = {}) {
  const { ctx, width: W, height: H } = cv
  ctx.clearRect(0, 0, W, H)
  if (!items.length) {
    ctx.fillStyle = '#bbb'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.fillText('暂无数据', W / 2, H / 2)
    return
  }
  const padL = 36, padR = 8, padT = 20, padB = 24
  const plotW = W - padL - padR
  const plotH = H - padT - padB
  const max = Math.max(...items.map((i) => i.value), 1)
  const niceMax = niceCeil(max)

  ctx.strokeStyle = '#f0f0f0'
  ctx.lineWidth = 1
  ctx.fillStyle = '#aaa'
  ctx.font = '10px sans-serif'
  ctx.textAlign = 'right'
  ctx.textBaseline = 'middle'
  for (let g = 0; g <= 2; g++) {
    const y = padT + plotH - (plotH * g) / 2
    ctx.beginPath()
    ctx.moveTo(padL, y)
    ctx.lineTo(W - padR, y)
    ctx.stroke()
    ctx.fillText(fmtNum((niceMax * g) / 2), padL - 6, y)
  }

  const n = items.length
  const slot = plotW / n
  const barW = Math.min(slot * 0.6, 26)
  items.forEach((it, i) => {
    const h = (it.value / niceMax) * plotH
    const x = padL + slot * i + (slot - barW) / 2
    const y = padT + plotH - h
    ctx.fillStyle = i === highlightIndex ? '#ff6b2c' : '#ffc9a8'
    roundRectPath(ctx, x, y, barW, Math.max(h, it.value > 0 ? 2 : 0), Math.min(5, barW / 2))
    ctx.fill()
    if (n <= 12 || i % xEvery === 0) {
      ctx.fillStyle = '#999'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'alphabetic'
      ctx.fillText(it.label, padL + slot * i + slot / 2, H - 6)
    }
    if (valueLabel && it.value > 0) {
      ctx.fillStyle = '#666'
      ctx.font = '9px sans-serif'
      ctx.textAlign = 'center'
      ctx.fillText(String(it.value), padL + slot * i + slot / 2, y - 4)
    }
  })
}

function drawDonut(cv, items) {
  const { ctx, width: W, height: H } = cv
  ctx.clearRect(0, 0, W, H)
  const cx = W / 2
  const cy = H / 2
  const r = Math.min(W, H) / 2 - 6
  const total = items.reduce((s, i) => s + i.value, 0)
  if (!items.length || total <= 0) {
    ctx.strokeStyle = '#eee'
    ctx.lineWidth = 20
    ctx.beginPath()
    ctx.arc(cx, cy, r - 10, 0, Math.PI * 2)
    ctx.stroke()
    ctx.fillStyle = '#999'
    ctx.font = '13px sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('暂无数据', cx, cy)
    return
  }
  let start = -Math.PI / 2
  items.forEach((it, i) => {
    const angle = (it.value / total) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.arc(cx, cy, r, start, start + angle)
    ctx.closePath()
    ctx.fillStyle = colors[i % colors.length]
    ctx.fill()
    start += angle
  })
  ctx.fillStyle = '#fff'
  ctx.beginPath()
  ctx.arc(cx, cy, r * 0.58, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#333'
  ctx.font = 'bold 15px sans-serif'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('¥' + fmtMoney(total), cx, cy - 6)
  ctx.fillStyle = '#999'
  ctx.font = '10px sans-serif'
  ctx.fillText('售出金额', cx, cy + 12)
}

async function drawBarChart() {
  const barC = await getCanvas('barChart')
  if (!barC) return false
  let items = []
  let highlightIndex = -1
  let valueLabel = false
  let xEvery = 5
  if (saleMode.value === 'day') {
    items = dailyData.value.map((d) => ({ label: String(d.day), value: Number(d.quantity) }))
    const cur = `${viewYear.value}-${pad(viewMonth.value)}`
    if (selectedDate.value && selectedDate.value.slice(0, 7) === cur) {
      highlightIndex = Number(selectedDate.value.slice(8)) - 1
    }
    // 非零柱子数量不多时直接标出数值，避免拥挤
    valueLabel = items.filter((i) => i.value > 0).length <= 15
  } else if (saleMode.value === 'year') {
    items = yearlyData.value.map((y) => ({ label: String(y.year), value: Number(y.quantity) }))
    valueLabel = true
    xEvery = 1
  } else {
    items = monthlyData.value.map((m) => ({ label: m.label, value: Number(m.quantity) }))
    valueLabel = true
    xEvery = 1
  }
  drawBars(barC, items, { highlightIndex, valueLabel, xEvery })
  return true
}

async function drawPieChart() {
  const pieC = await getCanvas('pieChart')
  if (!pieC) return false
  drawDonut(pieC, currentCats.value.map((c) => ({ label: c.category, value: Number(c.amount) })))
  return true
}

function redrawCharts() {
  setTimeout(async () => {
    const barOk = await drawBarChart()
    const pieOk = await drawPieChart()
    if (!barOk || !pieOk) {
      setTimeout(async () => {
        if (!barOk) await drawBarChart()
        if (!pieOk) await drawPieChart()
      }, 300)
    }
  }, 50)
}

onLoad(() => {
  viewYear.value = today.getFullYear()
  viewMonth.value = today.getMonth() + 1
  selectedDate.value = todayStr
})

onShow(() => {
  loadAll()
})
</script>

<style lang="scss" scoped>
.block-title {
  font-size: 30rpx;
  font-weight: 600;
  margin-bottom: 16rpx;
}

/* 日历 */
.cal-head {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;

  .nav {
    width: 64rpx;
    height: 64rpx;
    line-height: 60rpx;
    text-align: center;
    background: #f5f5f5;
    border-radius: 12rpx;
    font-size: 40rpx;
    color: #666;
  }

  .cal-title {
    flex: 1;
    text-align: center;
    font-size: 32rpx;
    font-weight: 600;
  }
}

.cal-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16rpx;

  .cal-seg {
    width: 200rpx;
    margin-bottom: 0;
  }

  .today-btn {
    background: #fff3ec;
    color: #ff6b2c;
    font-size: 24rpx;
    padding: 10rpx 24rpx;
    border-radius: 28rpx;
  }
}

.week-row {
  display: flex;

  .week {
    flex: 1;
    text-align: center;
    font-size: 22rpx;
    color: #999;
    padding: 8rpx 0;
  }
}

.days-grid {
  display: flex;
  flex-wrap: wrap;

  .day-cell {
    position: relative;
    width: 14.28%;
    height: 76rpx;
    display: flex;
    align-items: center;
    justify-content: center;

    .day-num {
      font-size: 26rpx;
      color: #333;
    }

    .dot {
      position: absolute;
      bottom: 8rpx;
      width: 10rpx;
      height: 10rpx;
      border-radius: 50%;
      background: #ff6b2c;
    }

    &.today .day-num {
      color: #ff6b2c;
      font-weight: 600;
    }

    &.selected {
      background: #ff6b2c;
      border-radius: 14rpx;

      .day-num {
        color: #fff;
        font-weight: 600;
      }

      .dot {
        background: #fff;
      }
    }
  }
}

.year-grid {
  display: flex;
  flex-wrap: wrap;

  .year-cell {
    width: 33.33%;
    box-sizing: border-box;
    padding: 16rpx;
    display: flex;
    flex-direction: column;
    align-items: center;

    .year-month {
      font-size: 26rpx;
      color: #333;
    }

    .year-amount {
      margin-top: 8rpx;
      font-size: 22rpx;
      color: #ff6b2c;
      font-weight: 600;

      &.empty {
        color: #ccc;
        font-weight: 400;
      }
    }

    &.current {
      background: #fff3ec;
      border-radius: 12rpx;

      .year-month {
        color: #ff6b2c;
        font-weight: 600;
      }
    }
  }
}

/* 工作台 */
.wb-grid {
  display: flex;
  flex-wrap: wrap;

  .wb-item {
    width: 50%;
    box-sizing: border-box;
    display: flex;
    flex-direction: column;
    padding: 20rpx 8rpx;

    .wb-label {
      font-size: 24rpx;
      color: #999;
      margin-bottom: 10rpx;
    }

    .wb-value {
      font-size: 34rpx;
      font-weight: 600;
    }
  }
}

/* 分段切换 */
.seg {
  display: flex;
  background: #f5f5f5;
  border-radius: 12rpx;
  padding: 6rpx;
  width: 320rpx;
  margin-bottom: 16rpx;

  .seg-item {
    flex: 1;
    text-align: center;
    font-size: 24rpx;
    padding: 12rpx 0;
    color: #666;
    border-radius: 10rpx;

    &.active {
      background: #fff;
      color: #ff6b2c;
      font-weight: 600;
      box-shadow: 0 2rpx 8rpx rgba(0, 0, 0, 0.06);
    }
  }
}

.chart-tip {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.chart-sub {
  text-align: center;
  font-size: 22rpx;
  color: #bbb;
  margin-top: 8rpx;
}

.chart-canvas {
  display: block;
}

/* 图例 */
.legend {
  margin-top: 16rpx;

  .legend-item {
    display: flex;
    align-items: center;
    padding: 14rpx 0;
    border-bottom: 1rpx solid #f7f7f7;

    &:last-child {
      border-bottom: none;
    }

    .legend-color {
      width: 24rpx;
      height: 24rpx;
      border-radius: 6rpx;
      margin-right: 16rpx;
      flex-shrink: 0;
    }

    .legend-name {
      width: 100rpx;
      font-size: 26rpx;
    }

    .legend-qty {
      flex: 1;
      font-size: 24rpx;
      color: #999;
    }

    .legend-amount {
      font-size: 26rpx;
      margin-right: 20rpx;
    }

    .legend-pct {
      font-size: 24rpx;
      color: #999;
      width: 90rpx;
      text-align: right;
    }
  }

  .legend-empty {
    text-align: center;
    color: #bbb;
    font-size: 24rpx;
    padding: 20rpx 0;
  }
}
</style>
