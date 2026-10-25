<template>
  <div class="ability-radar">
    <SectionSkeleton v-if="loading" :rows="3" height="270px" />
    <template v-else>
      <div class="radar-level-badge">熟练</div>
      <BaseChart
        :options="chartOptions"
        :empty="!dimensions.length"
        empty-text="暂无能力评估数据"
        height="270px"
        @click="onClick"
      />
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { RadarDimension } from '../types/profile'

const props = defineProps<{
  dimensions: RadarDimension[]
  peerDimensions?: RadarDimension[]
  loading?: boolean
}>()

const emit = defineEmits<{
  (e: 'dimension-click', name: string): void
}>()

const chartOptions = computed<EChartsOption>(() => {
  const myValues = props.dimensions.map((d) => d.score)
  const names = props.dimensions.map((d) => d.name)
  const scoreMap = new Map(props.dimensions.map((d) => [d.name, d.score]))

  return {
    backgroundColor: 'transparent',
    tooltip: {
      backgroundColor: '#fff',
      borderColor: '#e8edf5',
      borderWidth: 1,
      borderRadius: 10,
      padding: [10, 14],
      textStyle: { color: '#344054', fontSize: 12 },
      extraCssText: 'box-shadow: 0 1px 3px rgba(16,24,40,0.04), 0 6px 16px rgba(30,64,175,0.06);',
      formatter: (params: any) => {
        const value = params.value?.[params.dimensionIndex] ?? ''
        const name = params.name || ''
        return `<b>${name}</b><br/><span style="color:#667085">能力评分：</span><b style="color:#0f766e">${value}</b>`
      },
    },
    radar: {
      center: ['50%', '52%'],
      radius: '58%',
      splitNumber: 4,
      axisName: {
        color: '#526079',
        fontSize: 11,
        lineHeight: 15,
        formatter: (name: string) => {
          const score = scoreMap.get(name)
          return score != null ? `{score|${Math.round(score)}}\n{name|${name}}` : `{name|${name}}`
        },
        rich: {
          score: {
            color: '#00a98f',
            fontSize: 12,
            fontWeight: 800,
            lineHeight: 15,
          },
          name: {
            color: '#526079',
            fontSize: 11,
            lineHeight: 15,
          },
        },
      },
      nameGap: 18,
      splitArea: {
        areaStyle: {
          color: ['#ffffff', '#f8fbff'],
        },
      },
      splitLine: { lineStyle: { color: '#e2e8f2', width: 1 } },
      axisLine: { lineStyle: { color: '#e6edf7', width: 1 } },
      indicator: names.map((name) => ({ name, max: 100 })),
    },
    series: [
      {
        type: 'radar',
        name: '综合能力',
        data: [{ value: myValues, name: '综合能力' }],
        symbol: 'circle',
        symbolSize: 7,
        lineStyle: { color: '#3d6dde', width: 2.4 },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 1,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(72, 111, 222, 0.34)' },
              { offset: 1, color: 'rgba(34, 197, 179, 0.26)' },
            ],
          },
        },
        itemStyle: {
          color: '#3d6dde',
          borderColor: '#fff',
          borderWidth: 2,
          shadowBlur: 8,
          shadowColor: 'rgba(61,109,222,0.28)',
        },
      },
    ],
  }
})

function onClick(params: any) {
  if (params.componentType === 'radar') {
    const idx = params.dataIndex
    const name = props.dimensions[idx]?.name
    if (name) emit('dimension-click', name)
  }
}
</script>

<style scoped lang="scss">
.ability-radar {
  width: 100%;
  position: relative;
}

.radar-level-badge {
  position: absolute;
  top: -38px;
  left: 116px;
  z-index: 2;
  padding: 2px 8px;
  border-radius: 6px;
  background: #e7fbf5;
  color: #00a98f;
  font-size: 11px;
  font-weight: 800;
}
</style>
