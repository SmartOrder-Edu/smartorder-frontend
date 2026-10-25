<template>
  <div class="quiz-progress">
    <div class="circle-chart" :style="{ '--percent': `${percentage}%` }">
      <div class="circle-inner">
        <span class="count-text">{{ answered }}<span class="total-slash">/</span>{{ total }}</span>
        <span class="label-text">已完成</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    answered?: number
    total?: number
  }>(),
  {
    answered: 0,
    total: 0
  }
)

const percentage = computed(() => {
  if (!props.total) return 0
  return Math.min(100, Math.round((props.answered / props.total) * 100))
})
</script>

<style scoped>
.quiz-progress {
  display: flex;
  justify-content: center;
  align-items: center;
}

.circle-chart {
  position: relative;
  /* 概况卡内圆环缩小一档，避免头部进度区压高页面。 */
  width: 88px;
  height: 88px;
  border-radius: 50%;
  /* 环形进度颜色使用更自然的青绿色渐变与柔和截断 */
  background: conic-gradient(#14b8a6, #2dd4bf var(--percent, 0%), #e8edf4 var(--percent, 0%));
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: inset 0 2px 5px rgba(15, 23, 42, 0.05);
  transition: background 0.3s ease;
}

.circle-chart::after {
  content: '';
  position: absolute;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.05);
  transition: background 0.3s ease;
}

.circle-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.count-text {
  font-size: 17px;
  font-weight: 800;
  color: #182230;
  line-height: 1.1;
  transition: color 0.3s ease;
}

.total-slash {
  font-size: 13px;
  font-weight: 600;
  color: #98a2b3;
  margin: 0 1px;
}

.label-text {
  font-size: 11px;
  font-weight: 700;
  color: #667085;
  margin-top: 2px;
  transition: color 0.3s ease;
}

/* 深色模式适配 */
html[data-theme='dark'] .circle-chart {
  background: conic-gradient(#14b8a6, #2dd4bf var(--percent, 0%), #1e293b var(--percent, 0%));
  box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .circle-chart::after {
  background: #1e293b;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

html[data-theme='dark'] .count-text {
  color: #f4f7fb;
}

html[data-theme='dark'] .label-text {
  color: #94a3b8;
}
</style>
