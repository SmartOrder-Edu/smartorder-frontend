<template>
  <div class="plan-status-card" :class="statusClass">
    <!-- 规划审阅阶段 -->
    <template v-if="isAwaitingConfirmation">
      <div class="card-header">
        <span class="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
            <path d="M9 11l3 3L22 4"/>
            <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
          </svg>
        </span>
        <span class="card-title">已生成学习计划</span>
      </div>
      <p class="card-goal">{{ taskList.userGoal }}</p>
      <div class="card-stats">
        <span class="stat-item">{{ taskList.tasks.length }} 个任务</span>
        <span class="stat-sep">·</span>
        <span class="stat-item">{{ clarificationCount }} 需回答</span>
        <span class="stat-sep">·</span>
        <span class="stat-item">{{ confirmationCount }} 需确认</span>
      </div>
      <div class="card-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12">
          <line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
          <circle cx="12" cy="12" r="10"/>
        </svg>
        <span>完整任务列表已展示在右侧面板中</span>
      </div>
      <button class="card-confirm-btn" @click="$emit('confirm')" :disabled="confirming">
        <span class="step-spinner-white" v-if="confirming"></span>
        {{ confirming ? '确认中...' : '确认执行' }}
      </button>
    </template>

    <!-- 执行阶段 -->
    <template v-else>
      <div class="card-header">
        <span class="card-icon executing">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
            <polyline points="13,2 3,14 12,14 11,22 21,10 12,10"/>
          </svg>
        </span>
        <span class="card-title">{{ statusLabel }}</span>
      </div>
      <p class="card-goal">{{ taskList.userGoal }}</p>
      <div class="card-progress">
        <div class="progress-bar-mini">
          <div class="progress-fill-mini" :style="{ width: progressPercent + '%' }"></div>
        </div>
        <span class="progress-text">{{ completedCount }}/{{ totalCount }} 完成</span>
      </div>
      <div class="card-current" v-if="currentRunningDesc">
        <span class="current-spinner"></span>
        <span class="current-text">{{ currentRunningDesc }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TaskList } from '@/types/planExecute'

const props = defineProps<{
  taskList: TaskList
  confirming?: boolean
  completedCount?: number
  totalCount?: number
  currentRunningDesc?: string
}>()

defineEmits<{
  confirm: []
}>()

const isAwaitingConfirmation = computed(() => {
  return props.taskList.status === 'DRAFT'
    || props.taskList.status === 'PENDING_CONFIRM'
    || props.taskList.status === 'WAITING_CONFIRMATION'
    || props.taskList.status === 'PAUSED_CONFIRMATION'
})

const clarificationCount = computed(() =>
  props.taskList.tasks.filter(t => t.gate === 'CLARIFICATION').length
)
const confirmationCount = computed(() =>
  props.taskList.tasks.filter(t => t.gate === 'CONFIRMATION').length
)

const progressPercent = computed(() => {
  if (!props.totalCount) return 0
  return Math.round(((props.completedCount || 0) / props.totalCount) * 100)
})

const statusLabel = computed(() => {
  switch (props.taskList.status) {
    case 'EXECUTING': return '执行中'
    case 'COMPLETED': return '已完成'
    case 'FAILED': return '执行失败'
    case 'CANCELLED': return '已取消'
    case 'PAUSED_CLARIFICATION':
    case 'PAUSED_CONFIRMATION': return '已暂停'
    default: return '执行中'
  }
})

const statusClass = computed(() => {
  if (isAwaitingConfirmation.value) return 'status-draft'
  if (props.taskList.status === 'COMPLETED') return 'status-completed'
  if (props.taskList.status === 'FAILED') return 'status-failed'
  return 'status-executing'
})
</script>

<style scoped>
.plan-status-card {
  background: linear-gradient(135deg, #f0f7ff 0%, #eef2ff 50%, #f5f3ff 100%);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: var(--radius-lg, 0.75rem);
  padding: 12px 14px;
  margin-top: 8px;
}

.plan-status-card.status-completed {
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
  border-color: rgba(16, 185, 129, 0.2);
}

.plan-status-card.status-failed {
  background: linear-gradient(135deg, #fef2f2 0%, #fef5f5 100%);
  border-color: rgba(239, 68, 68, 0.15);
}

.card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.card-icon {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.card-icon.executing {
  background: linear-gradient(135deg, #3b82f6, #6366f1);
}

.card-title {
  font-size: 0.75rem;
  font-weight: 700;
  color: var(--text-dark, #0f172a);
}

.card-goal {
  margin: 0 0 8px;
  font-size: 0.8125rem;
  color: var(--text-secondary, #475569);
  line-height: 1.4;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-stats {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-bottom: 8px;
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}

.stat-sep {
  opacity: 0.4;
}

.card-hint {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: rgba(59, 130, 246, 0.05);
  border-radius: 6px;
  margin-bottom: 10px;
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
}

.card-confirm-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  width: 100%;
  padding: 8px 0;
  border: none;
  border-radius: var(--radius-md, 0.5rem);
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  color: white;
  font-size: 0.8125rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
}

.card-confirm-btn:hover:not(:disabled) {
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

.card-confirm-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.step-spinner-white {
  width: 12px;
  height: 12px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

/* 执行阶段 */
.card-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.progress-bar-mini {
  flex: 1;
  height: 3px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill-mini {
  height: 100%;
  background: var(--gradient-primary, linear-gradient(135deg, #3b5bdb, #6366f1));
  border-radius: 2px;
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

.progress-text {
  font-size: 0.6875rem;
  color: var(--text-muted, #94a3b8);
  font-variant-numeric: tabular-nums;
  flex-shrink: 0;
}

.card-current {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.6875rem;
  color: var(--primary-color, #3b5bdb);
}

.current-spinner {
  width: 8px;
  height: 8px;
  border: 1.5px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  flex-shrink: 0;
}

.current-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}
</style>
