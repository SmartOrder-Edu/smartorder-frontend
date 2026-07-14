<template>
  <span :class="['question-tag', type, { kp }]">
    <slot>{{ text }}</slot>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  text?: string
  type?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'blue'
  kp?: boolean // 是否为知识点标签
}>()
</script>

<style scoped>
.question-tag {
  display: inline-flex;
  align-items: center;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 12px;
  border-radius: 8px;
  line-height: 1.2;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

/* 默认样式 */
.question-tag.default {
  background: #f1f5f9;
  color: #475569;
}

.question-tag.info {
  background: #f0f4f9;
  color: #475569;
  border-color: #e2e8f0;
}

/* 知识点标签样式 - 浅青绿色 */
.question-tag.kp {
  background: #f0fdfa;
  color: #0f9f91;
  border-color: #ccfbf1;
  font-weight: 700;
}

/* 蓝色/主要样式 */
.question-tag.primary,
.question-tag.blue {
  background: #eff6ff;
  color: #2563eb;
  border-color: #dbeafe;
}

.question-tag.success {
  background: #f0fdf4;
  color: #16a34a;
  border-color: #dcfce7;
}

.question-tag.warning {
  background: #fffbeb;
  color: #d97706;
  border-color: #fef3c7;
}

/* 深色模式适配 */
html[data-theme='dark'] .question-tag.default {
  background: #334155;
  color: #cbd5e1;
}

html[data-theme='dark'] .question-tag.info {
  background: #1e293b;
  color: #94a3b8;
  border-color: #334155;
}

html[data-theme='dark'] .question-tag.kp {
  background: rgba(20, 184, 166, 0.15);
  color: #2dd4bf;
  border-color: rgba(20, 184, 166, 0.25);
}

html[data-theme='dark'] .question-tag.primary,
html[data-theme='dark'] .question-tag.blue {
  background: rgba(37, 99, 235, 0.15);
  color: #60a5fa;
  border-color: rgba(37, 99, 235, 0.25);
}

html[data-theme='dark'] .question-tag.success {
  background: rgba(22, 163, 74, 0.15);
  color: #4ade80;
  border-color: rgba(22, 163, 74, 0.25);
}

html[data-theme='dark'] .question-tag.warning {
  background: rgba(217, 119, 6, 0.15);
  color: #fbbf24;
  border-color: rgba(217, 119, 6, 0.25);
}
</style>
