<template>
  <div class="knowledge-distribution">
    <SectionSkeleton v-if="loading" :rows="3" height="250px" />
    <BaseChart
      v-else
      :options="chartOptions"
      empty-text="暂无知识点数据"
      height="250px"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { EChartsOption } from 'echarts'
import BaseChart from './BaseChart.vue'
import SectionSkeleton from './SectionSkeleton.vue'
import type { KnowledgeDistribution } from '../types/profile'

const props = defineProps<{
  distribution: KnowledgeDistribution
  loading?: boolean
}>()

const COLORS = ['#19b995', '#4f7cff', '#ffae35', '#ff5f6d']

const chartOptions = computed<EChartsOption>(() => {
  const d = props.distribution
  const data = [
    { value: d.mastered, name: '已掌握' },
    { value: d.basic, name: '基本掌握' },
    { value: d.weak, name: '薄弱' },
    { value: d.unlearned, name: '未掌握' },
  ]
  const masteredPct = d.total > 0 ? Math.round((d.mastered / d.total) * 100) : 0
  const valueMap = new Map(data.map((item) => [item.name, item.value]))

  return {
    backgroundColor: 'transparent',
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
      formatter: (p: any) => {
        return `<b>${p.name}</b><br/>知识点数量: ${p.value}<br/>占比: ${p.percent}%`
      },
    },
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      itemWidth: 9,
      itemHeight: 9,
      itemGap: 12,
      icon: 'circle',
      formatter: (name: string) => {
        const value = valueMap.get(name) ?? 0
        const pct = d.total > 0 ? Math.round((value / d.total) * 100) : 0
        return `{name|${name}}  {value|${pct}%}`
      },
      textStyle: {
        rich: {
          name: {
            color: '#526079',
            fontSize: 12,
            width: 68,
          },
          value: {
            color: '#101a33',
            fontSize: 12,
            fontWeight: 800,
            align: 'right',
          },
        },
      },
    },
    graphic: [
      {
        type: 'text',
        left: '29%',
        top: '42%',
        style: {
          text: masteredPct + '%',
          textAlign: 'center',
          fill: '#172033',
          fontSize: 26,
          fontWeight: 700,
        },
      },
      {
        type: 'text',
        left: '28.5%',
        top: '52%',
        style: {
          text: '已掌握',
          textAlign: 'center',
          fill: '#98a2b3',
          fontSize: 12,
        },
      },
    ],
    series: [
      {
        type: 'pie',
        radius: ['50%', '74%'],
        center: ['34%', '50%'],
        avoidLabelOverlap: true,
        padAngle: 3,
        itemStyle: {
          borderColor: '#fff',
          borderWidth: 4,
          borderRadius: 8,
          shadowBlur: 12,
          shadowColor: 'rgba(25,185,149,0.12)',
        },
        label: { show: false },
        emphasis: {
          scaleSize: 6,
        },
        data: data.map((item, i) => ({
          ...item,
          itemStyle: { color: COLORS[i] },
        })),
      },
    ],
  }
})
</script>

<style scoped lang="scss">
.knowledge-distribution {
  width: 100%;
}
</style>
