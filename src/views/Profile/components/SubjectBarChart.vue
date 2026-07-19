<template>
  <div class="subject-bar">
    <SectionSkeleton v-if="loading" :rows="4" height="280px" />
    <BaseChart
      v-else
      :options="chartOptions"
      :empty="!subjects.length"
      empty-text="暂无学科数据"
      height="300px"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { SubjectBarItem } from '../types/profile'

const props = defineProps<{
  subjects: SubjectBarItem[]
  loading?: boolean
}>()

const barColors = [
  ['#4f6ef6', '#7c8ff7'],
  ['#2dd4bf', '#5ee3d5'],
  ['#f59e0b', '#f8c154'],
  ['#8b5cf6', '#a88af7'],
  ['#3b82f6', '#6da7f8'],
  ['#ec4899', '#f370af'],
]

const chartOptions = computed<EChartsOption>(() => {
  const names = props.subjects.map((s) => s.name)
  const values = props.subjects.map((s) => s.mastery)

  return {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      backgroundColor: '#fff',
      borderColor: '#e8edf5',
      borderWidth: 1,
      borderRadius: 10,
      padding: [10, 14],
      textStyle: { color: '#344054', fontSize: 12 },
      extraCssText: 'box-shadow: 0 1px 3px rgba(16,24,40,0.04), 0 6px 16px rgba(30,64,175,0.06);',
      formatter: (params: any) => {
        if (!Array.isArray(params)) return ''
        const p = params[0]
        const subject = props.subjects[p.dataIndex]
        let html = `<div style="font-weight:600;margin-bottom:6px">${p.name}</div>`
        html += `<div style="color:#667085;font-size:11px">掌握度: <b style="color:#172033">${p.value}%</b></div>`
        if (subject?.lastTestTime) {
          html += `<div style="color:#667085;font-size:11px">最近测评: ${subject.lastTestTime}</div>`
        }
        const trendLabel: Record<string, string> = { up: '↑ 提升中', down: '↓ 下降中', stable: '→ 稳定' }
        html += `<div style="color:#667085;font-size:11px">趋势: ${trendLabel[subject?.trend] || '--'}</div>`
        return html
      },
    },
    grid: { top: 12, right: 16, bottom: 30, left: 40, containLabel: true },
    xAxis: {
      type: 'category',
      data: names,
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#667085', fontSize: 11 },
    },
    yAxis: {
      type: 'value',
      min: 0,
      max: 100,
      interval: 25,
      axisLabel: { formatter: '{value}%', color: '#98a2b3', fontSize: 11 },
      splitLine: { lineStyle: { color: '#edf1f7' } },
      axisLine: { show: false },
      axisTick: { show: false },
    },
    series: [
      {
        type: 'bar',
        data: values.map((v, i) => ({
          value: v,
          itemStyle: {
            borderRadius: [7, 7, 2, 2],
            color: {
              type: 'linear' as const,
              x: 0, y: 0, x2: 0, y2: 1,
              colorStops: [
                { offset: 0, color: barColors[i % barColors.length][1] },
                { offset: 1, color: barColors[i % barColors.length][0] },
              ],
            },
            shadowBlur: 6,
            shadowOffsetY: 2,
            shadowColor: `${barColors[i % barColors.length][0]}30`,
          },
        })),
        barWidth: 24,
        label: {
          show: true,
          position: 'top',
          formatter: '{c}%',
          fontWeight: 700,
          fontSize: 11,
          color: '#344054',
        },
        emphasis: {
          itemStyle: { shadowBlur: 12, shadowOffsetY: 4 },
        },
      },
    ],
  }
})

</script>

<style scoped lang="scss">
.subject-bar {
  width: 100%;
}
</style>
