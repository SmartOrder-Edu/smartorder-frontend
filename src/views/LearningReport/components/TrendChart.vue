<template>
  <svg
    class="trend-chart"
    viewBox="0 0 720 360"
    role="img"
    :aria-label="ariaLabel"
  >
    <defs>
      <linearGradient :id="gradId" x1="0" x2="0" y1="0" y2="1">
        <stop offset="0%" class="trend-area-top" />
        <stop offset="100%" class="trend-area-bottom" />
      </linearGradient>
    </defs>
    <g class="chart-grid">
      <line v-for="tick in 5" :key="tick" x1="56" x2="684" :y1="tick * 58" :y2="tick * 58" />
    </g>
    <path class="trend-area" :d="trendAreaPath" :fill="`url(#${gradId})`" />
    <polyline class="trend-line" :points="trendPolyline" />
    <g v-for="point in computedPoints" :key="point.day">
      <circle class="trend-point" :cx="point.x" :cy="point.y" r="6" />
      <text class="trend-label" :x="point.x" y="330">{{ point.day }}</text>
    </g>
  </svg>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TrendPoint } from '@/types/learningReport'

const props = withDefaults(
  defineProps<{
    points: TrendPoint[]
    ariaLabel?: string
  }>(),
  {
    ariaLabel: '知识掌握度趋势图',
  }
)

// 与原 index.vue 一致的图表坐标系
const chartWidth = 628
const chartHeight = 250
const chartLeft = 56
const chartTop = 42

// 唯一 gradient id，避免多实例冲突
const gradId = `trendArea-${Math.random().toString(36).slice(2, 8)}`

const computedPoints = computed(() =>
  props.points.map((point, index) => ({
    ...point,
    x: chartLeft + (chartWidth / (props.points.length - 1)) * index,
    y: chartTop + chartHeight - (point.value / 100) * chartHeight,
  }))
)

const trendPolyline = computed(() =>
  computedPoints.value.map(point => `${point.x},${point.y}`).join(' ')
)

const trendAreaPath = computed(() => {
  const points = computedPoints.value
  const first = points[0]
  const last = points[points.length - 1]
  return `M ${first.x} ${chartTop + chartHeight} L ${trendPolyline.value} L ${last.x} ${chartTop + chartHeight} Z`
})
</script>

<style scoped lang="scss">
.trend-chart {
  width: 100%;
  height: auto;
  display: block;
}

.chart-grid line {
  stroke: var(--border-soft);
  stroke-width: 1;
}

.trend-area-top {
  stop-color: var(--primary-color);
  stop-opacity: 0.28;
}

.trend-area-bottom {
  stop-color: var(--primary-color);
  stop-opacity: 0;
}

.trend-line {
  fill: none;
  stroke: var(--primary-color);
  stroke-width: 3;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-dasharray: 1200;
  stroke-dashoffset: 1200;
  animation: draw-line 1.1s ease-out 0.2s forwards;
}

.trend-point {
  fill: var(--primary-color);
  stroke: var(--bg-card);
  stroke-width: 2.5;
  opacity: 0;
  animation: point-in 0.4s ease-out forwards;
}

.trend-point:nth-child(1) {
  animation-delay: 0.6s;
}

.trend-label {
  fill: var(--text-muted);
  font-size: 14px;
  font-weight: 600;
  text-anchor: middle;
}

@keyframes draw-line {
  to {
    stroke-dashoffset: 0;
  }
}

@keyframes point-in {
  to {
    opacity: 1;
  }
}

@media (prefers-reduced-motion: reduce) {
  .trend-line,
  .trend-point {
    animation: none;
    stroke-dashoffset: 0;
    opacity: 1;
  }
}
</style>
