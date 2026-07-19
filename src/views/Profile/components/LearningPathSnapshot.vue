<template>
  <div class="path-snapshot">
    <SectionSkeleton v-if="loading" :rows="5" height="320px" />
    <BaseChart
      v-else
      :options="chartOptions"
      empty-text="暂无路径数据"
      height="320px"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import { mockLearningPathSteps } from '../mocks/profileMockData'

defineProps<{
  loading?: boolean
}>()

const chartOptions = computed<EChartsOption>(() => {
  const steps = mockLearningPathSteps()

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: '#fff',
      borderColor: '#e8edf5',
      borderWidth: 1,
      borderRadius: 10,
      padding: [8, 12],
      textStyle: { color: '#344054', fontSize: 12 },
      extraCssText:
        'box-shadow: 0 1px 3px rgba(16,24,40,0.04), 0 6px 16px rgba(30,64,175,0.06);',
    },
    grid: { top: 20, right: 30, bottom: 20, left: 90 },
    xAxis: {
      type: 'value',
      show: false,
      min: 0,
      max: 100,
    },
    yAxis: {
      type: 'category',
      data: steps.map((s) => s.label).reverse(),
      axisLine: { show: false },
      axisTick: { show: false },
      axisLabel: { color: '#172033', fontSize: 12, fontWeight: 500 },
    },
    series: [
      {
        type: 'bar',
        data: [...steps]
          .reverse()
          .map((s) => {
            const isDone = s.status === 'completed'
            const isActive = s.status === 'in_progress'
            return {
              value: s.percent,
              itemStyle: {
                borderRadius: [0, 8, 8, 0],
                color: isDone
                  ? {
                      type: 'linear' as const,
                      x: 0, y: 0, x2: 1, y2: 0,
                      colorStops: [
                        { offset: 0, color: '#10b981' },
                        { offset: 1, color: '#34d399' },
                      ],
                    }
                  : isActive
                    ? {
                        type: 'linear' as const,
                        x: 0, y: 0, x2: 1, y2: 0,
                        colorStops: [
                          { offset: 0, color: '#2563eb' },
                          { offset: 1, color: '#60a5fa' },
                        ],
                      }
                    : '#edf1f7',
              },
              label: {
                show: true,
                position: 'right',
                formatter: (p: any) => {
                  if (isDone) return '{done|✓ 已完成}'
                  if (isActive) return '{active|' + p.value + '%}'
                  return ''
                },
                rich: {
                  done: { color: '#10b981', fontSize: 11 },
                  active: { color: '#2563eb', fontSize: 11, fontWeight: 600 },
                },
              },
            }
          }),
        barWidth: 18,
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(37,99,235,0.2)' },
        },
      },
    ],
  }
})
</script>

<style scoped lang="scss">
.path-snapshot {
  width: 100%;
}
</style>
