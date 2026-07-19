<template>
  <div class="base-chart-wrapper" :style="{ height }">
    <!-- Loading 骨架 -->
    <SectionSkeleton v-if="loading" :rows="skeletonRows" />

    <!-- 空状态 -->
    <div v-else-if="isEmpty" class="chart-empty">
      <el-icon :size="36" color="#c0c8d4"><WarningFilled /></el-icon>
      <span class="empty-text">{{ emptyText }}</span>
    </div>

    <!-- 图表容器 -->
    <div
      ref="chartDomRef"
      class="chart-dom"
      :style="{ height: loading ? '0' : '100%', opacity: loading ? 0 : 1 }"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, nextTick } from 'vue'
import { WarningFilled } from '@element-plus/icons-vue'
import { useECharts } from '@/composables/useECharts'
import type { EChartsOption } from 'echarts'
import SectionSkeleton from './SectionSkeleton.vue'

const props = withDefaults(
  defineProps<{
    options: EChartsOption | null
    height?: string
    loading?: boolean
    empty?: boolean
    emptyText?: string
    skeletonRows?: number
  }>(),
  {
    height: '280px',
    loading: false,
    empty: false,
    emptyText: '暂无数据',
    skeletonRows: 3,
  }
)

defineEmits<{
  (e: 'ready', instance: ReturnType<typeof useECharts>['instance']): void
  (e: 'click', params: any): void
}>()

const chartDomRef = ref<HTMLElement | null>(null)
const { init, setOption, instance } = useECharts(chartDomRef, {
  autoResize: true,
})

const isEmpty = ref(false)

function renderChart() {
  if (props.loading) return
  if (!chartDomRef.value) return

  if (props.empty || !props.options) {
    isEmpty.value = true
    return
  }

  isEmpty.value = false

  if (!instance.value || instance.value.isDisposed()) {
    init()
    // 绑定点击事件
    if (instance.value) {
      instance.value.on('click', () => {
        // ECharts v6 click event
      })
    }
  }

  if (props.options) {
    setOption(props.options)
  }
}

onMounted(async () => {
  await nextTick()
  renderChart()
})

watch(
  () => [props.options, props.loading, props.empty],
  () => {
    nextTick(() => renderChart())
  },
  { deep: true }
)

// 组件卸载时 useECharts 的 onBeforeUnmount 会自动 dispose
</script>

<style scoped lang="scss">
.base-chart-wrapper {
  position: relative;
  width: 100%;
  min-height: 200px;
}

.chart-dom {
  width: 100%;
  transition: opacity 0.3s ease;
}

.chart-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  min-height: 200px;
  gap: 10px;

  .empty-text {
    font-size: 13px;
    color: #98a2b3;
  }
}
</style>
