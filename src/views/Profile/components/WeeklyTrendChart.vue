<template>
  <div class="weekly-trend">
    <SectionSkeleton v-if="loading" :rows="4" height="260px" />
    <BaseChart
      v-else
      :options="chartOptions"
      empty-text="暂无趋势数据"
      height="260px"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import { mockTrendData } from '../mocks/profileMockData'

const props = defineProps<{
  metric: 'duration' | 'tasks' | 'accuracy'
  loading?: boolean
}>()

const chartOptions = computed(() => {
  const data = mockTrendData(props.metric)
  const unitLabels: Record<string, string> = {
    duration: '小时',
    tasks: '个',
    accuracy: '%',
  }
  const metricLabels: Record<string, string> = {
    duration: '学习时长',
    tasks: '完成任务数',
    accuracy: '练习正确率',
  }
  const unit = unitLabels[props.metric] || ''
  const metricLabel = metricLabels[props.metric] || ''

  return {
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#fff',
      borderColor: '#e8edf5',
      borderWidth: 1,
      borderRadius: 10,
      padding: [10, 14],
      textStyle: { color: '#344054', fontSize: 12 },
      extraCssText:
        'box-shadow: 0 1px 3px rgba(16,24,40,0.04), 0 6px 16px rgba(30,64,175,0.06);',
      formatter: (params: any) => {
        if (!Array.isArray(params)) return ''
        const p = params[0]
        const prevVal = data.values[p.dataIndex - 1]
        const diff = prevVal !== undefined ? p.value - prevVal : 0
        const diffStr =
          diff > 0
            ? `<span style="color:#10b981">↑ +${diff.toFixed(1)}</span>`
            : diff < 0
              ? `<span style="color:#ef4444">↓ ${diff.toFixed(1)}</span>`
              : `<span style="color:#98a2b3">→ 持平</span>`
        return `
          <div style="font-weight:600;margin-bottom:6px">📅 ${p.name}</div>
          <div style="color:#667085;font-size:11px">
            ${metricLabel}: <b style="color:#172033;font-size:14px">${p.value} ${unit}</b>
          </div>
          <div style="color:#667085;font-size:11px;margin-top:4px">较前日: ${diffStr}</div>
        `
      },
    },
    grid: { top: 30, right: 20, bottom: 24, left: 38, containLabel: true },
    xAxis: {
      type: 'category',
      data: data.dates,
      boundaryGap: false,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#98a2b3', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      name: unit,
      nameTextStyle: { color: '#98a2b3', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf1f7' } },
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#98a2b3', fontSize: 11 },
    },
    series: [
      {
        type: 'line',
        smooth: 0.25,
        symbol: 'circle',
        symbolSize: 7,
        data: data.values,
        lineStyle: { color: '#2563eb', width: 2.5 },
        itemStyle: { color: '#fff', borderColor: '#2563eb', borderWidth: 2 },
        label: {
          show: true,
          position: 'top',
          fontSize: 10,
          color: '#667085',
          formatter: (p: any) => {
            if (props.metric === 'accuracy') return p.value + '%'
            return p.value + ''
          },
        },
        areaStyle: {
          color: {
            type: 'linear' as const,
            x: 0, y: 0, x2: 0, y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(37,99,235,0.18)' },
              { offset: 1, color: 'rgba(37,99,235,0.0)' },
            ],
          },
        },
        emphasis: {
          focus: 'series' as const,
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(37,99,235,0.35)' },
        },
        markLine: {
          silent: true,
          symbol: 'none',
          lineStyle: { color: '#e8edf5', type: 'dashed' as const, width: 1 },
          data: [{ type: 'average' as const, name: '周均值' }],
          label: { fontSize: 10, color: '#98a2b3', formatter: '均值 {c}' },
        },
      },
    ],
  } as EChartsOption
})

</script>

<style scoped lang="scss">
.weekly-trend {
  width: 100%;
}
</style>
