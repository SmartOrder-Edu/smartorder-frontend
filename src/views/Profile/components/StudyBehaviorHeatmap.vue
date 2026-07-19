<template>
  <div class="heatmap-section">
    <SectionSkeleton v-if="loading" :rows="5" height="260px" />
    <template v-else>
      <!-- 学习行为摘要：减少纯热力格子的阅读压力 -->
      <div class="heatmap-stats">
        <div class="heatmap-stat">
          <span class="stat-label">学习天数</span>
          <strong>{{ behaviorStats.activeDays }}天</strong>
        </div>
        <div class="heatmap-stat">
          <span class="stat-label">总学习时长</span>
          <strong>{{ behaviorStats.totalHours }}h</strong>
        </div>
        <div class="heatmap-stat">
          <span class="stat-label">最佳时段</span>
          <strong>{{ behaviorStats.bestPeriod }}</strong>
        </div>
        <div class="heatmap-stat">
          <span class="stat-label">日均强度</span>
          <strong>{{ behaviorStats.avgScore }}</strong>
        </div>
      </div>
      <BaseChart
        :options="chartOptions"
        empty-text="暂无行为数据"
        height="230px"
      />
      <div class="heatmap-legend">
        <span class="legend-label">少</span>
        <div class="legend-gradient" />
        <span class="legend-label">多</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import { mockHeatmapData } from '../mocks/profileMockData'

defineProps<{
  loading?: boolean
}>()

const DAY_LABELS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
const PERIODS = [
  { label: '上午', range: '06:00-11:59', start: 6, end: 11 },
  { label: '下午', range: '12:00-17:59', start: 12, end: 17 },
  { label: '晚上', range: '18:00-22:59', start: 18, end: 22 },
  { label: '深夜', range: '23:00-05:59', start: 23, end: 5 },
]

const compactHeatmap = computed(() => {
  const raw = mockHeatmapData() // 24h x 7days

  const data: [number, number, number][] = []
  PERIODS.forEach((period, pi) => {
    for (let di = 0; di < 7; di++) {
      const hours =
        period.start <= period.end
          ? Array.from({ length: period.end - period.start + 1 }, (_, i) => period.start + i)
          : [23, 0, 1, 2, 3, 4, 5]
      const avg = Math.round(
        hours.reduce((sum, h) => sum + (raw[h]?.[di] ?? 0), 0) / hours.length
      )
      data.push([di, pi, avg])
    }
  })
  return data
})

const behaviorStats = computed(() => {
  const data = compactHeatmap.value
  const activeDays = new Set(data.filter((item) => item[2] > 18).map((item) => item[0])).size
  const totalScore = data.reduce((sum, item) => sum + item[2], 0)
  const periodTotals = PERIODS.map((period, index) => ({
    label: period.label,
    total: data.filter((item) => item[1] === index).reduce((sum, item) => sum + item[2], 0),
  }))
  const bestPeriod = periodTotals.sort((a, b) => b.total - a.total)[0]?.label || '下午'

  return {
    activeDays: Math.max(activeDays, 5),
    totalHours: (totalScore / 36).toFixed(1),
    bestPeriod,
    avgScore: Math.round(totalScore / Math.max(1, data.length)),
  }
})

const chartOptions = computed<EChartsOption>(() => {
  return {
    tooltip: {
      backgroundColor: '#fff',
      borderColor: '#e8edf5',
      borderWidth: 1,
      borderRadius: 10,
      padding: [10, 14],
      textStyle: { color: '#344054', fontSize: 12 },
      extraCssText:
        'box-shadow: 0 1px 3px rgba(16,24,40,0.04), 0 6px 16px rgba(30,64,175,0.06);',
      formatter: (p: any) => {
        const val = p.value[2] ?? 0
        const period = PERIODS[p.value[1]]
        const activity = val > 60 ? '高度专注' : val > 30 ? '中度学习' : val > 8 ? '轻度活跃' : '休息为主'
        return `<b>${DAY_LABELS[p.value[0]]} ${period.label}</b><br/>
          <span style="color:#667085">时段: </span>${period.range}<br/>
          <span style="color:#667085">活跃值: </span><b style="color:#2563eb">${val}</b><br/>
          <span>${activity}</span>`
      },
    },
    grid: { top: 18, right: 16, bottom: 30, left: 42 },
    xAxis: {
      type: 'category',
      data: DAY_LABELS,
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#667085', fontSize: 11 },
      position: 'top',
    },
    yAxis: {
      type: 'category',
      data: PERIODS.map((p) => p.label),
      splitArea: { show: false },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#526079', fontSize: 11, fontWeight: 600 },
      inverse: true,
    },
    visualMap: {
      min: 0,
      max: 100,
      calculable: false,
      orient: 'horizontal',
      left: 'center',
      bottom: 2,
      inRange: {
        color: ['#f8fafc', '#dbeafe', '#93c5fd', '#4f8bf9', '#2563eb', '#1d4ed8'],
      },
      show: false,
    },
    series: [
      {
        type: 'heatmap',
        data: compactHeatmap.value,
        label: { show: false },
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowColor: 'rgba(37,99,235,0.4)',
          },
        },
        itemStyle: {
          borderRadius: 6,
          borderColor: '#fff',
          borderWidth: 4,
        },
      },
    ],
  }
})
</script>

<style scoped lang="scss">
.heatmap-section {
  width: 100%;
}

.heatmap-stats {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
  margin-bottom: 8px;

  @media (max-width: 760px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.heatmap-stat {
  min-width: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
  border: 1px solid #e6edf7;

  .stat-label {
    display: block;
    color: #7b879a;
    font-size: 11px;
    margin-bottom: 4px;
  }

  strong {
    color: #101a33;
    font-size: 18px;
    font-weight: 800;
    font-variant-numeric: tabular-nums;
  }
}

.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-top: 2px;
}

.legend-label {
  font-size: 10px;
  color: #98a2b3;
}

.legend-gradient {
  width: 150px;
  height: 8px;
  border-radius: 4px;
  background: linear-gradient(90deg, #f8fafc, #dbeafe, #93c5fd, #4f8bf9, #2563eb, #1d4ed8);
}
</style>
