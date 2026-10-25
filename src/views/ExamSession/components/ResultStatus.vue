<template>
  <div class="result-status">
    <span :class="['status-badge', statusClass]">
      <template v-if="status === 'correct'">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" class="status-icon">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
        回答正确
      </template>
      <template v-else-if="status === 'wrong'">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="3" class="status-icon">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
        回答错误
      </template>
      <template v-else-if="status === 'pending'">
        <span class="status-icon-emoji">⏳</span>
        AI 智能批阅中...
      </template>
      <template v-else-if="status === 'self_check'">
        <span class="status-icon-emoji">✍️</span>
        主观题需自测对比
      </template>
    </span>

    <span v-if="showScore && status !== 'pending' && status !== 'self_check'" class="score-text">
      得分：<strong class="score-num">{{ score }}</strong><span class="score-slash">/</span>{{ totalScore }} 分
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    status: 'correct' | 'wrong' | 'pending' | 'self_check'
    score?: number | string
    totalScore?: number | string
    showScore?: boolean
  }>(),
  {
    showScore: true
  }
)

const statusClass = computed(() => {
  switch (props.status) {
    case 'correct':
      return 'success-state'
    case 'wrong':
      return 'error-state'
    case 'pending':
      return 'pending-state'
    case 'self_check':
      return 'self-check-state'
    default:
      return ''
  }
})
</script>

<style scoped>
.result-status {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  height: 38px;
  padding: 0 16px;
  border-radius: 12px;
  font-size: 13.5px;
  font-weight: 800;
  line-height: 1;
  transition: all 0.3s ease;
}

.status-icon {
  flex-shrink: 0;
}

.status-icon-emoji {
  font-size: 14px;
}

/* 回答正确 */
.success-state {
  color: #16a34a;
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
}

/* 回答错误 */
.error-state {
  color: #ef4444;
  background: #fef2f2;
  border: 1.5px solid #fecdd3;
}

/* AI 智能批阅中 */
.pending-state {
  color: #d97706;
  background: #fffbeb;
  border: 1.5px solid #fde68a;
}

/* 主观题需自测对比 */
.self-check-state {
  color: #475569;
  background: #f1f5f9;
  border: 1.5px solid #e2e8f0;
}

.score-text {
  font-size: 15px;
  font-weight: 700;
  color: #475569;
  transition: color 0.3s ease;
}

.score-num {
  font-size: 22px;
  font-weight: 850;
  color: #182230;
  margin: 0 3px;
  transition: color 0.3s ease;
}

.score-slash {
  font-size: 14px;
  color: #98a2b3;
  margin: 0 2px;
}

/* 深色模式适配 */
html[data-theme='dark'] .success-state {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border-color: rgba(34, 197, 94, 0.25);
}

html[data-theme='dark'] .error-state {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.25);
}

html[data-theme='dark'] .pending-state {
  background: rgba(217, 119, 6, 0.15);
  color: #fbbf24;
  border-color: rgba(217, 119, 6, 0.25);
}

html[data-theme='dark'] .self-check-state {
  background: #334155;
  color: #cbd5e1;
  border-color: #475569;
}

html[data-theme='dark'] .score-text {
  color: #94a3b8;
}

html[data-theme='dark'] .score-num {
  color: #f4f7fb;
}
</style>
