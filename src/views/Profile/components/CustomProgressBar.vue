<template>
  <div
    class="custom-progress"
    :class="{ 'progress-animated': animated }"
    :style="{ height: height + 'px' }"
  >
    <div
      class="custom-progress-fill"
      :style="fillStyle"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'

const props = withDefaults(
  defineProps<{
    /** 百分比 (0-100) */
    percent: number
    /** 进度条颜色，可以是单一色或渐变色 */
    color?: string | string[]
    /** 高度 px */
    height?: number
    /** 轨道颜色 */
    trackColor?: string
    /** 是否启用首次加载动画 */
    animated?: boolean
    /** 动画时长 ms */
    animationDuration?: number
  }>(),
  {
    percent: 0,
    color: '#2563eb',
    height: 5,
    trackColor: '#edf1f7',
    animated: true,
    animationDuration: 600,
  }
)

const displayPercent = ref(props.animated ? 0 : props.percent)

const fillStyle = computed(() => {
  const bgColor = Array.isArray(props.color)
    ? `linear-gradient(90deg, ${props.color.join(', ')})`
    : props.color

  return {
    width: `${displayPercent.value}%`,
    background: bgColor,
    transition: `width ${props.animationDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
  }
})

onMounted(() => {
  if (props.animated) {
    // 使用 requestAnimationFrame 确保从 0 开始动画
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        displayPercent.value = props.percent
      })
    })
  }
})
</script>

<style scoped lang="scss">
.custom-progress {
  width: 100%;
  border-radius: 999px;
  background: #edf1f7;
  overflow: hidden;

  &.progress-animated {
    .custom-progress-fill {
      width: 0;
    }
  }
}

.custom-progress-fill {
  height: 100%;
  border-radius: 999px;
  min-width: 0;
}
</style>
