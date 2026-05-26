<template>
  <div class="execution-progress" v-if="steps.length > 0">
    <div class="execution-steps">
      <div
        v-for="step in steps"
        :key="step.stepName"
        class="execution-step"
        :class="step.status"
      >
        <span class="step-status-icon">
          <!-- 完成 -->
          <svg v-if="step.status === 'completed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="14" height="14">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          <!-- 执行中 -->
          <span v-else-if="step.status === 'running'" class="step-spinner"></span>
          <!-- 失败 -->
          <svg v-else-if="step.status === 'failed'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
          <!-- 等待中 -->
          <span v-else class="step-dot-pending"></span>
        </span>
        <span class="step-name">{{ step.stepName }}</span>
        <span class="step-time" v-if="step.status === 'completed' && step.completedAt && step.startedAt">
          {{ ((step.completedAt - step.startedAt) / 1000).toFixed(1) }}s
        </span>
      </div>
    </div>
    <div class="execution-bar">
      <div
        class="execution-bar-fill"
        :style="{ width: completionPercent + '%' }"
      ></div>
    </div>
    <span class="execution-status-text">
      {{ completedCount }}/{{ steps.length }} 完成 · {{ statusText }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { ExecutionStep } from '@/api/agent'

const props = defineProps<{
  steps: ExecutionStep[]
}>()

const completedCount = computed(() => props.steps.filter(s => s.status === 'completed').length)
const completionPercent = computed(() => {
  if (!props.steps.length) return 0
  return Math.round((completedCount.value / props.steps.length) * 100)
})
const statusText = computed(() => {
  const running = props.steps.find(s => s.status === 'running')
  if (running) return running.stepName
  const failed = props.steps.find(s => s.status === 'failed')
  if (failed) return '有步骤执行失败'
  if (completedCount.value === props.steps.length) return '全部完成'
  return '等待执行...'
})
</script>

<style scoped>
.execution-progress {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px 14px;
  background: var(--background-color-base, #f1f5f9);
  border-radius: var(--radius-lg, 0.75rem);
}

.execution-steps {
  display: flex;
  flex-wrap: wrap;
  gap: 6px 16px;
}

.execution-step {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.75rem;
  color: var(--text-muted, #94a3b8);
  transition: color 0.2s ease;
}
.execution-step.completed {
  color: var(--success-color, #10b981);
}
.execution-step.running {
  color: var(--primary-color, #3b82f6);
}
.execution-step.failed {
  color: var(--danger-color, #ef4444);
}

.step-status-icon {
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.step-spinner {
  width: 12px;
  height: 12px;
  border: 2px solid var(--border-light, rgba(148, 163, 184, 0.2));
  border-top-color: var(--primary-color, #3b82f6);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

.step-dot-pending {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border-default, #e2e8f0);
}

.step-name {
  white-space: nowrap;
}
.step-time {
  font-size: 0.625rem;
  opacity: 0.7;
}

.execution-bar {
  height: 3px;
  background: var(--border-default, #e2e8f0);
  border-radius: 2px;
  overflow: hidden;
}
.execution-bar-fill {
  height: 100%;
  background: var(--gradient-primary);
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.execution-status-text {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
